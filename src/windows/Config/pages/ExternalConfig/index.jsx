import { TextField, Switch } from '@mui/material';
import { useTranslation } from 'react-i18next';
import 'flag-icons/css/flag-icons.min.css';
import { useAtom } from 'jotai';
import React from 'react';
import { ankiEnableAtom, eudicEnableAtom, eudicCategoryNameAtom, eudicTokenAtom } from '../..';
import ConfigList from '../../components/ConfigList';
import ConfigItem from '../../components/ConfigItem';
import { set } from '../../../../global/config';

export default function ExternalConfig() {
    const [ankiEnable, setAnkiEnable] = useAtom(ankiEnableAtom);
    const [eudicEnable, setEudicEnable] = useAtom(eudicEnableAtom);
    const [eudicCategoryName, setEudicCategoryName] = useAtom(eudicCategoryNameAtom);
    const [eudicToken, setEudicToken] = useAtom(eudicTokenAtom);

    const { t } = useTranslation();

    return (
        <ConfigList label={t('config.external.title')}>
            <ConfigItem label={t('config.external.enableanki')}>
                <Switch
                    checked={ankiEnable}
                    onChange={async (e) => {
                        setAnkiEnable(e.target.checked);
                        await set('anki_enable', e.target.checked);
                    }}
                />
            </ConfigItem>
            <ConfigItem label={t('config.external.enableeudic')}>
                <Switch
                    checked={eudicEnable}
                    onChange={async (e) => {
                        setEudicEnable(e.target.checked);
                        await set('eudic_enable', e.target.checked);
                    }}
                />
            </ConfigItem>
            <ConfigItem label={t('config.external.eudicbookname')}>
                <TextField
                    size='small'
                    sx={{ width: '300px' }}
                    value={eudicCategoryName}
                    placeholder='pot'
                    onChange={async (e) => {
                        setEudicCategoryName(e.target.value);
                        await set('eudic_category_name', e.target.value);
                    }}
                />
            </ConfigItem>
            <ConfigItem
                label={t('config.external.eudictoken')}
                help={t('config.external.eudictokenhelp')}
            >
                <TextField
                    size='small'
                    sx={{ width: '300px' }}
                    value={eudicToken}
                    onChange={async (e) => {
                        setEudicToken(e.target.value);
                        await set('eudic_token', e.target.value);
                    }}
                />
            </ConfigItem>
        </ConfigList>
    );
}
