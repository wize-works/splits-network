# Splits Network Portal

The main web application for Splits Network - a split-fee recruiting marketplace platform built with Next.js 16, Clerk authentication, TailwindCSS, and DaisyUI.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Authentication**: Clerk
- **Styling**: TailwindCSS + DaisyUI
- **Icons**: FontAwesome 6
- **TypeScript**: Full type safety with shared types
- **API**: Axios for HTTP requests to API Gateway

## Getting Started

### Prerequisites

- Node.js 20+ and pnpm 9+
- Clerk account with publishable and secret keys
- API Gateway running (see `services/api-gateway`)

### Installation

```bash
# From repository root
pnpm install

# Or from this directory
pnpm install
```

### Configuration

1. Copy the example environment file:

```bash
cp .env.example .env.local
```

2. Fill in your environment variables:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Development

```bash
# Run development server
pnpm dev

# The app will be available at http://localhost:3100
```

### Production Build

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with Clerk provider
│   ├── page.tsx           # Landing page
│   ├── sign-in/           # Clerk sign-in page
│   ├── sign-up/           # Clerk sign-up page
│   └── dashboard/         # Protected dashboard routes
│       ├── layout.tsx     # Dashboard layout with sidebar
│       ├── page.tsx       # Dashboard home
│       ├── roles/         # Roles management
│       ├── candidates/    # Candidates pipeline
│       ├── placements/    # Placements & earnings
│       └── admin/         # Admin panel
├── components/            # Reusable React components
├── lib/                   # Utilities and API clients
├── middleware.ts          # Clerk middleware for auth
└── globals.css           # Global styles
```

## Features

### Authentication (Clerk)

- Sign in / Sign up flows
- Session management
- Protected routes via middleware
- User profile integration

### Dashboard

- **Overview**: Summary cards with stats (active roles, candidates, placements)
- **Recent Activity**: Timeline of recent events
- **Sidebar Navigation**: Easy access to all features

### Roles Management

- List all roles assigned to recruiter
- View role details and pipeline
- Submit candidates to roles
- Filter by status, company, etc.

### Candidates

- View all submitted candidates
- Track application status
- View candidate profiles
- See application history

### Placements & Earnings

- List of successful placements
- Earnings breakdown (salary, fee %, recruiter share)
- Lifetime and period-based summaries

### Admin Panel (Platform Admins)

- View all roles and recruiters
- Assign/unassign recruiters to roles
- Approve pending recruiters
- Audit placements

## Styling

The app uses **DaisyUI** on top of TailwindCSS for consistent, beautiful UI components.

### DaisyUI Themes

The portal supports multiple themes (configured in `tailwind.config.js`):

- `light` - Default light theme
- `dark` - Dark mode
- `cupcake` - Soft pastel theme

### Common Components

- **btn**: Buttons with variants (primary, secondary, ghost, etc.)
- **card**: Content cards with titles and actions
- **badge**: Status indicators
- **table**: Data tables
- **drawer**: Responsive sidebar
- **navbar**: Top navigation
- **stat**: Statistics cards

### FontAwesome Icons

Icons are loaded from CDN (see `src/app/head.tsx`):

```tsx
<i className="fa-solid fa-briefcase"></i>
```

## API Integration

### API Client

Create an API client utility (example):

```ts
// src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Add Clerk token interceptor
api.interceptors.request.use(async (config) => {
  const token = await getToken(); // Get Clerk JWT
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Example API Calls

```ts
// Get user profile
const profile = await api.get('/api/me');

// List jobs
const jobs = await api.get('/api/jobs');

// Submit candidate
const application = await api.post('/api/applications', {
  job_id: '...',
  full_name: 'Jane Doe',
  email: 'jane@example.com',
});
```

## Clerk Integration

### Protected Routes

The middleware (`src/middleware.ts`) automatically protects routes:

- Public: `/`, `/sign-in`, `/sign-up`
- Protected: `/dashboard/*`

### User Context

Access the authenticated user in Server Components:

```tsx
import { auth } from '@clerk/nextjs/server';

export default async function MyPage() {
  const { userId } = await auth();
  // ...
}
```

In Client Components:

```tsx
'use client';
import { useUser } from '@clerk/nextjs';

export default function MyComponent() {
  const { user, isLoaded } = useUser();
  // ...
}
```

## Responsive Design

The app is fully responsive:

- **Mobile**: Hamburger menu with drawer
- **Tablet/Desktop**: Fixed sidebar navigation
- **Breakpoints**: Uses Tailwind's responsive classes (sm, md, lg, xl)

## Type Safety

The portal imports shared types from `@splits-network/shared-types`:

```ts
import type { Job, Application, Candidate } from '@splits-network/shared-types';
```

This ensures consistency between frontend and backend.

## Next Steps

1. **Implement API Client**: Create a proper API client in `src/lib/api.ts`
2. **Connect to Backend**: Wire up all pages to call API Gateway endpoints
3. **Add Loading States**: Implement skeletons and loading indicators
4. **Error Handling**: Add error boundaries and toast notifications
5. **Forms**: Build forms for creating jobs, submitting candidates, etc.
6. **Role-Based Access**: Implement recruiter vs company admin vs platform admin views
7. **Real-time Updates**: Consider WebSocket or polling for live updates
8. **Testing**: Add unit and integration tests

## Development Tips

- Use DaisyUI components for consistency
- Keep Server Components for data fetching
- Use Client Components only when needed (forms, interactive UI)
- Leverage Next.js Image component for optimized images
- Use the App Router's built-in loading and error states

## Troubleshooting

### Clerk not loading

- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set
- Check that Clerk domain is configured in project settings

### API calls failing

- Ensure API Gateway is running on the correct port
- Verify CORS settings in API Gateway allow portal origin
- Check that JWT token is being sent in Authorization header

### Styles not applying

- Run `pnpm dev` to rebuild Tailwind classes
- Check that `globals.css` is imported in root layout
- Verify DaisyUI plugin is configured in `tailwind.config.js`
