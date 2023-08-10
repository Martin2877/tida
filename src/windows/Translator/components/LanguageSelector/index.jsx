import KeyboardDoubleArrowRightRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowRightRounded';
import { Card, Select, MenuItem } from '@mui/material';
import { useTranslation } from 'react-i18next';
import 'flag-icons/css/flag-icons.min.css';
import React, { useEffect } from 'react';
import { atom, useAtom } from 'jotai';
import { nanoid } from 'nanoid';
import language from '../../../../global/language';
import { set } from '../../../../global/config';
import { get } from '../../../main';
import './style.css';

export const sourceLanguageAtom = atom('auto');
export const targetLanguageAtom = atom('zh_cn');

export default function LanguageSelector() {
    const [sourceLanguage, setSourceLanguage] = useAtom(sourceLanguageAtom);
    const [targetLanguage, setTargetLanguage] = useAtom(targetLanguageAtom);

    const { t } = useTranslation();

    useEffect(() => {
        setTargetLanguage(get('target_language') ?? 'zh_cn');
    }, []);

    // return (
    // <Card className='language-selector-area'>
    {
        /* <Select
                sx={{
                    '.MuiOutlinedInput-notchedOutline': { border: 0 },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 0 },
                }}
                className='language-selector'
                value={sourceLanguage}
                onChange={(e) => {
                    setSourceLanguage(e.target.value);
                }}
            >
                <MenuItem value={'auto'}>
                    <span>
                        <img
                            style={{
                                verticalAlign: 'middle',
                                marginRight: '8px',
                                height: '20px',
                            }}
                            src='/auto.png'
                            alt='auto detect'
                        />
                    </span>
                    <span>{t('language.auto')}</span>
                </MenuItem>
                {language.map((x) => {
                    return (
                        <MenuItem
                            value={x.value}
                            key={nanoid()}
                        >
                            <span className={`fi fi-${x.code}`} />
                            <span>{t(`language.${x.value}`)}</span>
                        </MenuItem>
                    );
                })}
            </Select> */
    }
    {
        /* <KeyboardDoubleArrowRightRoundedIcon
                fontSize='large'
                className='arrow-icon'
            /> */
    }
    {
        /* <Select
                sx={{
                    '.MuiOutlinedInput-notchedOutline': { border: 0 },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 0 },
                }}
                className='language-selector'
                value={targetLanguage}
                onChange={(e) => {
                    setTargetLanguage(e.target.value);
                    if (get('remember_target_language') ?? true) {
                        set('target_language', e.target.value);
                    }
                }}
            >
                {language.map((x) => {
                    return (
                        <MenuItem
                            value={x.value}
                            key={nanoid()}
                        >
                            <span className={`fi fi-${x.code}`} />
                            <span>{t(`language.${x.value}`)}</span>
                        </MenuItem>
                    );
                })}
            </Select> */
    }
    // </Card>
    // );
}
