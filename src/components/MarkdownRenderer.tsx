'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import { Button, Tooltip, useToastController, Toast, ToastTitle, ToastBody } from '@fluentui/react-components';
import { CopyRegular } from '@fluentui/react-icons';

export function MarkdownRenderer({ content, pluginDescription }: { content: string, pluginDescription?: string }) {
    const { dispatchToast } = useToastController('global-toaster');

    if (!content) {
        return (
            <div style={{ padding: '40px' }}>
                <p style={{ fontSize: '14px', margin: 0 }}>{pluginDescription || "No readme available."}</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '40px', backgroundColor: 'transparent' }} className="wmde-markdown">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                components={{
                    img: (props) => (
                        <Zoom>
                            <img {...props} style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }} alt={props.alt || ''} />
                        </Zoom>
                    ),
                    pre: ({ children, ...props }) => {
                        const childArray = React.Children.toArray(children);
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const codeChild: any = childArray[0];
                        let codeText = '';
                        if (codeChild && codeChild.props && codeChild.props.children) {
                            codeText = String(codeChild.props.children);
                        }

                        const handleCopy = (e: React.MouseEvent) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigator.clipboard.writeText(codeText).then(() => {
                                dispatchToast(
                                    <Toast>
                                        <ToastTitle>Copied</ToastTitle>
                                        <ToastBody>Code copied to clipboard.</ToastBody>
                                    </Toast>,
                                    { intent: 'success' }
                                );
                            });
                        };

                        return (
                            <div style={{ position: 'relative' }} className="group">
                                <Tooltip content="Copy code" relationship="label">
                                    <Button
                                        appearance="subtle"
                                        size="small"
                                        icon={<CopyRegular />}
                                        onClick={handleCopy}
                                        style={{ position: 'absolute', top: '8px', right: '8px', opacity: 0, transition: 'opacity 0.2s' }}
                                        className="group-hover:opacity-100 copy-code-btn"
                                    />
                                </Tooltip>
                                <pre {...props} style={{ ...props.style, position: 'relative' }}>
                                    {children}
                                </pre>
                            </div>
                        );
                    }
                }}
            >
                {content}
            </ReactMarkdown>
            <style jsx global>{`
                .group:hover .copy-code-btn {
                    opacity: 1 !important;
                }
            `}</style>
        </div>
    );
}
