import { translateID } from '../windows/Translator/components/TargetArea';
import { fetch } from '@tauri-apps/api/http';
import { get } from '../windows/main';

export const info = {
    name: 'google',
    // https://cloud.google.com/translate/docs/languages?hl=zh-cn
    supportLanguage: {
        auto: 'auto',
        zh_cn: 'zh-CN',
        zh_tw: 'zh-TW',
        ja: 'ja',
        en: 'en',
        ko: 'ko',
        fr: 'fr',
        es: 'es',
        ru: 'ru',
        de: 'de',
        it: 'it',
        tr: 'tr',
        pt: 'pt',
        pt_br: 'pt',
        vi: 'vi',
        id: 'id',
        th: 'th',
        ms: 'ms',
        ar: 'ar',
        hi: 'hi',
    },
    needs: [
        {
            config_key: 'google_proxy',
            place_hold: 'default: translate.google.com',
        },
    ],
};

export async function translate(text, from, to, setText, id) {
    const { supportLanguage } = info;
    if (!(from in supportLanguage) || !(to in supportLanguage)) {
        throw 'Unsupported Language';
    }

    let domain = get('google_proxy') ?? 'translate.google.com';
    if (domain === '') {
        domain = 'translate.google.com';
    }

    let res = await fetch(
        `https://${domain}/translate_a/single?dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t`,
        {
            method: 'GET',
            query: {
                client: 'gtx',
                sl: supportLanguage[from],
                tl: supportLanguage[to],
                hl: supportLanguage[to],
                ie: 'UTF-8',
                oe: 'UTF-8',
                otf: '1',
                ssel: '0',
                tsel: '0',
                kc: '7',
                q: text,
            },
        }
    );
    if (res.ok) {
        let result = res.data;
        let target = '';
        if (result[2]) {
            if (result[2] === supportLanguage[to]) {
                let secondLanguage = get('second_language') ?? 'en';
                if (secondLanguage !== to) {
                    await translate(text, from, secondLanguage, setText, id);
                    return;
                }
            }
        }
        // 词典模式
        if (result[1]) {
            for (let i of result[1]) {
                // 词性
                target = target + '【词性】' + i[0] + '\n【释义】';
                for (let r of i[1]) {
                    target = target + r + ', ';
                }
                target = target + '\n【联想】\n';
                for (let r of i[2]) {
                    target = target + '  ' + r[0] + ':  ';
                    for (let j of r[1]) {
                        target = target + j + ', ';
                    }
                    target += '\n';
                }
                target += '\n';
            }
            if (translateID.includes(id)) {
                setText(target.trim());
            }
        } else {
            // 翻译模式
            for (let r of result[0]) {
                if (r[0]) {
                    target = target + r[0];
                }
            }
            if (translateID.includes(id)) {
                setText(target.trim());
            }
        }
    } else {
        throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(res.data)}`;
    }
}
