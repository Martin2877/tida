import { translateID } from '../windows/Translator/components/TargetArea';
import { invoke } from '@tauri-apps/api/tauri';
import { fetch } from '@tauri-apps/api/http';
import HmacSHA1 from 'crypto-js/hmac-sha1';
// import base64 from 'crypto-js/enc-base64';
import { get } from '../windows/main';
import CryptoJS from 'crypto-js';

export const info = {
    name: 'cloudmersive',
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
            config_key: 'virus_apikey',
            place_hold: '',
        },
    ],
};
//必须向外暴露translate
export async function translate(text, from, to, setText, id) {
    // 获取语言映射
    const { supportLanguage } = info;
    // 获取设置项
    const apikey = get('virus_apikey') ?? '';
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
    let endpoint = 'https://api.cloudmersive.com/virus/scan/website';
    let res;
    let CanonicalizedQueryString = endpoint;
    // if(/^http\:\/\//.test(text)){
    //     text = text.replace(/^https?\:\/\//, "").replace(/\/?$/, "")
    // }

    res = await fetch(CanonicalizedQueryString, {
        method: 'POST',
        headers: {
            Apikey: apikey,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: {
            type: 'Text',
            payload: 'Url=' + text,
        },
    });

    if (res.ok) {
        let result = res.data;
        let txt = 'CleanResult: ' + result['CleanResult'] + '\n';
        txt += 'WebsiteThreatType: ' + result['WebsiteThreatType'] + '\n';
        txt += 'FoundViruses: ' + result['FoundViruses'] + '\n';
        txt += 'WebsiteHttpResponseCode: ' + result['WebsiteHttpResponseCode'] + '\n';
        txt += '详情可见：' + CanonicalizedQueryString;
        setText(txt);
    } else {
        throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(res.data)}`;
    }
}
