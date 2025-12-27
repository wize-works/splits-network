'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { getMyDocuments, getMyCandidateProfile, getCurrentUser } from '@/lib/api';
import UploadDocumentModal from '@/components/upload-document-modal';

interface StepDocumentsProps {
    documents: any[];
    selected: string[];
    primaryResumeId: string | null;
    onChange: (docs: { selected: string[]; primary_resume_id: string | null }) => void;
    onNext: () => void;
    onDocumentsUpdated?: (newDocuments: any[]) => void;
}

export default function StepDocuments({
    documents,
    selected,
    primaryResumeId,
    onChange,
    onNext,
    onDocumentsUpdated,
}: StepDocumentsProps) {
    const { getToken } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [candidateId, setCandidateId] = useState<string | null>(null);
    const [localDocuments, setLocalDocuments] = useState(documents);

    const handleToggleDocument = (docId: string) => {
        const newSelected = selected.includes(docId)
            ? selected.filter(id => id !== docId)
            : [...selected, docId];

        // If deselecting the primary resume, clear it
        let newPrimary = primaryResumeId;
        if (!newSelected.includes(primaryResumeId || '')) {
            newPrimary = null;
        }

        onChange({ selected: newSelected, primary_resume_id: newPrimary });
        setError(null);
    };

    const handleSetPrimary = (docId: string) => {
        // Ensure it's selected
        const newSelected = selected.includes(docId) ? selected : [...selected, docId];
        onChange({
            selected: newSelected,
            primary_resume_id: docId,
        });
    };

    const getCandidateId = async () => {
        if (candidateId) return candidateId;

        try {
            const token = await getToken();
            if (!token) {
                console.error('No auth token available');
                return null;
            }

            // Get user info to get email
            const user = await getCurrentUser(token);
            const userEmail = user.email;

            if (!userEmail) {
                console.error('No email found in user data');
                return null;
            }

            // Get candidate profile
            const profile = await getMyCandidateProfile(token);

            if (!profile) {
                console.error('No candidate profile found');
                return null;
            }

            const id = profile.id;
            setCandidateId(id);
            return id;
        } catch (err) {
            console.error('Failed to get candidate ID:', err);
            return null;
        }
    };

    const handleUploadClick = async () => {
        const id = await getCandidateId();
        if (!id) {
            setError('Failed to find candidate profile. Please contact support.');
            return;
        }
        setShowUploadModal(true);
    };

    const handleUploadSuccess = async () => {
        setShowUploadModal(false);
        try {
            const token = await getToken();
            if (!token) return;

            const updatedDocs = await getMyDocuments(token);
            setLocalDocuments(updatedDocs);
            if (onDocumentsUpdated) {
                onDocumentsUpdated(updatedDocs);
            }
        } catch (err: any) {
            console.error('Failed to reload documents:', err);
            setError(err.message || 'Failed to reload documents');
        }
    };

    const handleNext = () => {
        const currentDocs = localDocuments.length > 0 ? localDocuments : documents;

        // Validation
        if (selected.length === 0) {
            setError('Please select at least one document');
            return;
        }

        const hasResume = selected.some(id => {
            const doc = currentDocs.find(d => d.id === id);
            return doc && doc.document_type === 'resume';
        });

        if (!hasResume) {
            setError('Please select at least one resume');
            return;
        }

        if (!primaryResumeId) {
            setError('Please mark one resume as primary');
            return;
        }

        onNext();
    };

    const currentDocs = localDocuments.length > 0 ? localDocuments : documents;
    const currentResumes = currentDocs.filter(doc => doc.document_type === 'resume');
    const currentOtherDocs = currentDocs.filter(doc => doc.document_type !== 'resume');

    if (currentDocs.length === 0) {
        return (
            <>
                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-semibold mb-2">Upload Your Resume</h2>
                        <p className="text-base-content/70">
                            To apply for this position, please upload your resume or CV.
                        </p>
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            <i className="fa-solid fa-circle-exclamation"></i>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="card bg-base-200">
                        <div className="card-body">
                            <button
                                type="button"
                                className="btn btn-primary btn-block"
                                onClick={handleUploadClick}
                            >
                                <i className="fa-solid fa-upload"></i>
                                Upload Document
                            </button>

                            <div className="divider">OR</div>

                            <Link href="/documents" className="btn btn-ghost btn-block">
                                <i className="fa-solid fa-folder-open"></i>
                                Manage Documents
                            </Link>
                        </div>
                    </div>
                </div>

                {showUploadModal && candidateId && (
                    <UploadDocumentModal
                        entityType="candidate"
                        entityId={candidateId}
                        documentType="resume"
                        onClose={() => setShowUploadModal(false)}
                        onSuccess={handleUploadSuccess}
                    />
                )}
            </>
        );
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold mb-2">Select Documents</h2>
                        <p className="text-base-content/70">
                            Choose which documents to include with your application. At least one resume is required.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={handleUploadClick}
                    >
                        <i className="fa-solid fa-plus"></i>
                        Upload More
                    </button>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <i className="fa-solid fa-circle-exclamation"></i>
                        <span>{error}</span>
                    </div>
                )}

                {/* Resumes */}
                {currentResumes.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Resumes</h3>
                        <div className="space-y-2">
                            {currentResumes.map((doc) => (
                                <div key={doc.id} className="card bg-base-200">
                                    <div className="card-body p-4">
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="checkbox"
                                                className="checkbox checkbox-primary"
                                                checked={selected.includes(doc.id)}
                                                onChange={() => handleToggleDocument(doc.id)}
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium">{doc.file_name}</div>
                                                <div className="text-sm text-base-content/60">
                                                    {doc.file_size && `${(doc.file_size / 1024).toFixed(1)} KB`}
                                                    {doc.uploaded_at && ` • Uploaded ${new Date(doc.uploaded_at).toLocaleDateString()}`}
                                                </div>
                                            </div>
                                            {selected.includes(doc.id) && (
                                                <button
                                                    type="button"
                                                    className={`btn btn-sm ${primaryResumeId === doc.id ? 'btn-primary' : 'btn-ghost'}`}
                                                    onClick={() => handleSetPrimary(doc.id)}
                                                >
                                                    {primaryResumeId === doc.id ? (
                                                        <>
                                                            <i className="fa-solid fa-star"></i>
                                                            Primary
                                                        </>
                                                    ) : (
                                                        'Set as Primary'
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Other Documents */}
                {currentOtherDocs.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Additional Documents</h3>
                        <div className="space-y-2">
                            {currentOtherDocs.map((doc) => (
                                <div key={doc.id} className="card bg-base-200">
                                    <div className="card-body p-4">
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="checkbox"
                                                className="checkbox checkbox-primary"
                                                checked={selected.includes(doc.id)}
                                                onChange={() => handleToggleDocument(doc.id)}
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium">{doc.file_name}</div>
                                                <div className="text-sm text-base-content/60">
                                                    {doc.document_type}
                                                    {doc.file_size && ` • ${(doc.file_size / 1024).toFixed(1)} KB`}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleNext}
                    >
                        Next: Questions
                        <i className="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            </div>

            {showUploadModal && candidateId && (
                <UploadDocumentModal
                    entityType="candidate"
                    entityId={candidateId}
                    documentType="resume"
                    onClose={() => setShowUploadModal(false)}
                    onSuccess={handleUploadSuccess}
                />
            )}
        </>
    );
}
