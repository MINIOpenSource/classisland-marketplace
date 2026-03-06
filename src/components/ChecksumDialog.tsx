'use client';

import {
    Dialog,
    DialogSurface,
    DialogTitle,
    DialogBody,
    DialogContent,
    DialogActions,
    Button,
    Text,
    tokens
} from '@fluentui/react-components';
import { useTranslations } from 'next-intl';

export interface ChecksumInfo {
    checksum: string;
    fileName: string;
}

export function ChecksumDialog({
    info,
    onClose
}: {
    info: ChecksumInfo | null;
    onClose: () => void;
}) {
    const t = useTranslations('Index');

    return (
        <Dialog open={!!info} onOpenChange={(_, data) => !data.open && onClose()}>
            <DialogSurface>
                <DialogBody>
                    <DialogTitle>{t('downloadComplete') || 'Download Complete'}</DialogTitle>
                    <DialogContent>
                        <Text>{t('checksumDesc') || 'Here is the MD5 checksum of the downloaded file:'}</Text>
                        <div style={{ wordBreak: 'break-all', fontFamily: 'monospace', padding: '8px', backgroundColor: tokens.colorNeutralBackground2, borderRadius: tokens.borderRadiusMedium, marginTop: '12px', marginBottom: '12px' }}>
                            {info?.checksum}
                        </div>
                    </DialogContent>
                    <DialogActions>
                        <Button appearance="secondary" onClick={onClose}>{t('close') || 'Close'}</Button>
                        <Button appearance="primary" onClick={() => {
                            if (!info) return;
                            const blob = new Blob([info.checksum], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${info.fileName}.checksum`;
                            a.click();
                            URL.revokeObjectURL(url);
                        }}>{t('downloadChecksum') || 'Download .checksum'}</Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
}
