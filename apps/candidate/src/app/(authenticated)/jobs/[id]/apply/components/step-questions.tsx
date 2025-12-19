'use client';

import { useState } from 'react';

interface PreScreenQuestion {
  id: string;
  question_text: string;
  question_type: 'text' | 'yes_no' | 'select' | 'multi_select';
  is_required: boolean;
  options?: string[];
}

interface Answer {
  question_id: string;
  answer: string | string[] | boolean;
}

interface StepQuestionsProps {
  questions: PreScreenQuestion[];
  answers: Answer[];
  onChange: (answers: Answer[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepQuestions({
  questions,
  answers,
  onChange,
  onNext,
  onBack,
}: StepQuestionsProps) {
  const [error, setError] = useState<string | null>(null);

  const getAnswer = (questionId: string) => {
    return answers.find(a => a.question_id === questionId)?.answer;
  };

  const setAnswer = (questionId: string, answer: string | string[] | boolean) => {
    const newAnswers = answers.filter(a => a.question_id !== questionId);
    newAnswers.push({ question_id: questionId, answer });
    onChange(newAnswers);
    setError(null);
  };

  const handleNext = () => {
    // Validate required questions
    const missingRequired = questions
      .filter(q => q.is_required)
      .filter(q => {
        const ans = getAnswer(q.id);
        if (ans === undefined || ans === null || ans === '') return true;
        if (Array.isArray(ans) && ans.length === 0) return true;
        return false;
      });

    if (missingRequired.length > 0) {
      setError(`Please answer all required questions (${missingRequired.length} remaining)`);
      return;
    }

    onNext();
  };

  if (questions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="alert alert-info">
          <i className="fa-solid fa-circle-info"></i>
          <span>No pre-screening questions for this position.</span>
        </div>

        <div className="flex justify-between">
          <button type="button" className="btn" onClick={onBack}>
            <i className="fa-solid fa-arrow-left"></i>
            Back
          </button>
          <button type="button" className="btn btn-primary" onClick={onNext}>
            Next: Review
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Pre-Screening Questions</h2>
        <p className="text-base-content/70">
          Please answer the following questions about your qualifications.
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          <i className="fa-solid fa-circle-exclamation"></i>
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-6">
        {questions.map((question, index) => (
          <div key={question.id} className="card bg-base-200">
            <div className="card-body">
              <div className="fieldset">
                <label className="label">
                  <span className="font-medium">
                    {index + 1}. {question.question_text}
                    {question.is_required && (
                      <span className="text-error ml-1">*</span>
                    )}
                  </span>
                </label>

                {/* Text Input */}
                {question.question_type === 'text' && (
                  <textarea
                    className="textarea h-24"
                    value={(getAnswer(question.id) as string) || ''}
                    onChange={(e) => setAnswer(question.id, e.target.value)}
                    placeholder="Enter your answer..."
                    required={question.is_required}
                  />
                )}

                {/* Yes/No */}
                {question.question_type === 'yes_no' && (
                  <div className="flex gap-4">
                    <label className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        className="radio radio-primary"
                        checked={getAnswer(question.id) === true}
                        onChange={() => setAnswer(question.id, true)}
                      />
                      <span>Yes</span>
                    </label>
                    <label className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        className="radio radio-primary"
                        checked={getAnswer(question.id) === false}
                        onChange={() => setAnswer(question.id, false)}
                      />
                      <span>No</span>
                    </label>
                  </div>
                )}

                {/* Select (Single) */}
                {question.question_type === 'select' && (
                  <select
                    className="select"
                    value={(getAnswer(question.id) as string) || ''}
                    onChange={(e) => setAnswer(question.id, e.target.value)}
                    required={question.is_required}
                  >
                    <option value="">Select an option...</option>
                    {question.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}

                {/* Multi-Select */}
                {question.question_type === 'multi_select' && (
                  <div className="space-y-2">
                    {question.options?.map((option) => {
                      const currentAnswers = (getAnswer(question.id) as string[]) || [];
                      const isChecked = currentAnswers.includes(option);
                      
                      return (
                        <label key={option} className="label cursor-pointer justify-start gap-3">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-primary"
                            checked={isChecked}
                            onChange={(e) => {
                              const newAnswers = e.target.checked
                                ? [...currentAnswers, option]
                                : currentAnswers.filter(a => a !== option);
                              setAnswer(question.id, newAnswers);
                            }}
                          />
                          <span>{option}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button type="button" className="btn" onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i>
          Back
        </button>
        <button type="button" className="btn btn-primary" onClick={handleNext}>
          Next: Review
          <i className="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </div>
  );
}
