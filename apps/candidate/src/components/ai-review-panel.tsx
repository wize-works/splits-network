'use client';

import { useState, useEffect } from 'react';

interface AIReview {
    id: string;
    application_id: string;
    fit_score: number;
    recommendation: 'strong_fit' | 'good_fit' | 'fair_fit' | 'poor_fit';
    overall_summary: string;
    confidence_level: number;
    strengths: string[];
    concerns: string[];
    matched_skills: string[];
    missing_skills: string[];
    skills_match_percentage: number;
    required_years?: number;
    candidate_years?: number;
    meets_experience_requirement?: boolean;
    location_compatibility: 'perfect' | 'good' | 'challenging' | 'mismatch';
    model_version: string;
    processing_time_ms: number;
    analyzed_at: string;
    created_at: string;
}

interface AIReviewPanelProps {
    applicationId: string;
    token: string;
}

const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
        case 'strong_fit':
            return 'badge-success';
        case 'good_fit':
            return 'badge-info';
        case 'fair_fit':
            return 'badge-warning';
        case 'poor_fit':
            return 'badge-error';
        default:
            return 'badge-ghost';
    }
};

const getRecommendationLabel = (recommendation: string) => {
    switch (recommendation) {
        case 'strong_fit':
            return 'Strong Match';
        case 'good_fit':
            return 'Good Match';
        case 'fair_fit':
            return 'Fair Match';
        case 'poor_fit':
            return 'Needs Improvement';
        default:
            return recommendation;
    }
};

const getFitScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 70) return 'text-info';
    if (score >= 50) return 'text-warning';
    return 'text-error';
};

const getLocationLabel = (compatibility: string) => {
    switch (compatibility) {
        case 'perfect':
            return 'Perfect Match';
        case 'good':
            return 'Good Match';
        case 'challenging':
            return 'Challenging';
        case 'mismatch':
            return 'Location Mismatch';
        default:
            return compatibility;
    }
};

export default function AIReviewPanel({ applicationId, token }: AIReviewPanelProps) {
    const [loading, setLoading] = useState(true);
    const [aiReview, setAIReview] = useState<AIReview | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchAIReview() {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
                const response = await fetch(`${apiUrl}/applications/${applicationId}/ai-review`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    if (response.status === 404) {
                        // No AI review yet
                        setAIReview(null);
                        return;
                    }
                    throw new Error('Failed to fetch AI review');
                }

                const data = await response.json();
                setAIReview(data.data);
            } catch (err) {
                console.error('Error fetching AI review:', err);
                setError(err instanceof Error ? err.message : 'Failed to load AI review');
            } finally {
                setLoading(false);
            }
        }

        fetchAIReview();
    }, [applicationId, token]);

    if (loading) {
        return (
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title">
                        <i className="fa-solid fa-robot"></i>
                        AI Analysis
                    </h2>
                    <div className="flex items-center justify-center py-8">
                        <span className="loading loading-spinner loading-lg"></span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-error">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>{error}</span>
            </div>
        );
    }

    if (!aiReview) {
        return (
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title">
                        <i className="fa-solid fa-robot"></i>
                        AI Analysis
                    </h2>
                    <div className="alert alert-info">
                        <i className="fa-solid fa-circle-info"></i>
                        <span>Your application is being reviewed by our AI system. You'll receive an email when the analysis is complete.</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <h2 className="card-title">
                    <i className="fa-solid fa-robot"></i>
                    AI Analysis
                </h2>

                {/* Fit Score */}
                <div className="stats shadow">
                    <div className="stat">
                        <div className="stat-title">Match Score</div>
                        <div className={`stat-value ${getFitScoreColor(aiReview.fit_score)}`}>
                            {aiReview.fit_score}/100
                        </div>
                        <div className="stat-desc">
                            <span className={`badge ${getRecommendationColor(aiReview.recommendation)}`}>
                                {getRecommendationLabel(aiReview.recommendation)}
                            </span>
                        </div>
                    </div>
                    <div className="stat">
                        <div className="stat-title">Confidence Level</div>
                        <div className="stat-value text-primary">{aiReview.confidence_level}%</div>
                        <div className="stat-desc">AI confidence in analysis</div>
                    </div>
                </div>

                {/* Overall Summary */}
                <div className="mt-4">
                    <h3 className="font-semibold text-lg mb-2">Summary</h3>
                    <p className="text-base-content/80">{aiReview.overall_summary}</p>
                </div>

                {/* Strengths */}
                {aiReview.strengths.length > 0 && (
                    <div className="mt-4">
                        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                            <i className="fa-solid fa-circle-check text-success"></i>
                            Your Strengths
                        </h3>
                        <ul className="list-disc list-inside space-y-1">
                            {aiReview.strengths.map((strength, index) => (
                                <li key={index} className="text-base-content/80">{strength}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Concerns */}
                {aiReview.concerns.length > 0 && (
                    <div className="mt-4">
                        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                            <i className="fa-solid fa-circle-exclamation text-warning"></i>
                            Areas to Address
                        </h3>
                        <ul className="list-disc list-inside space-y-1">
                            {aiReview.concerns.map((concern, index) => (
                                <li key={index} className="text-base-content/80">{concern}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Skills Match */}
                <div className="mt-4">
                    <h3 className="font-semibold text-lg mb-2">Skills Analysis</h3>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">Skills Match:</span>
                        <div className="flex-1">
                            <progress
                                className="progress progress-success w-full"
                                value={aiReview.skills_match_percentage}
                                max="100"
                            ></progress>
                        </div>
                        <span className="text-sm font-semibold">{aiReview.skills_match_percentage}%</span>
                    </div>

                    {aiReview.matched_skills.length > 0 && (
                        <div className="mb-2">
                            <span className="text-sm font-medium">Matched Skills:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {aiReview.matched_skills.map((skill, index) => (
                                    <span key={index} className="badge badge-success badge-sm">{skill}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {aiReview.missing_skills.length > 0 && (
                        <div>
                            <span className="text-sm font-medium">Skills to Develop:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {aiReview.missing_skills.map((skill, index) => (
                                    <span key={index} className="badge badge-warning badge-sm">{skill}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Experience & Location */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiReview.candidate_years !== undefined && aiReview.required_years !== undefined && (
                        <div>
                            <h4 className="font-medium text-sm mb-1">Experience</h4>
                            <div className="flex items-center gap-2">
                                {aiReview.meets_experience_requirement ? (
                                    <i className="fa-solid fa-circle-check text-success"></i>
                                ) : (
                                    <i className="fa-solid fa-circle-xmark text-warning"></i>
                                )}
                                <span className="text-sm">
                                    {aiReview.candidate_years} years (Required: {aiReview.required_years})
                                </span>
                            </div>
                        </div>
                    )}

                    <div>
                        <h4 className="font-medium text-sm mb-1">Location</h4>
                        <span className="text-sm">{getLocationLabel(aiReview.location_compatibility)}</span>
                    </div>
                </div>

                {/* Analysis Info */}
                <div className="mt-4 text-xs text-base-content/60">
                    <p>Analyzed by {aiReview.model_version} on {new Date(aiReview.analyzed_at).toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
}
