import { translateID } from '../windows/Translator/components/TargetArea';
import { invoke } from '@tauri-apps/api/tauri';
import { http } from '@tauri-apps/api';
import HmacSHA1 from 'crypto-js/hmac-sha1';
import { get } from '../windows/main';
import CryptoJS from 'crypto-js';

export const info = {
    name: 'focsec',
    supportLanguage: {
        auto: 'auto',
        zh_cn: 'zh',
        zh_tw: 'zh-tw',
        yue: 'yue',
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
            config_key: 'focsec_apikey',
            place_hold: '',
        },
        // {
        //     config_key: 'censys_secret',
        //     place_hold: '',
        // },
    ],
};
//必须向外暴露translate
export async function translate(text, from, to, setText, id) {
    // 获取语言映射
    const { supportLanguage } = info;
    // 获取设置项
    const apikey = get('focsec_apikey') ?? '';
    // const secret = get('censys_secret') ?? '';
    // const accesskey_secret = get('alibaba_accesskey_secret') ?? '';

    function getRandomNumber() {
        const rand = Math.floor(Math.random() * 99999) + 100000;
        return rand * 1000;
    }
    if (apikey === '') {
        throw 'Please configure API Key';
    }
    if (!(from in supportLanguage) || !(to in supportLanguage)) {
        throw 'Unsupported Language';
    }

    let today = new Date();
    let timestamp = today.toISOString().replaceAll(/\.[0-9]*/g, '');
    let endpoint = 'https://api.focsec.com/v1/ip/';
    let res;
    let CanonicalizedQueryString = endpoint + text + '?api_key=' + apikey;

    if (!/\d{1,3}(\.\d{1,3}){3}/.test(text)) {
        throw 'Given IP is not valid';
    }
    res = await http.fetch(CanonicalizedQueryString, {
        method: 'GET',
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        },
    });

    if (res.ok) {
        let result = res.data;
        let txt = '';
        for (var key in result) {
            txt += key + ': ' + result[key] + '\n';
        }
        setText(txt);
    }
}
