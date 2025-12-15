# Grid/Table View Switching Pattern

This document outlines the standard pattern for implementing grid/table view switching functionality on list pages in the Splits Network portal frontend.

## Overview

The grid/table view switching pattern provides users with two different ways to view list data:
- **Grid View**: Card-based layout that shows richer content and works well for browsing
- **Table View**: Compact tabular layout that shows more items at once and works well for scanning

User preference is persisted in `localStorage` so the selected view mode is remembered across sessions.

---

## Technology Stack

- **React Hooks**: `useState`, `useEffect` for state management
- **Custom Hook**: `useViewMode` for view mode persistence
- **DaisyUI Components**: `btn`, `join`, `card`, `table`, `badge`
- **FontAwesome Icons**: `fa-grip` (grid), `fa-table` (table)

---

## Implementation Pattern

### 1. Import the Custom Hook

The `useViewMode` hook handles view mode state and `localStorage` persistence:

```tsx
import { useViewMode } from '@/hooks/useViewMode';
```

### 2. Initialize View Mode State

In your component, initialize the view mode with a unique storage key:

```tsx
const [viewMode, setViewMode] = useViewMode('uniqueStorageKey');
```

**Storage Key Naming Convention**: Use the pattern `{entity}ViewMode`:
- Roles: `rolesViewMode`
- Candidates: `candidatesViewMode`
- Placements: `placementsViewMode`
- Companies: `companiesViewMode`

### 3. Add View Toggle Buttons

Place the view toggle buttons in the filters/controls section using DaisyUI's `join` component:

```tsx
<div className="join">
    <button 
        className={`btn join-item ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
        onClick={() => setViewMode('grid')}
        title="Grid View"
    >
        <i className="fa-solid fa-grip"></i>
    </button>
    <button 
        className={`btn join-item ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
        onClick={() => setViewMode('table')}
        title="Table View"
    >
        <i className="fa-solid fa-table"></i>
    </button>
</div>
```

**Key Features**:
- Buttons are grouped using `join` for visual consistency
- Active button uses `btn-primary`, inactive uses `btn-ghost`
- Include `title` attributes for accessibility
- Use FontAwesome icons: `fa-grip` for grid, `fa-table` for table

### 4. Implement Conditional Rendering

Render different layouts based on the `viewMode` state:

```tsx
{/* Grid View */}
{viewMode === 'grid' && filteredItems.length > 0 && (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
            <div key={item.id} className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
                {/* Card content */}
            </div>
        ))}
    </div>
)}

{/* Table View */}
{viewMode === 'table' && filteredItems.length > 0 && (
    <div className="card bg-base-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="table">
                {/* Table content */}
            </table>
        </div>
    </div>
)}
```

---

## Grid View Design Guidelines

### Layout Structure

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {items.map((item) => (
        <div key={item.id} className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="card-body">
                {/* Header section with title and status */}
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <Link href={`/path/${item.id}`} className="hover:text-primary transition-colors">
                            <h3 className="card-title text-xl">{item.title}</h3>
                        </Link>
                        <div className="flex items-center gap-4 mt-2 text-sm text-base-content/70">
                            {/* Metadata with icons */}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        {/* Status badge */}
                        <div className={`badge ${getStatusBadge(item.status)}`}>
                            {item.status}
                        </div>
                    </div>
                </div>

                {/* Actions section */}
                <div className="card-actions justify-between items-center mt-4">
                    <span className="text-sm text-base-content/60">
                        {/* Timestamp or secondary info */}
                    </span>
                    <div className="flex gap-2">
                        {/* Action buttons */}
                    </div>
                </div>
            </div>
        </div>
    ))}
</div>
```

### Key Design Principles

1. **Responsive Grid**: Use `grid-cols-1 md:grid-cols-3` for mobile-first responsive layout
2. **Visual Feedback**: Apply `hover:shadow-md` and `transition-shadow` for card hover effects
3. **Title Links**: Make titles clickable links with `hover:text-primary` for visual feedback
4. **Metadata with Icons**: Use FontAwesome icons with descriptive text for metadata
5. **Status Badges**: Position in top-right corner of card
6. **Card Actions**: Place at bottom with clear primary action button

---

## Table View Design Guidelines

### Layout Structure

```tsx
<div className="card bg-base-100 shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
        <table className="table">
            <thead>
                <tr>
                    <th>Column 1</th>
                    <th>Column 2</th>
                    <th>Column 3</th>
                    <th className="text-right">Actions</th>
                </tr>
            </thead>
            <tbody>
                {items.map((item) => (
                    <tr key={item.id} className="hover">
                        <td>
                            <Link href={`/path/${item.id}`} className="font-semibold hover:text-primary transition-colors">
                                {item.title}
                            </Link>
                            <div className="text-sm text-base-content/60 mt-1">
                                {/* Secondary info */}
                            </div>
                        </td>
                        <td>{/* Column data */}</td>
                        <td>
                            <div className={`badge ${getStatusBadge(item.status)}`}>
                                {item.status}
                            </div>
                        </td>
                        <td>
                            <div className="flex gap-2 justify-end">
                                {/* Action buttons */}
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
</div>
```

### Key Design Principles

1. **Wrapping Card**: Wrap table in a card with `overflow-hidden` for clean edges
2. **Horizontal Scroll**: Use `overflow-x-auto` for responsive horizontal scrolling
3. **Row Hover**: Apply `hover` class to `<tr>` elements for row highlighting
4. **Primary Column**: First column should contain the main identifier (usually linked)
5. **Actions Column**: Right-align actions column with `text-right` on header and `justify-end` on buttons
6. **Icon-only Buttons**: Use icon-only buttons with `title` attributes in table view to save space
7. **Compact Data**: Use smaller text and compact badges for efficient space usage

---

## Filters and Controls Layout

The view toggle should be placed alongside other filters in a consistent layout:

```tsx
<div className="card bg-base-100 shadow-sm">
    <div className="card-body">
        <div className="flex flex-wrap gap-4 items-end">
            {/* Status Filter */}
            <div className="fieldset">
                <label className="label">Status</label>
                <select 
                    className="select w-full max-w-xs"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="all">All Statuses</option>
                    {/* Options */}
                </select>
            </div>

            {/* Search Input */}
            <div className="fieldset flex-1">
                <label className="label">Search</label>
                <input
                    type="text"
                    placeholder="Search..."
                    className="input w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* View Toggle */}
            <div className="join">
                <button 
                    className={`btn join-item ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setViewMode('grid')}
                    title="Grid View"
                >
                    <i className="fa-solid fa-grip"></i>
                </button>
                <button 
                    className={`btn join-item ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setViewMode('table')}
                    title="Table View"
                >
                    <i className="fa-solid fa-table"></i>
                </button>
            </div>
        </div>
    </div>
</div>
```

**Layout Notes**:
- Use `flex flex-wrap gap-4 items-end` to align filters and controls
- Place view toggle at the end (right side) of the controls row
- Use `flex-1` on search input to make it fill available space
- Use `fieldset` wrapper for form controls (per form-controls.md)

---

## Empty State Handling

Both grid and table views should share the same empty state:

```tsx
{/* Empty State */}
{filteredItems.length === 0 && (
    <div className="card bg-base-100 shadow-sm">
        <div className="card-body text-center py-12">
            <i className="fa-solid fa-icon-name text-6xl text-base-content/20"></i>
            <h3 className="text-xl font-semibold mt-4">No Items Found</h3>
            <p className="text-base-content/70 mt-2">
                {searchQuery ? 'Try adjusting your search' : 'No items have been created yet'}
            </p>
        </div>
    </div>
)}
```

**Key Features**:
- Place empty state outside the grid/table conditionals
- Use large icon (text-6xl) with low opacity (text-base-content/20)
- Provide contextual message based on whether filters are active
- Keep consistent card styling with other UI elements

---

## The useViewMode Hook

### Source Code

Located at: `apps/portal/src/hooks/useViewMode.ts`

```typescript
import { useState, useEffect } from 'react';

type ViewMode = 'grid' | 'table';

/**
 * Custom hook to manage and persist view mode (grid/table) preference in localStorage
 * @param storageKey - Unique key for localStorage (e.g., 'rolesViewMode')
 * @param defaultMode - Default view mode if none is stored (defaults to 'grid')
 * @returns [viewMode, setViewMode] tuple
 */
export function useViewMode(
    storageKey: string,
    defaultMode: ViewMode = 'grid'
): [ViewMode, (mode: ViewMode) => void] {
    const [viewMode, setViewModeState] = useState<ViewMode>(() => {
        // Initialize from localStorage if available
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(storageKey);
            return (saved === 'grid' || saved === 'table') ? saved : defaultMode;
        }
        return defaultMode;
    });

    // Persist view mode to localStorage whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(storageKey, viewMode);
        }
    }, [viewMode, storageKey]);

    return [viewMode, setViewModeState];
}
```

### Usage

```typescript
const [viewMode, setViewMode] = useViewMode('myEntityViewMode', 'grid');
```

**Parameters**:
- `storageKey`: Unique identifier for localStorage (required)
- `defaultMode`: Initial view mode, defaults to `'grid'` (optional)

**Returns**: Tuple of `[viewMode, setViewMode]` similar to `useState`

---

## Complete Example

See [`apps/portal/src/app/(authenticated)/roles/components/RolesList.tsx`](../../../apps/portal/src/app/(authenticated)/roles/components/RolesList.tsx) for a complete reference implementation.

### Key Features Implemented

- ✅ View mode persistence with unique storage key
- ✅ Grid view with 3-column responsive layout
- ✅ Table view with horizontal scrolling
- ✅ Consistent filter controls layout
- ✅ Status badges and icons
- ✅ Primary actions in both views
- ✅ Shared empty state
- ✅ Accessibility (title attributes, semantic HTML)
- ✅ Responsive design (mobile-first)

---

## When to Use This Pattern

**Use grid/table view switching when**:
- The list contains 5+ items regularly
- Each item has rich metadata that benefits from card display
- Users need both browsing (grid) and scanning (table) modes
- The data is suitable for tabular representation

**Do NOT use this pattern when**:
- The list rarely exceeds 3-5 items
- The items don't have rich metadata for cards
- Only one view makes sense for the data type
- The page is not a primary list/index page

---

## Accessibility Considerations

1. **Button Labels**: Always include `title` attributes on view toggle buttons
2. **Keyboard Navigation**: Ensure buttons are keyboard accessible (native `<button>` elements)
3. **Screen Readers**: Use semantic HTML (`<table>`, `<thead>`, `<tbody>`, `<th>`)
4. **Focus Indicators**: Don't remove default focus styles
5. **ARIA Labels**: Consider adding `aria-label` to buttons for clarity

---

## Mobile Considerations

1. **Grid Layout**: Always start with `grid-cols-1` for mobile, then expand with `md:grid-cols-3`
2. **Card Actions**: Stack action buttons vertically on small screens if needed
3. **Table Scrolling**: Ensure `overflow-x-auto` is applied for horizontal scrolling
4. **View Toggle**: Icon-only buttons work well on mobile, but consider adding labels if space permits
5. **Touch Targets**: Ensure buttons meet minimum 44x44px touch target size

---

## Performance Considerations

1. **Conditional Rendering**: Use `&&` operator to avoid rendering both views simultaneously
2. **List Keys**: Always use stable, unique keys for list items (typically item IDs)
3. **Large Lists**: Consider pagination or virtual scrolling for lists with 100+ items
4. **localStorage**: The `useViewMode` hook only reads from localStorage on initial mount

---

## Maintenance Checklist

When adding view switching to a new page:

- [ ] Import and initialize `useViewMode` hook with unique storage key
- [ ] Add view toggle buttons in filters/controls section
- [ ] Implement grid view with 3-column responsive layout
- [ ] Implement table view with horizontal scrolling
- [ ] Add status badges and icons consistently
- [ ] Implement action buttons in both views
- [ ] Create shared empty state component
- [ ] Test on mobile devices and small screens
- [ ] Verify localStorage persistence works across sessions
- [ ] Add accessibility attributes (title, aria-label)
- [ ] Update this guidance document if you discover new patterns

---

## References

- [`useViewMode` hook](../../apps/portal/src/hooks/useViewMode.ts)
- [Roles page implementation](../../apps/portal/src/app/(authenticated)/roles/components/RolesList.tsx)
- [Form controls guidance](./form-controls.md)
- [DaisyUI Documentation](https://daisyui.com/components/)
- [TailwindCSS Grid](https://tailwindcss.com/docs/grid-template-columns)
- [FontAwesome Icons](https://fontawesome.com/icons)

---

**Last Updated**: December 14, 2025  
**Version**: 1.0
