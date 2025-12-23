'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createAuthenticatedClient } from '@/lib/api-client';

interface SubmitCandidateModalProps {
    roleId: string;
    onClose: () => void;
}

interface ExistingCandidate {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    location?: string;
    current_title?: string;
    current_company?: string;
    linkedin_url?: string;
}

export default function SubmitCandidateModal({ roleId, onClose }: SubmitCandidateModalProps) {
    const { getToken } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [mode, setMode] = useState<'select' | 'new'>('select');
    const [existingCandidates, setExistingCandidates] = useState<ExistingCandidate[]>([]);
    const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
    const [candidateSearch, setCandidateSearch] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [loadingCandidates, setLoadingCandidates] = useState(true);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        location: '',
        current_title: '',
        current_company: '',
        linkedin_url: '',
        notes: '',
    });
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [pitch, setPitch] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const filteredCandidates = existingCandidates.filter((candidate) => {
        if (!candidateSearch.trim()) return true;
        const term = candidateSearch.toLowerCase();
        return (
            candidate.full_name?.toLowerCase().includes(term) ||
            candidate.email?.toLowerCase().includes(term) ||
            candidate.current_title?.toLowerCase().includes(term) ||
            candidate.current_company?.toLowerCase().includes(term)
        );
    });

    useEffect(() => {
        fetchExistingCandidates();
    }, []);

    const fetchExistingCandidates = async () => {
        try {
            const token = await getToken();
            if (!token) {
                setLoadingCandidates(false);
                return;
            }
            const client = createAuthenticatedClient(token);
            const response: any = await client.get('/candidates');
            const candidates = response.data || [];
            setExistingCandidates(candidates);

            // If no candidates exist, default to the new candidate flow
            if (candidates.length === 0) {
                setMode('new');
            }
        } catch (err) {
            console.error('Failed to fetch candidates:', err);
        } finally {
            setLoadingCandidates(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
            if (!allowedTypes.includes(file.type)) {
                setError('Please upload a PDF, DOC, DOCX, or TXT file');
                return;
            }
            // Validate file size (10MB)
            if (file.size > 10 * 1024 * 1024) {
                setError('File size must be less than 10MB');
                return;
            }
            setResumeFile(file);
            setError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!pitch.trim()) {
            setError('Please provide a pitch for this opportunity');
            return;
        }

        if (mode === 'select' && !selectedCandidateId) {
            setError('Please select a candidate or add a new one');
            return;
        }

        setSubmitting(true);

        try {
            const token = await getToken();
            if (!token) {
                throw new Error('No auth token available');
            }

            const client = createAuthenticatedClient(token);

            let candidateId: string | undefined;
            let applicationId: string | undefined;
            let candidateFullName: string | undefined;
            let candidateEmail: string | undefined;

            if (mode === 'select' && selectedCandidateId) {
                const selected = existingCandidates.find(c => c.id === selectedCandidateId);
                candidateFullName = selected?.full_name;
                candidateEmail = selected?.email;

                if (!candidateFullName || !candidateEmail) {
                    throw new Error('Could not load selected candidate details');
                }

                const applicationResponse: any = await client.post('/applications', {
                    job_id: roleId,
                    candidate_id: selectedCandidateId,
                    full_name: candidateFullName,
                    email: candidateEmail,
                    notes: formData.notes,
                });

                candidateId = selectedCandidateId;
                applicationId =
                    applicationResponse.data?.id ||
                    applicationResponse.data?.application?.id ||
                    applicationResponse.id;
            } else {
                // Create new candidate first, then create an application for the proposal
                const createResponse: any = await client.submitCandidate({
                    job_id: roleId,
                    ...formData,
                });

                candidateId =
                    createResponse.data?.candidate?.id ||
                    createResponse.candidate?.id;
                applicationId =
                    createResponse.data?.application?.id ||
                    createResponse.data?.id ||
                    createResponse.application?.id;

                if (!applicationId && candidateId) {
                    const applicationResponse: any = await client.post('/applications', {
                        job_id: roleId,
                        candidate_id: candidateId,
                        stage: 'recruiter_proposed',
                        notes: formData.notes,
                        recruiter_pitch: pitch.trim(),
                    });

                    applicationId =
                        applicationResponse.data?.id ||
                        applicationResponse.data?.application?.id ||
                        applicationResponse.id;
                }
            }

            if (!applicationId) {
                throw new Error('Could not create application for this proposal');
            }

            await client.patch(`/applications/${applicationId}/stage`, {
                stage: 'recruiter_proposed',
                notes: pitch.trim(),
            });

            // Upload resume if provided
            if (resumeFile && candidateId) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', resumeFile);
                uploadFormData.append('entity_type', 'candidate');
                uploadFormData.append('entity_id', candidateId);
                uploadFormData.append('document_type', 'resume');

                await client.uploadDocument(uploadFormData);
            }

            // Success - close modal and refresh
            onClose();
            window.location.reload();
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-2xl">
                <h3 className="font-bold text-lg mb-4">Submit Candidate to Role</h3>

                {/* Mode Selection Tabs */}
                <div className="tabs tabs-boxed bg-base-200 mb-4">
                    <a
                        className={`tab ${mode === 'select' ? 'tab-active' : ''}`}
                        onClick={() => setMode('select')}
                    >
                        <i className="fa-solid fa-user-check mr-2"></i>
                        Select Existing
                    </a>
                    <a
                        className={`tab ${mode === 'new' ? 'tab-active' : ''}`}
                        onClick={() => setMode('new')}
                    >
                        <i className="fa-solid fa-user-plus mr-2"></i>
                        Add New
                    </a>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="alert alert-error">
                            <i className="fa-solid fa-circle-exclamation"></i>
                            <span>{error}</span>
                        </div>
                    )}

                    {mode === 'select' ? (
                        <>
                            {/* Existing Candidate Selection */}
                            <div className="fieldset">
                                <label className="label">Select Candidate *</label>
                                {loadingCandidates ? (
                                    <div className="flex justify-center py-4">
                                        <span className="loading loading-spinner"></span>
                                    </div>
                                ) : existingCandidates.length > 0 ? (
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="input w-full"
                                            placeholder="Search by name, email, title, or company"
                                            value={candidateSearch}
                                            onFocus={() => setIsDropdownOpen(true)}
                                            onChange={(e) => {
                                                setCandidateSearch(e.target.value);
                                                setIsDropdownOpen(true);
                                            }}
                                            onBlur={() => {
                                                // Delay closing so click events can register
                                                setTimeout(() => setIsDropdownOpen(false), 120);
                                            }}
                                            required
                                        />
                                        <input type="hidden" value={selectedCandidateId} required readOnly />
                                        {isDropdownOpen && (
                                            <ul className="menu bg-base-200 rounded-box absolute z-10 mt-2 w-full max-h-60 overflow-auto shadow">
                                                {filteredCandidates.length === 0 && (
                                                    <li className="p-3 text-sm text-base-content/70">No matches found</li>
                                                )}
                                                {filteredCandidates.map((candidate) => (
                                                    <li key={candidate.id}>
                                                        <button
                                                            type="button"
                                                            className="flex flex-col items-start gap-1 p-3 text-left"
                                                            onMouseDown={(e) => e.preventDefault()}
                                                            onClick={() => {
                                                                setSelectedCandidateId(candidate.id);
                                                                setCandidateSearch(`${candidate.full_name} (${candidate.email})`);
                                                                setIsDropdownOpen(false);
                                                            }}
                                                        >
                                                            <span className="font-medium">{candidate.full_name}</span>
                                                            <span className="text-sm text-base-content/70">{candidate.email}</span>
                                                            {(candidate.current_title || candidate.current_company) && (
                                                                <span className="text-xs text-base-content/60">
                                                                    {candidate.current_title}
                                                                    {candidate.current_title && candidate.current_company ? ' • ' : ''}
                                                                    {candidate.current_company}
                                                                </span>
                                                            )}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ) : (
                                    <div className="alert">
                                        <i className="fa-solid fa-info-circle"></i>
                                        <span>No existing candidates found. Please add a new candidate.</span>
                                    </div>
                                )}
                            </div>

                            {/* Notes for existing candidate submission */}
                            <div className="fieldset">
                                <label className="label">Submission Notes</label>
                                <textarea
                                    className="textarea w-full h-24"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Why is this candidate a great fit for this role?"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            {/* New Candidate Form */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="fieldset">
                                    <label className="label">Full Name *</label>
                                    <input
                                        type="text"
                                        className="input w-full"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="fieldset">
                                    <label className="label">Email *</label>
                                    <input
                                        type="email"
                                        className="input w-full"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="fieldset">
                                    <label className="label">Phone</label>
                                    <input
                                        type="tel"
                                        className="input w-full"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+1 (555) 123-4567"
                                    />
                                </div>

                                <div className="fieldset">
                                    <label className="label">Location</label>
                                    <input
                                        type="text"
                                        className="input w-full"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="City, State/Country"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="fieldset">
                                    <label className="label">Current Title</label>
                                    <input
                                        type="text"
                                        className="input w-full"
                                        value={formData.current_title}
                                        onChange={(e) => setFormData({ ...formData, current_title: e.target.value })}
                                        placeholder="e.g., Senior Software Engineer"
                                    />
                                </div>

                                <div className="fieldset">
                                    <label className="label">Current Company</label>
                                    <input
                                        type="text"
                                        className="input w-full"
                                        value={formData.current_company}
                                        onChange={(e) => setFormData({ ...formData, current_company: e.target.value })}
                                        placeholder="e.g., Acme Corp"
                                    />
                                </div>
                            </div>

                            <div className="fieldset">
                                <label className="label">LinkedIn URL</label>
                                <input
                                    type="url"
                                    className="input w-full"
                                    value={formData.linkedin_url}
                                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                                    placeholder="https://linkedin.com/in/..."
                                />
                            </div>

                            <div className="fieldset">
                                <label className="label">Submission Notes</label>
                                <textarea
                                    className="textarea w-full h-24"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Why is this candidate a great fit for this role?"
                                />
                            </div>
                        </>
                    )}

                    <div className="fieldset">
                        <label className="label">Proposal Pitch *</label>
                        <textarea
                            className="textarea w-full h-24"
                            value={pitch}
                            onChange={(e) => setPitch(e.target.value)}
                            placeholder="Share why this role is a great fit for the candidate"
                            required
                        />
                        <label className="label">
                            <span className="label-text-alt">{pitch.length} / 500 characters</span>
                        </label>
                    </div>

                    <div className="fieldset">
                        <label className="label">
                            Resume (Optional)
                            <span className="label-text-alt text-base-content/60">PDF, DOC, DOCX, or TXT - Max 10MB</span>
                        </label>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="file-input w-full"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={handleFileChange}
                        />
                        {resumeFile && (
                            <div className="mt-2 flex items-center gap-2">
                                <i className="fa-solid fa-file text-primary"></i>
                                <span className="text-sm">{resumeFile.name}</span>
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-xs"
                                    onClick={() => {
                                        setResumeFile(null);
                                        if (fileInputRef.current) {
                                            fileInputRef.current.value = '';
                                        }
                                    }}
                                >
                                    <i className="fa-solid fa-times"></i>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="modal-action">
                        <button
                            type="button"
                            className="btn"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={
                                submitting ||
                                (mode === 'select' && !selectedCandidateId) ||
                                !pitch.trim()
                            }
                        >
                            {submitting ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Sending...
                                </>
                            ) : (
                                'Send Proposal'
                            )}
                        </button>
                    </div>
                </form>
            </div>
            <div className="modal-backdrop" onClick={onClose}></div>
        </div>
    );
}
