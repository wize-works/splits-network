'use client';

interface Stage {
    key: string;
    label: string;
    color: string;
}

interface StageChangeDropdownProps {
    currentStage: string;
    stages: Stage[];
    onStageChange: (newStage: string) => void;
}

export default function StageChangeDropdown({ currentStage, stages, onStageChange }: StageChangeDropdownProps) {
    const stage = stages.find(s => s.key === currentStage);

    return (
        <div className="dropdown">
            <label tabIndex={0} className={`badge ${stage?.color} cursor-pointer gap-2`}>
                {stage?.label}
                <i className="fa-solid fa-chevron-down text-xs"></i>
            </label>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 mt-1">
                {stages.map((s) => (
                    <li key={s.key}>
                        <a
                            onClick={() => {
                                if (s.key !== currentStage) {
                                    onStageChange(s.key);
                                }
                            }}
                            className={currentStage === s.key ? 'active' : ''}
                        >
                            <span className={`badge ${s.color} badge-sm`}></span>
                            {s.label}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
