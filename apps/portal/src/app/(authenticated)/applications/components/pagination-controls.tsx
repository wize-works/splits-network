interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    disabled?: boolean;
}

export function PaginationControls({
    currentPage,
    totalPages,
    onPageChange,
    disabled = false,
}: PaginationControlsProps) {
    if (totalPages <= 1) return null;

    // Calculate page numbers to display (max 5)
    const getPageNumbers = () => {
        const pages: number[] = [];

        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else if (currentPage <= 3) {
            for (let i = 1; i <= 5; i++) {
                pages.push(i);
            }
        } else if (currentPage >= totalPages - 2) {
            for (let i = totalPages - 4; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            for (let i = currentPage - 2; i <= currentPage + 2; i++) {
                pages.push(i);
            }
        }

        return pages;
    };

    return (
        <div className="flex justify-center items-center gap-2">
            <button
                className="btn btn-sm"
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1 || disabled}
                aria-label="First page"
            >
                <i className="fa-solid fa-angles-left"></i>
            </button>
            <button
                className="btn btn-sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1 || disabled}
                aria-label="Previous page"
            >
                <i className="fa-solid fa-angle-left"></i>
            </button>

            <div className="flex gap-1">
                {getPageNumbers().map(pageNum => (
                    <button
                        key={pageNum}
                        className={`btn btn-sm ${currentPage === pageNum ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => onPageChange(pageNum)}
                        disabled={disabled}
                    >
                        {pageNum}
                    </button>
                ))}
            </div>

            <button
                className="btn btn-sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages || disabled}
                aria-label="Next page"
            >
                <i className="fa-solid fa-angle-right"></i>
            </button>
            <button
                className="btn btn-sm"
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages || disabled}
                aria-label="Last page"
            >
                <i className="fa-solid fa-angles-right"></i>
            </button>
        </div>
    );
}
