import { translateID } from '../windows/Translator/components/TargetArea';
import { invoke } from '@tauri-apps/api/tauri';
import { fetch } from '@tauri-apps/api/http';
import HmacSHA1 from 'crypto-js/hmac-sha1';
// import base64 from 'crypto-js/enc-base64';
import { get } from '../windows/main';
import CryptoJS from 'crypto-js';

export const info = {
    name: 'nsfocus',
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
            config_key: 'nsfocus_apikey',
            place_hold: '',
        },
        // {
        //     config_key: 'alibaba_accesskey_secret',
        //     place_hold: '',
        // },
    ],
};
//必须向外暴露translate
export async function translate(text, from, to, setText, id) {
    // 获取语言映射
    const { supportLanguage } = info;
    // 获取设置项
    const accesskey = get('nsfocus_apikey') ?? '';
    // const accesskey_secret = get('alibaba_accesskey_secret') ?? '';

    function getRandomNumber() {
        const rand = Math.floor(Math.random() * 99999) + 100000;
        return rand * 1000;
    }
    if (accesskey === '') {
        throw 'Please configure AccessKey';
    }
    if (!(from in supportLanguage) || !(to in supportLanguage)) {
        throw 'Unsupported Language';
    }

    let today = new Date();
    let timestamp = today.toISOString().replaceAll(/\.[0-9]*/g, '');
    let endpoint = 'https://nti.nsfocus.com';
    let ip_url_path = '/api/v2/objects/ioc-ipv4/';
    let url_url_path = '/api/v2/objects/ioc-url/';
    let domain_url_path = '/api/v2/objects/ioc-domain/';
    let CanonicalizedQueryString = '';
    let res;
    // setText(text);
    if (/^\d{1,3}(\.\d{1,3}){3}/.test(text)) {
        // setText("aaa");
        CanonicalizedQueryString = endpoint + ip_url_path;
        let param = 'query=' + text;
        CanonicalizedQueryString = CanonicalizedQueryString + '?' + param;
        res = await fetch(CanonicalizedQueryString, {
            method: 'GET',
            headers: {
                'X-Ns-Nti-Key': accesskey,
                Accept: 'application/nsfocus.nti.spec+json; version=2.0',
                'Accept-encoding': 'gzip',
            },
        });
        // setText(accesskey);
    } else if (/^https?\:\/\//.test(text)) {
        CanonicalizedQueryString = endpoint + url_url_path;
        // setText("aaa");
        let param = 'query=' + CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text));
        // setText(param);
        CanonicalizedQueryString = CanonicalizedQueryString + '?' + param;
        res = await fetch(CanonicalizedQueryString, {
            method: 'GET',
            headers: {
                'X-Ns-Nti-Key': accesskey,
                Accept: 'application/nsfocus.nti.spec+json; version=2.0',
                'Accept-encoding': 'gzip',
            },
        });

        // if (res.ok){
        //     let self_url = res.data['data']['links']['self'];
        //     // setText(self_url);
        //     res = await fetch(self_url, {
        //         method: 'GET',
        //         headers: {
        //             "X-Apikey": accesskey
        //         }
        //     });
        // }
    } else {
        CanonicalizedQueryString = endpoint + domain_url_path;
        let param = 'query=' + text;
        CanonicalizedQueryString = CanonicalizedQueryString + '?' + param;
        res = await fetch(CanonicalizedQueryString, {
            method: 'GET',
            headers: {
                'X-Ns-Nti-Key': accesskey,
                Accept: 'application/nsfocus.nti.spec+json; version=2.0',
                'Accept-encoding': 'gzip',
            },
        });
    }

    if (res.ok) {
        let result = res.data;
        let data = result['objects'];
        let txt = 'total: ' + data.length + '\n';
        txt += 'type\t|\tthreat_level\t|\tconfidenc\n';
        for (var i = 0; i < data.length; i++) {
            txt += data[i]['type'] + '\t|\t' + data[i]['threat_level'] + '\t|\t' + data[i]['confidence'] + '\n';
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
