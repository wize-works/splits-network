'use client';

import { useState } from 'react';
import Link from 'next/link';

interface StepDocumentsProps {
  documents: any[];
  selected: string[];
  primaryResumeId: string | null;
  onChange: (docs: { selected: string[]; primary_resume_id: string | null }) => void;
  onNext: () => void;
}

export default function StepDocuments({
  documents,
  selected,
  primaryResumeId,
  onChange,
  onNext,
}: StepDocumentsProps) {
  const resumes = documents.filter(doc => doc.document_type === 'resume');
  const otherDocs = documents.filter(doc => doc.document_type !== 'resume');

  const [error, setError] = useState<string | null>(null);

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
    onChange({ selected: newSelected, primary_resume_id: docId });
    setError(null);
  };

  const handleNext = () => {
    // Validation
    if (selected.length === 0) {
      setError('Please select at least one document');
      return;
    }

    const hasResume = selected.some(id => {
      const doc = documents.find(d => d.id === id);
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

  if (documents.length === 0) {
    return (
      <div className="space-y-6">
        <div className="alert alert-info">
          <i className="fa-solid fa-circle-info"></i>
          <span>You need to upload documents before applying.</span>
        </div>
        
        <div className="text-center">
          <Link href="/documents" className="btn btn-primary">
            <i className="fa-solid fa-upload"></i>
            Go to Documents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Select Documents</h2>
        <p className="text-base-content/70">
          Choose which documents to include with your application. At least one resume is required.
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          <i className="fa-solid fa-circle-exclamation"></i>
          <span>{error}</span>
        </div>
      )}

      {/* Resumes */}
      {resumes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Resumes</h3>
          <div className="space-y-2">
            {resumes.map((doc) => (
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
      {otherDocs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Additional Documents</h3>
          <div className="space-y-2">
            {otherDocs.map((doc) => (
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
        <Link href="/documents" className="btn btn-ghost">
          <i className="fa-solid fa-upload"></i>
          Upload More
        </Link>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleNext}
        >
          Next: {selected.length > 0 ? 'Questions' : 'Select Documents'}
          <i className="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </div>
  );
}
