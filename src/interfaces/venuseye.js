import { translateID } from '../windows/Translator/components/TargetArea';
import { invoke } from '@tauri-apps/api/tauri';
import { fetch } from '@tauri-apps/api/http';
import HmacSHA1 from 'crypto-js/hmac-sha1';
// import base64 from 'crypto-js/enc-base64';
import { get } from '../windows/main';
import CryptoJS from 'crypto-js';

export const info = {
    name: 'venuseye',
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
            config_key: 'venuseye_uid',
            place_hold: '',
        },
    ],
};
//必须向外暴露translate
export async function translate(text, from, to, setText, id) {
    // 获取语言映射
    const { supportLanguage } = info;
    // 获取设置项
    const uid = get('venuseye_uid') ?? '';
    // const accesskey_secret = get('alibaba_accesskey_secret') ?? '';

    function getRandomNumber() {
        const rand = Math.floor(Math.random() * 99999) + 100000;
        return rand * 1000;
    }
    if (uid === '') {
        throw 'Please configure uid';
    }
    if (!(from in supportLanguage) || !(to in supportLanguage)) {
        throw 'Unsupported Language';
    }

    let today = new Date();
    let timestamp = today.toISOString().replaceAll(/\.[0-9]*/g, '');
    let endpoint = 'https://www.venuseye.com.cn';
    let res;

    let ip_path = '/ve/ip/ioc';
    let domain_path = '/ve/domain/ioc';
    let CanonicalizedQueryString = endpoint + domain_path;
    if (/^http\:\/\//.test(text)) {
        text = text.replace(/^https?\:\/\//, '').replace(/\/?$/, '');
        // setText(text);
    }
    if (/^\d{1,3}(\.\d{1,3}){3}/.test(text)) {
        CanonicalizedQueryString = endpoint + ip_path;
    }
    // setText(text);
    res = await fetch(CanonicalizedQueryString, {
        method: 'POST',
        headers: {
            Cookie: 'uid=' + uid,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: {
            type: 'Text',
            payload: 'target=' + text,
        },
    });
    // setText("<h1>fsdfasdf</h1>");

    if (res.ok) {
        let result = res.data;
        if (result['status_code'] === 200) {
            let data = result['data'];
            let ioc = data['ioc'];
            let txt = '';
            txt = 'total: ' + ioc.length + '\n';
            txt += 'categories' + '\t|\t' + 'threat_score\n';
            for (var i = 0; i < ioc.length; i++) {
                let category = ioc[i]['categories'].join(',');
                let score = ioc[i]['threat_score'];
                txt += category + '\t|\t' + score + '\n';
            }
            txt += '详情可见：https://www.venuseye.com.cn/';
            setText(txt);
            // if (result['Data']['Translated'] === text) {
            //     let secondLanguage = get('second_language') ?? 'en';
            //     if (to !== secondLanguage) {
            //         await translate(text, from, secondLanguage, setText, id);
            //         return;
            //     }
            // }
            // if (translateID.includes(id)) {
            //     setText(result['Data']['Translated'].trim());
            // }
        } else {
            throw JSON.stringify(result);
        }
    } else {
        throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(res.data)}`;
    }
}
