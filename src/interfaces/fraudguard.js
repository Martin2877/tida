import { translateID } from '../windows/Translator/components/TargetArea';
import { invoke } from '@tauri-apps/api/tauri';
import { fetch } from '@tauri-apps/api/http';
import HmacSHA1 from 'crypto-js/hmac-sha1';
// import base64 from 'crypto-js/enc-base64';
import { get } from '../windows/main';
import CryptoJS from 'crypto-js';

export const info = {
    name: 'FraudGuard',
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
            config_key: 'FraudGuard_username',
            place_hold: '',
        },
        {
            config_key: 'FraudGuard_password',
            place_hold: '',
        },
    ],
};
//必须向外暴露translate
export async function translate(text, from, to, setText, id) {
    // 获取语言映射
    const { supportLanguage } = info;
    // 获取设置项
    const username = get('FraudGuard_username') ?? '';
    const password = get('FraudGuard_password') ?? '';
    // const accesskey_secret = get('alibaba_accesskey_secret') ?? '';

    function getRandomNumber() {
        const rand = Math.floor(Math.random() * 99999) + 100000;
        return rand * 1000;
    }
    if (username == '' || password == '') {
        throw 'Please configure API Keys Username and Password';
    }
    if (!(from in supportLanguage) || !(to in supportLanguage)) {
        throw 'Unsupported Language';
    }

    let today = new Date();
    let timestamp = today.toISOString().replaceAll(/\.[0-9]*/g, '');
    let endpoint = 'https://api.fraudguard.io';
    let doamin_path = '/v2/hostname/';
    let ip_path = '/v2/ip/';
    if (/^http\:\/\//.test(text)) {
        text = text.replace(/^https?\:\/\//, '').replace(/\/?$/, '');
        // setText(text);
    }
    let CanonicalizedQueryString;
    let res;
    // setText(text);
    if (/\d{1,3}(\.\d{1,3}){3}/.test(text)) {
        CanonicalizedQueryString = endpoint + ip_path + text;

        res = await fetch(CanonicalizedQueryString, {
            method: 'GET',
            headers: {
                Authorization:
                    'Basic ' + CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(username + ':' + password)),
            },
        });
        if (res.ok) {
            let result = res.data;
            let txt = '';
            for (var key in result) {
                txt += key + ': ' + result[key] + '\n';
            }
            setText(txt);
        } else {
            throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(res.data)}`;
        }
    } else {
        CanonicalizedQueryString = endpoint + doamin_path + text;
        res = await fetch(CanonicalizedQueryString, {
            method: 'GET',
            headers: {
                Authorization:
                    'Basic ' + CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(username + ':' + password)),
            },
        });
        if (res.ok) {
            let txt = '';
            let result = res.data;
            for (var key in result) {
                txt += key + ': ' + result[key] + '\n';
            }
            setText(txt);
        } else {
            throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(res.data)}`;
        }
    }
}
