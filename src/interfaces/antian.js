import { translateID } from '../windows/Translator/components/TargetArea';
import { invoke } from '@tauri-apps/api/tauri';
import { fetch } from '@tauri-apps/api/http';
import HmacSHA1 from 'crypto-js/hmac-sha1';
// import base64 from 'crypto-js/enc-base64';
import { get } from '../windows/main';
import CryptoJS from 'crypto-js';

export const info = {
    name: 'antian',
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
        //     config_key: 'antian_apikey',
        //     place_hold: '',
        // },
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
    const accesskey = get('antian_apikey') ?? '';
    // const accesskey_secret = get('alibaba_accesskey_secret') ?? '';

    function getRandomNumber() {
        const rand = Math.floor(Math.random() * 99999) + 100000;
        return rand * 1000;
    }
    // if (accesskey === '') {
    //     throw 'Please configure AccessKey ID and AccessKey Secret';
    // }
    if (!(from in supportLanguage) || !(to in supportLanguage)) {
        throw 'Unsupported Language';
    }

    let today = new Date();
    let timestamp = today.toISOString().replaceAll(/\.[0-9]*/g, '');
    let endpoint = 'https://www.antiycloud.com';
    let url_path = '/api/v1/query/node/reputation';
    let CanonicalizedQueryString = endpoint + url_path;
    let res;
    let flag = 1;
    // setText(text);
    if (/^\d{1,3}(\.\d{1,3}){3}/.test(text)) {
        // setText("aaa");
        let payload = {
            query: text,
            type: 'ip',
        };
        res = await fetch(CanonicalizedQueryString, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: {
                type: 'Json',
                payload: payload,
            },
        });
        // setText(accesskey);
    } else if (/^https?\:\/\//.test(text)) {
        flag = 2;
        let payload = {
            query: text,
            type: 'url',
        };
        res = await fetch(CanonicalizedQueryString, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: {
                type: 'Json',
                payload: payload,
            },
        });
    } else {
        flag = 3;
        let payload = {
            query: text,
            type: 'domain',
        };
        res = await fetch(CanonicalizedQueryString, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: {
                type: 'Json',
                payload: payload,
            },
        });
    }

    if (res.ok) {
        let result = res.data;
        if (result['status'] === 'success') {
            let txt = '情报源\t|\t首发时间\t|\t更新时间\t|\t标签\t|\t是否有效\t|\t权重\n';
            let data = result['data'];
            for (var key in data) {
                let data2 = data[key]['open_data'];
                for (var i = 0; i < data2.length; i++) {
                    txt +=
                        data2[i]['sourceName'] +
                        '\t|\t' +
                        data2[i]['first_seen'] +
                        '\t|\t' +
                        data2[i]['eventTime'] +
                        '\t|\t' +
                        data2[i]['tags'][0]['chinese_name'] +
                        '\t|\t';
                    if (data2[i]['valid'] == true) {
                        txt += '有效\t|\t';
                    } else {
                        txt += '无效\t|\t';
                    }
                    let weight = data2[i]['weight'];
                    txt += weight * 100 + '%\n';
                }
            }
            if (flag == 1) {
                txt += '详情可见：' + 'https://www.antiycloud.com/#/search/url?type=ip&key=' + text;
            } else if (flag == 2) {
                txt += '详情可见：' + 'https://www.antiycloud.com/#/search/url?type=url&key=' + text;
            } else if (flag == 3) {
                txt += '详情可见：' + 'https://www.antiycloud.com/#/search/url?type=domain&key=' + text;
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
