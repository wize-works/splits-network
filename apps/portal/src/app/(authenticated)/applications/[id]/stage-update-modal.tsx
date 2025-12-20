'use client';

import { useState } from 'react';

interface StageUpdateModalProps {
    currentStage: string;
    onClose: () => void;
    onUpdate: (newStage: string, notes?: string) => Promise<void>;
    loading: boolean;
}

const STAGES = [
    { value: 'draft', label: 'Draft', icon: 'fa-file-lines' },
    { value: 'screen', label: 'Screening', icon: 'fa-magnifying-glass' },
    { value: 'submitted', label: 'Submitted', icon: 'fa-paper-plane' },
    { value: 'interview', label: 'Interview', icon: 'fa-calendar' },
    { value: 'offer', label: 'Offer', icon: 'fa-handshake' },
    { value: 'hired', label: 'Hired', icon: 'fa-circle-check' },
    { value: 'rejected', label: 'Rejected', icon: 'fa-xmark' },
];

export default function StageUpdateModal({
    currentStage,
    onClose,
    onUpdate,
    loading,
}: StageUpdateModalProps) {
    const [selectedStage, setSelectedStage] = useState(currentStage);
    const [notes, setNotes] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onUpdate(selectedStage, notes || undefined);
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-2xl">
                <h3 className="font-bold text-lg mb-4">
                    <i className="fa-solid fa-arrow-right-arrow-left mr-2"></i>
                    Update Application Stage
                </h3>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* Current Stage Info */}
                        <div className="alert alert-info">
                            <i className="fa-solid fa-info-circle"></i>
                            <div>
                                <p className="text-sm">
                                    Current stage: <strong>{STAGES.find(s => s.value === currentStage)?.label}</strong>
                                </p>
                                <p className="text-xs">Select a new stage below to update the application.</p>
                            </div>
                        </div>

                        {/* Stage Selection */}
                        <div className="fieldset">
                            <label className="label">New Stage *</label>
                            <select
                                className="select w-full"
                                value={selectedStage}
                                onChange={(e) => setSelectedStage(e.target.value)}
                                required
                            >
                                {STAGES.map((stage) => (
                                    <option key={stage.value} value={stage.value}>
                                        {stage.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Stage Preview */}
                        <div className="grid grid-cols-3 gap-2">
                            {STAGES.map((stage) => {
                                const isSelected = stage.value === selectedStage;
                                const isCurrent = stage.value === currentStage;
                                return (
                                    <button
                                        key={stage.value}
                                        type="button"
                                        onClick={() => setSelectedStage(stage.value)}
                                        className={`btn btn-sm ${isSelected
                                                ? 'btn-primary'
                                                : isCurrent
                                                    ? 'btn-outline'
                                                    : 'btn-ghost'
                                            }`}
                                    >
                                        <i className={`fa-solid ${stage.icon}`}></i>
                                        {stage.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Notes */}
                        <div className="fieldset">
                            <label className="label">Notes (optional)</label>
                            <textarea
                                className="textarea h-24 w-full"
                                placeholder="Add any notes about this stage change..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                            <label className="label">
                                <span className="label-text-alt">
                                    These notes will be visible in the application timeline
                                </span>
                            </label>
                        </div>

                        {/* Warning for Terminal Stages */}
                        {(selectedStage === 'hired' || selectedStage === 'rejected') && (
                            <div className={`alert ${selectedStage === 'hired' ? 'alert-success' : 'alert-warning'}`}>
                                <i className={`fa-solid ${selectedStage === 'hired' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
                                <div>
                                    <p className="text-sm font-semibold">
                                        {selectedStage === 'hired' ? 'Final Stage' : 'Application Will Be Closed'}
                                    </p>
                                    <p className="text-xs">
                                        {selectedStage === 'hired'
                                            ? 'This will mark the application as successfully hired. Consider converting to a placement record.'
                                            : 'This will close the application. You can reopen it later if needed.'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="modal-action">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || selectedStage === currentStage}
                        >
                            {loading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-save"></i>
                                    Update Stage
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={onClose}>close</button>
            </form>
        </div>
    );
}
