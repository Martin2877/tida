import { translateID } from '../windows/Translator/components/TargetArea';
import { invoke } from '@tauri-apps/api/tauri';
import { fetch } from '@tauri-apps/api/http';
import HmacSHA1 from 'crypto-js/hmac-sha1';
// import base64 from 'crypto-js/enc-base64';
import { get } from '../windows/main';
import CryptoJS from 'crypto-js';

export const info = {
    name: 'censys',
    // https://help.aliyun.com/document_detail/158269.html?spm=a2c4g.158244.0.0.5aef5b72sLGDTO
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
            config_key: 'censys_api_id',
            place_hold: '',
        },
        {
            config_key: 'censys_secret',
            place_hold: '',
        },
    ],
};
//必须向外暴露translate
export async function translate(text, from, to, setText, id) {
    // 获取语言映射
    const { supportLanguage } = info;
    // 获取设置项
    const apiid = get('censys_api_id') ?? '';
    const secret = get('censys_secret') ?? '';
    // const accesskey_secret = get('alibaba_accesskey_secret') ?? '';

    function getRandomNumber() {
        const rand = Math.floor(Math.random() * 99999) + 100000;
        return rand * 1000;
    }
    if (apiid === '' || secret === '') {
        throw 'Please configure API ID and Secret';
    }
    if (!(from in supportLanguage) || !(to in supportLanguage)) {
        throw 'Unsupported Language';
    }

    let today = new Date();
    let timestamp = today.toISOString().replaceAll(/\.[0-9]*/g, '');
    let endpoint = 'https://search.censys.io';
    let res;
    let url_path = '/api/v2/hosts/';
    let CanonicalizedQueryString = endpoint + url_path;

    if (!/^\d{1,3}(\.\d{1,3}){3}/.test(text)) {
        throw 'value is not a valid IP address';
    }
    CanonicalizedQueryString = CanonicalizedQueryString + text;
    // setText(text);
    res = await fetch(CanonicalizedQueryString, {
        method: 'GET',
        headers: {
            Authorization: 'Basic ' + CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(apiid + ':' + secret)),
            'Content-Type': 'application/json',
        },
    });
    // setText("<h1>fsdfasdf</h1>");

    if (res.ok) {
        let result = res.data;

        if (result['code'] === 200) {
            let txt = '';
            let services = result['result']['services'];
            txt = 'total: ' + services.length + '\n';
            for (var i = 0; i < services.length; i++) {
                let service = services[i];
                txt = txt + service['_decoded'] + '\t' + service['port'] + '\n';
            }
            txt += '详情可见：' + CanonicalizedQueryString;
            setText(txt);
            //     if (result['Data']['Translated'] === text) {
            //         let secondLanguage = get('second_language') ?? 'en';
            //         if (to !== secondLanguage) {
            //             await translate(text, from, secondLanguage, setText, id);
            //             return;
            //         }
            //     }
            //     if (translateID.includes(id)) {
            //         setText(result['Data']['Translated'].trim());
            //     }
        } else {
            throw JSON.stringify(result);
        }
    } else {
        throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(res.data)}`;
    }
}
