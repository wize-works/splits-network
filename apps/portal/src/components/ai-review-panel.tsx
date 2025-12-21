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
    compact?: boolean;
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
            return 'Poor Match';
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

export default function AIReviewPanel({ applicationId, token, compact = false }: AIReviewPanelProps) {
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
                    <h3 className="card-title text-lg">
                        <i className="fa-solid fa-robot"></i>
                        AI Analysis
                    </h3>
                    <div className="flex items-center justify-center py-4">
                        <span className="loading loading-spinner loading-md"></span>
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
                    <h3 className="card-title text-lg">
                        <i className="fa-solid fa-robot"></i>
                        AI Analysis
                    </h3>
                    <div className="alert alert-info">
                        <i className="fa-solid fa-circle-info"></i>
                        <span>AI analysis is in progress or not available for this application.</span>
                    </div>
                </div>
            </div>
        );
    }

    if (compact) {
        return (
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <h3 className="card-title text-lg">
                        <i className="fa-solid fa-robot"></i>
                        AI Analysis
                    </h3>

                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <div className="text-sm text-base-content/60">Match Score</div>
                            <div className={`text-3xl font-bold ${getFitScoreColor(aiReview.fit_score)}`}>
                                {aiReview.fit_score}/100
                            </div>
                        </div>
                        <span className={`badge ${getRecommendationColor(aiReview.recommendation)} badge-lg`}>
                            {getRecommendationLabel(aiReview.recommendation)}
                        </span>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <div className="text-sm font-medium mb-1">Skills Match: {aiReview.skills_match_percentage}%</div>
                            <progress
                                className="progress progress-success w-full"
                                value={aiReview.skills_match_percentage}
                                max="100"
                            ></progress>
                        </div>

                        {aiReview.strengths.length > 0 && (
                            <div>
                                <div className="text-sm font-medium mb-1">
                                    <i className="fa-solid fa-circle-check text-success mr-1"></i>
                                    Top Strengths
                                </div>
                                <ul className="text-sm space-y-1">
                                    {aiReview.strengths.slice(0, 3).map((strength, index) => (
                                        <li key={index} className="text-base-content/80">• {strength}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {aiReview.concerns.length > 0 && (
                            <div>
                                <div className="text-sm font-medium mb-1">
                                    <i className="fa-solid fa-triangle-exclamation text-warning mr-1"></i>
                                    Areas to Address
                                </div>
                                <ul className="text-sm space-y-1">
                                    {aiReview.concerns.slice(0, 2).map((concern, index) => (
                                        <li key={index} className="text-base-content/80">• {concern}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <h3 className="card-title text-lg mb-4">
                    <i className="fa-solid fa-robot"></i>
                    AI Analysis
                </h3>

                {/* Fit Score & Recommendation */}
                <div className="stats shadow mb-4">
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
                        <div className="stat-title">Confidence</div>
                        <div className="stat-value text-primary">{aiReview.confidence_level}%</div>
                        <div className="stat-desc">AI confidence level</div>
                    </div>
                </div>

                {/* Overall Summary */}
                <div className="mb-4">
                    <h4 className="font-semibold text-base mb-2">Summary</h4>
                    <p className="text-sm text-base-content/80">{aiReview.overall_summary}</p>
                </div>

                {/* Strengths */}
                {aiReview.strengths.length > 0 && (
                    <div className="mb-4">
                        <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                            <i className="fa-solid fa-circle-check text-success"></i>
                            Key Strengths
                        </h4>
                        <ul className="list-disc list-inside space-y-1">
                            {aiReview.strengths.map((strength, index) => (
                                <li key={index} className="text-sm text-base-content/80">{strength}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Concerns */}
                {aiReview.concerns.length > 0 && (
                    <div className="mb-4">
                        <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                            <i className="fa-solid fa-triangle-exclamation text-warning"></i>
                            Areas to Address
                        </h4>
                        <ul className="list-disc list-inside space-y-1">
                            {aiReview.concerns.map((concern, index) => (
                                <li key={index} className="text-sm text-base-content/80">{concern}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Skills Match */}
                <div className="mb-4">
                    <h4 className="font-semibold text-base mb-2">Skills Analysis</h4>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm">Match Rate:</span>
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
                            <span className="text-sm font-medium">Missing Skills:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {aiReview.missing_skills.map((skill, index) => (
                                    <span key={index} className="badge badge-warning badge-sm">{skill}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Experience & Location */}
                <div className="grid grid-cols-2 gap-4 mb-4">
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
                                    {aiReview.candidate_years} yrs (Req: {aiReview.required_years})
                                </span>
                            </div>
                        </div>
                    )}

                    <div>
                        <h4 className="font-medium text-sm mb-1">Location</h4>
                        <span className="text-sm">{getLocationLabel(aiReview.location_compatibility)}</span>
                    </div>
                </div>

                {/* Analysis Metadata */}
                <div className="text-xs text-base-content/60 border-t pt-2">
                    <p>Analyzed by {aiReview.model_version} on {new Date(aiReview.analyzed_at).toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
}
