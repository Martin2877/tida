import { translateID } from '../windows/Translator/components/TargetArea';
import { invoke } from '@tauri-apps/api/tauri';
import { http } from '@tauri-apps/api';
import HmacSHA1 from 'crypto-js/hmac-sha1';
import { get } from '../windows/main';
import CryptoJS from 'crypto-js';

export const info = {
    name: 'cve',
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
        //     config_key: 'censys_api_id',
        //     place_hold: '',
        // },
        // {
        //     config_key: 'censys_secret',
        //     place_hold: '',
        // },
    ],
};
//必须向外暴露translate
export async function translate(text, from, to, setText, id) {
    // 获取语言映射
    const { supportLanguage } = info;
    // 获取设置项
    // const apiid = get('censys_api_id') ?? '';
    // const secret = get('censys_secret') ?? '';
    // const accesskey_secret = get('alibaba_accesskey_secret') ?? '';

    function getRandomNumber() {
        const rand = Math.floor(Math.random() * 99999) + 100000;
        return rand * 1000;
    }
    // if (apiid === '' || secret === '') {
    //     throw 'Please configure API ID or Secret';
    // }
    if (!(from in supportLanguage) || !(to in supportLanguage)) {
        throw 'Unsupported Language';
    }

    let today = new Date();
    let timestamp = today.toISOString().replaceAll(/\.[0-9]*/g, '');
    let endpoint = 'https://www.opencve.io/cve?search=' + text;
    let res;
    // let url_path = '/api/v2/hosts/';
    let CanonicalizedQueryString = endpoint;

    res = await http.fetch(CanonicalizedQueryString, {
        method: 'GET',
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        },
        responseType: 2,
    });

    if (res.ok) {
        // console.log(res.data);
        let txt = 'CVE\t\t\t|\tUpdated\t\t|\tCVSS v2\t|\tCVSS v3\n';
        const doc = new DOMParser().parseFromString(res.data, 'text/html');
        const TRNodes = doc.querySelectorAll('TR');
        let c = 0;
        for (var i = 0; i < TRNodes.length; i++) {
            let TDNodes = TRNodes[i].querySelectorAll('TD');
            if (TDNodes.length == 6) {
                c += 1;
                txt +=
                    TDNodes[0].textContent.trim() +
                    '\t|\t' +
                    TDNodes[3].textContent.trim() +
                    '\t|\t' +
                    TDNodes[4].textContent.trim() +
                    '\t|\t' +
                    TDNodes[5].textContent.trim() +
                    '\n';
            } else if (TDNodes.length == 1) {
                txt += TDNodes[0].textContent + '\n';
            }
        }

        txt += '详情可见：' + CanonicalizedQueryString;
        setText(txt);
    }
}
