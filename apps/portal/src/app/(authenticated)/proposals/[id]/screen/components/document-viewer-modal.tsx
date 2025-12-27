'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createAuthenticatedClient } from '@/lib/api-client';

interface DocumentViewerModalProps {
    document: any;
    isOpen: boolean;
    onClose: () => void;
}

export default function DocumentViewerModal({ document, isOpen, onClose }: DocumentViewerModalProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const { getToken } = useAuth();

    useEffect(() => {
        if (!isOpen || !document) {
            setSignedUrl(null);
            return;
        }

        setLoading(true);
        setError(null);

        // Fetch the signed URL from backend
        const fetchSignedUrl = async () => {
            try {
                const token = await getToken();
                if (!token) {
                    throw new Error('Authentication required');
                }

                const client = createAuthenticatedClient(token);
                const response: any = await client.getDocument(document.id);
                const url = response.data?.downloadUrl || response.downloadUrl;

                if (!url) {
                    throw new Error('No download URL available');
                }

                setSignedUrl(url);
                setLoading(false);
            } catch (err) {
                console.error('Error loading document:', err);
                setError(err instanceof Error ? err.message : 'Failed to load document');
                setLoading(false);
            }
        };

        fetchSignedUrl();
    }, [isOpen, document, getToken]);

    if (!isOpen || !document) return null;

    const isPdf = document.content_type?.includes('pdf') || document.file_name?.toLowerCase().endsWith('.pdf');
    const isImage = document.content_type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(document.file_name);
    const isText = document.content_type?.startsWith('text/') || /\.(txt|md)$/i.test(document.file_name);

    // Handler to download the file
    const handleDownloadClick = async () => {
        try {
            const token = await getToken();
            if (!token) return;

            const client = createAuthenticatedClient(token);
            const response: any = await client.getDocument(document.id);
            const signedUrl = response.data?.downloadUrl || response.downloadUrl;

            if (signedUrl) {
                window.open(signedUrl, '_blank');
            }
        } catch (err) {
            console.error('Download failed:', err);
        }
    };

    return (
        <dialog className="modal modal-open">
            <div className="modal-box max-w-6xl h-[90vh] flex flex-col p-0">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-base-300">
                    <div className="flex-1 min-w-0 mr-4">
                        <h3 className="text-xl font-bold truncate">{document.file_name}</h3>
                        <div className="flex items-center gap-3 text-sm text-base-content/60 mt-1">
                            <span className="capitalize">{document.document_type}</span>
                            {document.file_size && (
                                <>
                                    <span>•</span>
                                    <span>{(document.file_size / 1024).toFixed(1)} KB</span>
                                </>
                            )}
                            {document.is_primary && (
                                <span className="badge badge-primary badge-sm">
                                    <i className="fa-solid fa-star mr-1"></i>
                                    Primary
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={handleDownloadClick}
                            className="btn btn-sm btn-ghost"
                            title="Download"
                        >
                            <i className="fa-solid fa-download"></i>
                        </button>
                        <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
                            <i className="fa-solid fa-xmark text-xl"></i>
                        </button>
                    </div>
                </div>

                {/* Document Viewer */}
                <div className="flex-1 overflow-hidden bg-base-200/30 relative">
                    {error ? (
                        <div className="flex items-center justify-center h-full p-8">
                            <div className="alert alert-error max-w-md">
                                <i className="fa-solid fa-circle-exclamation"></i>
                                <div>
                                    <div className="font-semibold">Failed to load document</div>
                                    <div className="text-sm mt-1">{error}</div>
                                </div>
                            </div>
                        </div>
                    ) : !signedUrl ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="flex flex-col items-center gap-3">
                                <span className="loading loading-spinner loading-lg"></span>
                                <span className="text-sm text-base-content/70">Loading document...</span>
                            </div>
                        </div>
                    ) : isPdf ? (
                        <iframe
                            src={`${signedUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                            className="w-full h-full"
                            title={document.file_name}
                        />
                    ) : isImage ? (
                        <div className="flex items-center justify-center h-full p-8 overflow-auto">
                            <img
                                src={signedUrl}
                                alt={document.file_name}
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>
                    ) : isText ? (
                        <iframe
                            src={signedUrl}
                            className="w-full h-full bg-white"
                            title={document.file_name}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full p-8">
                            <div className="text-center max-w-md">
                                <i className="fa-solid fa-file text-6xl text-base-content/40 mb-4"></i>
                                <h4 className="text-lg font-semibold mb-2">Preview not available</h4>
                                <p className="text-base-content/70 mb-6">
                                    This file type cannot be previewed in the browser. Please download the file to view it.
                                </p>
                                <button
                                    onClick={handleDownloadClick}
                                    className="btn btn-primary"
                                >
                                    <i className="fa-solid fa-download mr-2"></i>
                                    Download File
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-base-300 bg-base-100">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-base-content/60">
                            <i className="fa-solid fa-circle-info mr-2"></i>
                            Tip: You can download this document using the button above
                        </div>
                        <button onClick={onClose} className="btn btn-sm">
                            Close
                        </button>
                    </div>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop" onClick={onClose}>
                <button>close</button>
            </form>
        </dialog>
    );
}
