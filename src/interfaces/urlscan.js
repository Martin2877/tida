import { translateID } from '../windows/Translator/components/TargetArea';
import { invoke } from '@tauri-apps/api/tauri';
import { fetch } from '@tauri-apps/api/http';
import HmacSHA1 from 'crypto-js/hmac-sha1';
// import base64 from 'crypto-js/enc-base64';
import { get } from '../windows/main';
import CryptoJS from 'crypto-js';

export const info = {
    name: 'urlscan',
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
        // {
        //     config_key: 'anheng_authorization',
        //     place_hold: '',
        // },
    ],
};
//必须向外暴露translate
export async function translate(text, from, to, setText, id) {
    // 获取语言映射
    const { supportLanguage } = info;
    // 获取设置项
    // const authorization = get('anheng_authorization') ?? '';
    // const accesskey_secret = get('alibaba_accesskey_secret') ?? '';

    function getRandomNumber() {
        const rand = Math.floor(Math.random() * 99999) + 100000;
        return rand * 1000;
    }
    // if (authorization === '') {
    //     throw 'Please configure Authorization';
    // }
    if (!(from in supportLanguage) || !(to in supportLanguage)) {
        throw 'Unsupported Language';
    }

    let today = new Date();
    let timestamp = today.toISOString().replaceAll(/\.[0-9]*/g, '');
    let endpoint = 'https://urlscan.io';
    let res;

    let url_path = '/api/v1/search/';
    let CanonicalizedQueryString = endpoint + url_path;
    if (/^http\:\/\//.test(text)) {
        text = text.replace(/^https?\:\/\//, '').replace(/\/?$/, '');
        // setText(text);
    }

    CanonicalizedQueryString = CanonicalizedQueryString + '?q=' + text;
    // setText(text);
    // setText(CanonicalizedQueryString);
    res = await fetch(CanonicalizedQueryString);
    // setText("<h1>fsdfasdf</h1>");

    if (res.ok) {
        let result = res.data;
        let total = result['total'];
        let txt = '';
        txt += 'total: ' + total + '\n';
        let results = result['results'];
        // setText(JSON.stringify(results));
        for (var i = 0; i < results.length; i++) {
            let vis = results[i]['task']['visibility'];
            let url = results[i]['task']['url'];
            txt += vis + '\t|\t' + url + '\n';
        }
        txt += '详情可见：' + CanonicalizedQueryString;
        setText(txt);
        // if (result['Code'] === '200') {
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
        // } else {
        //     throw JSON.stringify(result);
        // }
    } else {
        throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(res.data)}`;
    }
}
