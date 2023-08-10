import { translateID } from '../../windows/Translator/components/TargetArea';
import { fetch } from '@tauri-apps/api/http';
import { get } from '../../windows/main';

export const info = {
    name: 'bing',
    // https://learn.microsoft.com/zh-CN/azure/cognitive-services/translator/language-support
    supportLanguage: {
        auto: '',
        zh_cn: 'zh-Hans',
        zh_tw: 'zh-Hant',
        yue: 'yue',
        en: 'en',
        ja: 'ja',
        ko: 'ko',
        fr: 'fr',
        es: 'es',
        ru: 'ru',
        de: 'de',
        it: 'it',
        tr: 'tr',
        pt: 'pt-pt',
        pt_br: 'pt',
        vi: 'vi',
        id: 'id',
        th: 'th',
        ms: 'ms',
        ar: 'ar',
        hi: 'hi',
    },

    needs: [],
};

export async function translate(text, from, to, setText, id) {
    const { supportLanguage } = info;

    if (!(to in supportLanguage) || !(from in supportLanguage)) {
        throw 'Unsupported Language';
    }
    const token_url = 'https://edge.microsoft.com/translate/auth';

    let token = await fetch(token_url, {
        method: 'GET',
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.42',
        },
        responseType: 2,
    });
    if (token.ok) {
        const url = 'https://api-edge.cognitive.microsofttranslator.com/translate';

        let res = await fetch(url, {
            method: 'POST',
            headers: {
                accept: '*/*',
                'accept-language': 'zh-TW,zh;q=0.9,ja;q=0.8,zh-CN;q=0.7,en-US;q=0.6,en;q=0.5',
                authorization: 'Bearer ' + token.data,
                'cache-control': 'no-cache',
                'content-type': 'application/json',
                pragma: 'no-cache',
                'sec-ch-ua': '"Microsoft Edge";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site',
                Referer: 'https://appsumo.com/',
                'Referrer-Policy': 'strict-origin-when-cross-origin',
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.42',
            },
            query: {
                from: supportLanguage[from],
                to: supportLanguage[to],
                'api-version': '3.0',
                includeSentenceLength: 'true',
            },
            body: { type: 'Json', payload: [{ Text: text }] },
        });

        if (res.ok) {
            let result = res.data;
            if (result[0].translations) {
                if (result[0].detectedLanguage) {
                    if (result[0].detectedLanguage.language === supportLanguage[to]) {
                        let secondLanguage = get('second_language') ?? 'en';
                        if (secondLanguage !== to) {
                            await translate(text, from, secondLanguage, setText, id);
                            return;
                        }
                    }
                }

                if (translateID.includes(id)) {
                    setText(result[0].translations[0].text.trim());
                }
            } else {
                throw JSON.stringify(result);
            }
        } else {
            throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(res.data)}`;
        }
    } else {
        throw 'token获取失败';
    }
}
