import { translateID } from '../windows/Translator/components/TargetArea';
import { invoke } from '@tauri-apps/api/tauri';
import { fetch } from '@tauri-apps/api/http';
import HmacSHA1 from 'crypto-js/hmac-sha1';
// import base64 from 'crypto-js/enc-base64';
import { get } from '../windows/main';
import CryptoJS from 'crypto-js';

export const info = {
    name: 'sangfor',
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
            config_key: 'sangfor_sessionid',
            place_hold: '',
        },
        {
            config_key: 'sangfor_csrftoken',
            place_hold: '',
        },
    ],
};
//必须向外暴露translate
export async function translate(text, from, to, setText, id) {
    // 获取语言映射
    const { supportLanguage } = info;
    // 获取设置项
    const sessionid = get('sangfor_sessionid') ?? '';
    const csrftoken = get('sangfor_csrftoken') ?? '';
    // const accesskey_secret = get('alibaba_accesskey_secret') ?? '';

    function getRandomNumber() {
        const rand = Math.floor(Math.random() * 99999) + 100000;
        return rand * 1000;
    }
    if (sessionid === '' || csrftoken === '') {
        throw 'Please configure sessionid and csrftoken';
    }
    if (!(from in supportLanguage) || !(to in supportLanguage)) {
        throw 'Unsupported Language';
    }

    let today = new Date();
    let timestamp = today.toISOString().replaceAll(/\.[0-9]*/g, '');
    let endpoint = 'https://ti.sangfor.com.cn';
    let url_path = '/api/v1/threats/ioc';
    if (/^http\:\/\//.test(text)) {
        text = text.replace(/^https?\:\/\//, '').replace(/\/?$/, '');
        // setText(text);
    }
    let CanonicalizedQueryString = endpoint + url_path;
    let res;
    // setText(text);
    let payload = 'query=' + CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text)) + '&days=30';
    res = await fetch(CanonicalizedQueryString, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken,
            Cookie: 'csrftoken=' + csrftoken + '; sessionid=' + sessionid + ';',
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: {
            type: 'Text',
            payload: payload,
        },
    });
    // setText("<h1>fsdfasdf</h1>");

    if (res.ok) {
        let result = res.data;
        let data = result['data'];
        // let info = data['brief_info'];
        let txt = '';
        if (/\d{1,3}(\.\d{1,3}){3}/.test(text)) {
            let brief_info = data['brief_info'];
            txt += 'sangfor标签：' + brief_info['nettype'].join(' ') + '\n';
            txt += '开源情报标签：' + data['threat_analysis']['open_intelligence_tags'].join(' ') + '\n';
            txt += '所属机构：' + brief_info['isp'] + '\n';
            txt += '告警次数：' + data['time_left'] + '\n';
            txt += '地理位置：' + brief_info['location'].join(' ') + '\n';
            txt +=
                '详情可见：' +
                'https://ti.sangfor.com.cn/analysis-platform/ip_report/' +
                CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text)) +
                '?lang=ZH-CN';
        } else {
            let brief_info = data['brief_info'];
            txt += 'sangfor标签：' + brief_info['label'].join(' ') + '\n';
            if (brief_info['threat_level'] == 0) {
                txt += '威胁等级：无\n';
            } else if (brief_info['threat_level'] == 1) {
                txt += '威胁等级：低\n';
            } else if (brief_info['threat_level'] == 2) {
                txt += '威胁等级：中\n';
            } else if (brief_info['threat_level'] == 3) {
                txt += '威胁等级：高\n';
            }
            txt += '告警次数：' + data['affection_analysis']['product_attack']['total'] + '\n';
            txt += '发现时间：' + brief_info['first_found_time'] + '\n';
            txt += '更新时间：' + brief_info['update_time'] + '\n';
            txt +=
                '详情可见：' +
                'https://ti.sangfor.com.cn/analysis-platform/dns_report/' +
                CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text)) +
                '?lang=ZH-CN';
        }
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
