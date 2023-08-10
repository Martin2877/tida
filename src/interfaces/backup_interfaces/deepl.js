import { translateID } from '../../windows/Translator/components/TargetArea';
import { fetch, Body } from '@tauri-apps/api/http';
import { get } from '../../windows/main';

export const info = {
    name: 'deepl',
    // https://www.deepl.com/zh/docs-api/translate-text/translate-text/
    supportLanguage: {
        auto: 'auto',
        zh_cn: 'ZH',
        zh_tw: 'ZH',
        ja: 'JA',
        en: 'EN',
        ko: 'KO',
        fr: 'FR',
        es: 'ES',
        ru: 'RU',
        de: 'DE',
        it: 'IT',
        tr: 'TR',
        pt: 'PT-PT',
        pt_br: 'PT-BR',
        id: 'ID',
    },
    // 接口需要配置项
    needs: [
        {
            config_key: 'deepl_key',
            place_hold: 'config.interface.deeplhelp',
        },
    ],
};

export async function translate(text, from, to, setText, id) {
    const key = get('deepl_key') ?? '';

    const { supportLanguage } = info;

    if (!(from in supportLanguage) || !(to in supportLanguage)) {
        throw 'Unsupported Language';
    }

    if (key !== '') {
        await translate_by_key(text, from, to, setText, id, key);
        return;
    }

    const url = 'https://www2.deepl.com/jsonrpc';
    const rand = getRandomNumber();
    const body = {
        jsonrpc: '2.0',
        method: 'LMT_handle_texts',
        params: {
            splitting: 'newlines',
            lang: {
                source_lang_user_selected: from !== 'auto' ? supportLanguage[from].slice(0, 2) : 'auto',
                target_lang: supportLanguage[to].slice(0, 2),
            },
            texts: [{ text, requestAlternatives: 3 }],
            timestamp: getTimeStamp(getICount(text)),
        },
        id: rand,
    };

    let body_str = JSON.stringify(body);

    if ((rand + 5) % 29 === 0 || (rand + 3) % 13 === 0) {
        body_str = body_str.replace('"method":"', '"method" : "');
    } else {
        body_str = body_str.replace('"method":"', '"method": "');
    }

    let res = await fetch(url, {
        method: 'POST',
        body: Body.text(body_str),
        headers: { 'Content-Type': 'application/json' },
    });

    if (res.ok) {
        let result = res.data;
        if (result && result.result && result.result.texts && result.result.lang) {
            if (result.result.lang === supportLanguage[to].slice(0, 2)) {
                let secondLanguage = get('second_language') ?? 'en';
                if (secondLanguage !== to) {
                    await translate(text, from, secondLanguage, setText, id);
                    return;
                }
            }
            if (translateID.includes(id)) {
                setText(result.result.texts[0].text.trim());
            }
        } else {
            throw JSON.stringify(result);
        }
    } else {
        throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(res.data)}`;
    }
}

async function translate_by_key(text, from, to, setText, id, key) {
    const { supportLanguage } = info;
    const headers = {
        'Content-Type': 'application/json',
        Authorization: `DeepL-Auth-Key ${key}`,
    };
    let body = {
        text: [text],
        target_lang: supportLanguage[to],
    };
    if (from !== 'auto') {
        body['source_lang'] = supportLanguage[from];
    }
    let url = 'https://api-free.deepl.com/v2/translate';
    if (!key.endsWith(':fx')) {
        url = 'https://api.deepl.com/v2/translate';
    }
    let res = await fetch(url, {
        method: 'POST',
        body: Body.json(body),
        headers: headers,
    });

    if (res.ok) {
        const result = res.data;
        if ((result.translations, result.translations[0])) {
            if (result.translations[0]['detected_source_language'] === supportLanguage[to].slice(0, 2)) {
                let secondLanguage = get('second_language') ?? 'en';
                if (secondLanguage !== to) {
                    await translate_by_key(text, from, secondLanguage, setText, id, key);
                    return;
                }
            }
            if (translateID.includes(id)) {
                setText(result.translations[0].text.trim());
            }
        } else {
            throw JSON.stringify(result);
        }
    } else {
        throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(res.data)}`;
    }
}

function getTimeStamp(iCount) {
    const ts = Date.now();
    if (iCount !== 0) {
        iCount = iCount + 1;
        return ts - (ts % iCount) + iCount;
    } else {
        return ts;
    }
}

function getICount(translate_text) {
    return translate_text.split('i').length - 1;
}

function getRandomNumber() {
    const rand = Math.floor(Math.random() * 99999) + 100000;
    return rand * 1000;
}
