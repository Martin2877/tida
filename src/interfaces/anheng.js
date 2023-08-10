import { translateID } from '../windows/Translator/components/TargetArea';
import { invoke } from '@tauri-apps/api/tauri';
import { fetch } from '@tauri-apps/api/http';
import HmacSHA1 from 'crypto-js/hmac-sha1';
// import base64 from 'crypto-js/enc-base64';
import { get } from '../windows/main';
import CryptoJS from 'crypto-js';

export const info = {
    name: 'anheng',
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
            config_key: 'anheng_authorization',
            place_hold: '',
        },
    ],
};
//必须向外暴露translate
export async function translate(text, from, to, setText, id) {
    // 获取语言映射
    const { supportLanguage } = info;
    // 获取设置项
    const authorization = get('anheng_authorization') ?? '';
    // const accesskey_secret = get('alibaba_accesskey_secret') ?? '';

    function getRandomNumber() {
        const rand = Math.floor(Math.random() * 99999) + 100000;
        return rand * 1000;
    }
    if (authorization === '') {
        throw 'Please configure Authorization';
    }
    if (!(from in supportLanguage) || !(to in supportLanguage)) {
        throw 'Unsupported Language';
    }

    let today = new Date();
    let timestamp = today.toISOString().replaceAll(/\.[0-9]*/g, '');
    let endpoint = 'https://ti.dbappsecurity.com.cn';
    let res;

    let ip_url_path = '/web/v2/search/ip/threatIntelligence/intelligenceInfor';
    let domain_url_path = '/web/search/domain/threatIntelligence/intelligenceInfor';
    let CanonicalizedQueryString = endpoint + domain_url_path;
    if (/^http\:\/\//.test(text)) {
        text = text.replace(/^https?\:\/\//, '').replace(/\/?$/, '');
        // setText(text);
    }
    if (/^\d{1,3}(\.\d{1,3}){3}/.test(text)) {
        CanonicalizedQueryString = endpoint + ip_url_path;
    }
    // setText(text);
    res = await fetch(CanonicalizedQueryString, {
        method: 'POST',
        headers: {
            Authorization: authorization,
            'Content-Type': 'application/json',
        },
        body: {
            type: 'Json',
            payload: {
                page: 1,
                size: 10,
                searchField: text,
            },
        },
    });
    // setText("<h1>fsdfasdf</h1>");

    if (res.ok) {
        let result = res.data;
        if (result['errcode'] === 0) {
            let txt = 'total: ' + result['data']['total'] + '\n';
            let data = result['data']['data'];
            txt += 'sourceType\t|\tconfidence\t|\ttags\n';
            for (var i = 0; i < data.length; i++) {
                txt += data[i]['sourceType'] + '\t|\t' + data[i]['confidence'] + '\t|\t';
                let tags = data[i]['tags'];
                let tagname = '';
                for (var j = 0; j < tags.length; j++) {
                    if (j == 0) {
                        tagname = tags[j]['name'];
                    } else {
                        tagname += ',' + tags[j]['name'];
                    }
                }
                txt += tagname + '\n';
            }
            txt += '详情可见：' + 'https://ti.dbappsecurity.com.cn/';
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
