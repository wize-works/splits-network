import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/forgot-password(.*)',
    '/api-health(.*)',
    '/status',
    '/features',
    '/pricing',
    '/how-it-works',
    '/integrations',
    '/updates',
]);

export default clerkMiddleware(async (auth, request) => {
    const path = request.nextUrl.pathname;
    
    // Skip auth for static files (including video files)
    const isStaticFile = /\.(ico|png|jpg|jpeg|svg|gif|webp|mp4|webm|ogg|mp3|wav|pdf)$/i.test(path);
    
    if (isStaticFile || isPublicRoute(request)) {
        return;
    }
    
    await auth.protect();
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
