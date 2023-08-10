import { translateID } from '../windows/Translator/components/TargetArea';
import { invoke } from '@tauri-apps/api/tauri';
import { fetch } from '@tauri-apps/api/http';
import HmacSHA1 from 'crypto-js/hmac-sha1';
import base64 from 'crypto-js/enc-base64';
import { get } from '../windows/main';

export const info = {
    name: 'qianxin',
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
            config_key: 'qianxin_apikey',
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
    const accesskey = get('qianxin_apikey') ?? '';
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
    let endpoint = 'https://ti.qianxin.com';
    let url_path = '/api/v2/compromise';
    let CanonicalizedQueryString = endpoint + url_path;
    let res;
    if (/^http\:\/\//.test(text)) {
        text = text.replace(/^https?\:\/\//, '').replace(/\/?$/, '');
        // setText(text);
    }
    // setText(text);
    let param = 'apikey=' + accesskey + '&' + 'param=' + text;
    CanonicalizedQueryString = CanonicalizedQueryString + '?' + param;
    res = await fetch(CanonicalizedQueryString);

    if (res.ok) {
        let result = res.data;
        if (result['status'] == 10000) {
            let data = result['data'];
            let txt = 'ioc_category\t|\trisk\t|\tconfidence\t|\talert_name\n';
            for (var i = 0; i < data.length; i++) {
                let risk = data[i];
                txt +=
                    risk['ioc_category'] +
                    '\t|\t' +
                    risk['risk'] +
                    '\t|\t' +
                    risk['confidence'] +
                    '\t|\t' +
                    risk['alert_name'] +
                    '\n';
            }
            if (/\d{1,3}(\.\d{1,3}){3}/.test(txt)) {
                txt += '详情可见：' + 'https://ti.qianxin.com/v2/search?type=ip&value=' + text;
            } else {
                txt += '详情可见：' + 'https://ti.qianxin.com/v2/search?type=domain&value=' + text;
            }
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
