import { translateID } from '../windows/Translator/components/TargetArea';
import { invoke } from '@tauri-apps/api/tauri';
import { fetch } from '@tauri-apps/api/http';
import HmacSHA1 from 'crypto-js/hmac-sha1';
// import base64 from 'crypto-js/enc-base64';
import { get } from '../windows/main';
import CryptoJS from 'crypto-js';

export const info = {
    name: 'securitytrails',
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
            config_key: 'securitytrails_apikey',
            place_hold: '',
        },
        // {
        //     config_key: 'sangfor_csrftoken',
        //     place_hold: '',
        // },
    ],
};
//必须向外暴露translate
export async function translate(text, from, to, setText, id) {
    // 获取语言映射
    const { supportLanguage } = info;
    // 获取设置项
    const apikey = get('securitytrails_apikey') ?? '';
    // const csrftoken = get('sangfor_csrftoken') ?? '';
    // const accesskey_secret = get('alibaba_accesskey_secret') ?? '';

    function getRandomNumber() {
        const rand = Math.floor(Math.random() * 99999) + 100000;
        return rand * 1000;
    }
    if (apikey == '') {
        throw 'Please configure API Key';
    }
    if (!(from in supportLanguage) || !(to in supportLanguage)) {
        throw 'Unsupported Language';
    }

    let today = new Date();
    let timestamp = today.toISOString().replaceAll(/\.[0-9]*/g, '');
    let endpoint = 'https://api.securitytrails.com';
    let doamin_path = '/v1/domain/';
    let ip_path = '/v1/search/list';
    if (/^http\:\/\//.test(text)) {
        text = text.replace(/^https?\:\/\//, '').replace(/\/?$/, '');
        // setText(text);
    }
    let CanonicalizedQueryString;
    let res;
    // setText(text);
    if (/\d{1,3}(\.\d{1,3}){3}/.test(text)) {
        CanonicalizedQueryString = endpoint + ip_path;
        let query = {
            filter: {
                ipv4: text,
            },
        };
        res = await fetch(CanonicalizedQueryString, {
            method: 'POST',
            headers: {
                apikey: apikey,
            },
            body: {
                type: 'Json',
                payload: query,
            },
        });
        if (res.ok) {
            let result = res.data;
            let records = result['records'];
            let txt = 'total: ' + records.length + '\n';
            for (var i = 0; i < records.length; i++) {
                txt += records[i]['hostname'] + '\n';
            }
            txt += '详情可见：' + 'https://securitytrails.com/list/ip/' + text;
            setText(txt);
            // setText(JSON.stringify(res.data));
            // return;
        } else {
            throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(res.data)}`;
        }
    } else {
        CanonicalizedQueryString = endpoint + doamin_path + text;
        res = await fetch(CanonicalizedQueryString, {
            method: 'GET',
            headers: {
                apikey: apikey,
            },
        });
        if (res.ok) {
            let txt = '';
            let result = res.data;
            let dns = result['current_dns'];
            for (var key in dns) {
                txt += key.toUpperCase() + ' records\n';
                let values = dns[key]['values'];
                if (values == '' || values == null) {
                    continue;
                }
                for (var i = 0; i < values.length; i++) {
                    if (key == 'a') {
                        txt += '\t' + values[i]['ip'] + '\n';
                    } else if (key == 'aaaa') {
                        txt += '\t' + values[i]['ipv6'] + '\n';
                    } else if (key == 'mx') {
                        txt += '\t' + values[i]['hostname'] + '\n';
                    } else if (key == 'ns') {
                        txt += '\t' + values[i]['nameserver'] + '\n';
                    } else if (key == 'soa') {
                        txt += '\t' + values[i]['email'] + '\n';
                    } else if (key == 'txt') {
                        txt += '\t' + values[i]['value'] + '\n';
                    }
                }
            }
            setText(txt);
        } else {
            throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(res.data)}`;
        }
    }
}
