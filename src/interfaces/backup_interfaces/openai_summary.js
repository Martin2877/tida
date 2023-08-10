import { translateID } from '../windows/Translator/components/TargetArea';
import { fetch } from '@tauri-apps/api/http';
import { get } from '../windows/main';

export const info = {
    name: 'openai_summary',
    supportLanguage: {
        zh_cn: 'Simplified Chinese',
        zh_tw: 'Traditional Chinese',
        yue: 'Cantonese',
        ja: 'Japanese',
        en: 'English',
        ko: 'Korean',
        fr: 'French',
        es: 'Spanish',
        ru: 'Russian',
        de: 'German',
        it: 'Italian',
        tr: 'Turkish',
        pt: 'Portuguese',
        pt_br: 'Brazilian Portuguese',
        vi: 'Vietnamese',
        id: 'Indonesian',
        th: 'Thai',
        ms: 'Malay',
        ar: 'Arabic',
        hi: 'Hindi',
    },
    needs: [
        {
            config_key: 'openai_summary_prompt',
            place_hold: "default: You are a text summarizer, you can only summarize the text, don't interpret it.",
        },
    ],
};

export async function translate(text, from, to, setText, id) {
    const { supportLanguage } = info;
    let domain = get('openai_domain') ?? 'api.openai.com';
    if (domain === '') {
        domain = 'api.openai.com';
    }
    if (domain.startsWith('http')) {
        domain = domain.replace('https://', '').replace('http://', '');
    }
    let path = get('openai_path') ?? '/v1/chat/completions';
    if (path === '') {
        path = '/v1/chat/completions';
    }
    const apikey = get('openai_apikey') ?? '';
    if (apikey === '') {
        throw 'Please configure apikey';
    }
    let model = get('openai_model') ?? 'gpt-3.5-turbo';
    if (model === '') {
        model = 'gpt-3.5-turbo';
    }
    let systemPrompt = get('openai_summary_prompt') ?? '';
    if (systemPrompt === '') {
        systemPrompt = "You are a text summarizer, you can only summarize the text, don't interpret it.";
    }
    let userPrompt = `Summarize in ${supportLanguage[to]}:\n"""\n${text}\n"""`;
    const stream = get('openai_stream') ?? false;
    const service = get('openai_service') ?? 'openai';

    const headers =
        service === 'openai'
            ? {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${apikey}`,
              }
            : {
                  'Content-Type': 'application/json',
                  'api-key': apikey,
              };

    let body = {
        temperature: 0,
        max_tokens: 1000,
        stream: stream,
        top_p: 1,
        frequency_penalty: 1,
        presence_penalty: 1,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
    };
    if (service === 'openai') {
        body['model'] = model;
    }

    if (stream) {
        const res = await window.fetch(`https://${domain}${path}`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body),
        });
        if (res.ok) {
            let target = '';
            const reader = res.body.getReader();
            try {
                let temp = '';
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        if (translateID.includes(id)) {
                            setText(target.trim());
                        }
                        break;
                    }
                    const str = new TextDecoder().decode(value);
                    let datas = str.split('data:');
                    for (let data of datas) {
                        if (data.trim() !== '' && data.trim() !== '[DONE]') {
                            try {
                                if (temp !== '') {
                                    data = temp + data.trim();
                                    let result = JSON.parse(data.trim());
                                    if (result.choices[0].delta.content) {
                                        target += result.choices[0].delta.content;
                                        if (translateID.includes(id)) {
                                            setText(target + '_');
                                        }
                                    }
                                    temp = '';
                                } else {
                                    let result = JSON.parse(data.trim());
                                    if (result.choices[0].delta.content) {
                                        target += result.choices[0].delta.content;
                                        if (translateID.includes(id)) {
                                            setText(target + '_');
                                        }
                                    }
                                }
                            } catch {
                                temp = data.trim();
                            }
                        }
                    }
                }
            } finally {
                reader.releaseLock();
            }
        } else {
            let errres = await fetch(`${url}${path}`, {
                method: 'POST',
                headers: headers,
                body: { type: 'Json', payload: body },
            });
            throw `Http Request Error\nHttp Status: ${errres.status}\n${JSON.stringify(errres.data)}`;
        }
    } else {
        let res = await fetch(`https://${domain}${path}`, {
            method: 'POST',
            headers: headers,
            body: { type: 'Json', payload: body },
        });
        if (res.ok) {
            let result = res.data;
            const { choices } = result;
            if (choices) {
                let target = choices[0].message.content.trim();
                if (target) {
                    if (target.startsWith('"')) {
                        target = target.slice(1);
                    }
                    if (target.endsWith('"')) {
                        target = target.slice(0, -1);
                    }
                    if (translateID.includes(id)) {
                        setText(target.trim());
                    }
                } else {
                    throw JSON.stringify(choices);
                }
            } else {
                throw JSON.stringify(result);
            }
        } else {
            throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(res.data)}`;
        }
    }
}
