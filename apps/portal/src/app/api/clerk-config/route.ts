import { NextResponse } from 'next/server';
import { loadClerkConfig } from '@splits-network/shared-config';

export async function GET() {
    try {
        const config = loadClerkConfig();
        
        // Only return the publishable key (public)
        return NextResponse.json({
            publishableKey: config.publishableKey,
        });
    } catch (error) {
        console.error('Failed to fetch Clerk config:', error);
        return NextResponse.json(
            { error: 'Failed to fetch authentication configuration' },
            { status: 500 }
        );
    }
}
