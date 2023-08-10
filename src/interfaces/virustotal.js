import { translateID } from '../windows/Translator/components/TargetArea';
import { invoke } from '@tauri-apps/api/tauri';
import { fetch } from '@tauri-apps/api/http';
import HmacSHA1 from 'crypto-js/hmac-sha1';
import base64 from 'crypto-js/enc-base64';
import { get } from '../windows/main';

export const info = {
    name: 'virustotal',
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
            config_key: 'x_apikey',
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
    const accesskey = get('x_apikey') ?? '';
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
    let endpoint = 'https://www.virustotal.com/';
    let ip_url_path = 'api/v3/ip_addresses/';
    let url_url_path = '/api/v3/urls';
    let domain_url_path = '/api/v3/domains/';
    let CanonicalizedQueryString = '';
    let res;
    // setText(text);
    let http_flag = 0;
    if (/^\d{1,3}(\.\d{1,3}){3}/.test(text)) {
        // setText("aaa");
        CanonicalizedQueryString = endpoint + ip_url_path + text;
        res = await fetch(CanonicalizedQueryString, {
            method: 'GET',
            headers: {
                'X-Apikey': accesskey,
            },
            // 添加noproxy确保set_proxy已经执行完毕，fetch不会读取这个noproxy
        });
    } else if (/^https?\:\/\//.test(text)) {
        http_flag = 1;
        CanonicalizedQueryString = endpoint + url_url_path;
        res = await fetch(CanonicalizedQueryString, {
            method: 'POST',
            headers: {
                'X-Apikey': accesskey,
            },
            body: {
                type: 'Text',
                payload: 'url=' + text,
            },

            // 添加noproxy确保set_proxy已经执行完毕，fetch不会读取这个noproxy
        });

        if (res.ok) {
            let self_url = res.data['data']['links']['self'];
            // setText(self_url);
            res = await fetch(self_url, {
                method: 'GET',
                headers: {
                    'X-Apikey': accesskey,
                },
            });
        }
    } else {
        CanonicalizedQueryString = endpoint + domain_url_path + text;
        res = await fetch(CanonicalizedQueryString, {
            method: 'GET',
            headers: {
                'X-Apikey': accesskey,
            },
            // 添加noproxy确保set_proxy已经执行完毕，fetch不会读取这个noproxy
        });
    }
    // let query = `AccessKeyId=${accesskey_id}&Action=TranslateGeneral&Format=JSON&FormatType=text&Scene=general&SignatureMethod=HMAC-SHA1&SignatureNonce=${getRandomNumber()}&SignatureVersion=1.0&SourceLanguage=${supportLanguage[from]
    //     }&SourceText=${encodeURIComponent(text)}&TargetLanguage=${supportLanguage[to]}&Timestamp=${encodeURIComponent(
    //         timestamp
    //     )}&Version=2018-10-12`;
    // let query = `X-Apikey: ${accesskey}`

    // setText(CanonicalizedQueryString)
    // let stringToSign = 'GET' + '&' + encodeURIComponent('/') + '&' + encodeURIComponent(query);

    // stringToSign = stringToSign.replaceAll('!', '%2521');
    // stringToSign = stringToSign.replaceAll("'", '%2527');
    // stringToSign = stringToSign.replaceAll('(', '%2528');
    // stringToSign = stringToSign.replaceAll(')', '%2529');
    // stringToSign = stringToSign.replaceAll('*', '%252A');
    // stringToSign = stringToSign.replaceAll('+', '%252B');
    // stringToSign = stringToSign.replaceAll(',', '%252C');

    // let signature = base64.stringify(HmacSHA1(stringToSign, accesskey_secret + '&'));

    // CanonicalizedQueryString = CanonicalizedQueryString + '&Signature=' + encodeURIComponent(signature);
    // 由于设置代理之后阿里翻译会报错，所以先取消代理再发送请求
    // let noproxy = await invoke('set_proxy', { proxy: '' });
    // let proxy = get('proxy') ?? '';
    // await invoke('set_proxy', { proxy });
    // setText(proxy)
    // let res = await fetch('https://www.google.com')

    // let res = await fetch(CanonicalizedQueryString, {
    //     method: 'GET',
    //     headers: {
    //         "X-Apikey": accesskey
    //     }
    //     // 添加noproxy确保set_proxy已经执行完毕，fetch不会读取这个noproxy
    // });
    // 还原代理设置
    // let proxy = get('proxy') ?? '';
    // await invoke('set_proxy', { proxy });
    // alert(res)
    if (res.ok) {
        let result = res.data;
        let data = result['data']['attributes'];
        let last_analysis_stats;
        let last_analysis_results;
        if (http_flag == 0) {
            last_analysis_stats = data['last_analysis_stats'];
            last_analysis_results = data['last_analysis_results'];
        } else {
            last_analysis_stats = data['stats'];
            last_analysis_results = data['results'];
        }
        let txt = '';
        txt = 'harmless: ' + last_analysis_stats['harmless'] + '\n';
        txt += 'malicious: ' + last_analysis_stats['malicious'] + '\n';
        txt += 'suspicious: ' + last_analysis_stats['suspicious'] + '\n';
        txt += 'undetected: ' + last_analysis_stats['undetected'] + '\n';
        txt += 'timeout: ' + last_analysis_stats['timeout'] + '\n';
        txt += '---------------------------------------------\nengine_name\t|\tresult\n';
        for (var key in last_analysis_results) {
            txt += key + '\t|\t' + last_analysis_results[key]['result'] + '\n';
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
