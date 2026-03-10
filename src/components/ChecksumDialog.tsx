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
    expectedChecksum?: string;
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

    const match = info?.expectedChecksum ? info.checksum.toLowerCase() === info.expectedChecksum.toLowerCase() : undefined;

    return (
        <Dialog open={!!info} onOpenChange={(_, data) => !data.open && onClose()}>
            <DialogSurface>
                <DialogBody>
                    <DialogTitle>{t('downloadComplete') || 'Download Complete'}</DialogTitle>
                    <DialogContent>
                        {info?.expectedChecksum ? (
                            <>
                                <Text>{t('checksumLocalDesc') || 'Local File Checksum (SHA-256/MD5):'}</Text>
                                <div style={{ wordBreak: 'break-all', fontFamily: 'monospace', padding: '8px', backgroundColor: tokens.colorNeutralBackground2, borderRadius: tokens.borderRadiusMedium, marginTop: '8px', marginBottom: '12px' }}>
                                    {info.checksum}
                                </div>
                                <Text>{t('checksumRemoteDesc') || 'Expected Original Checksum:'}</Text>
                                <div style={{ wordBreak: 'break-all', fontFamily: 'monospace', padding: '8px', backgroundColor: tokens.colorNeutralBackground2, borderRadius: tokens.borderRadiusMedium, marginTop: '8px', marginBottom: '12px' }}>
                                    {info.expectedChecksum}
                                </div>
                                <Text style={{ color: match ? tokens.colorPaletteGreenForeground1 : tokens.colorPaletteRedForeground1, fontWeight: 'bold' }}>
                                    {match ? (t('checksumMatch') || 'Checksums Match! File is intact.') : (t('checksumMismatch') || 'Checksum Mismatch! File might be corrupted.')}
                                </Text>
                            </>
                        ) : (
                            <>
                                <Text>{t('checksumDesc') || 'Here is the checksum of the downloaded file:'}</Text>
                                <div style={{ wordBreak: 'break-all', fontFamily: 'monospace', padding: '8px', backgroundColor: tokens.colorNeutralBackground2, borderRadius: tokens.borderRadiusMedium, marginTop: '12px', marginBottom: '12px' }}>
                                    {info?.checksum}
                                </div>
                            </>
                        )}
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
