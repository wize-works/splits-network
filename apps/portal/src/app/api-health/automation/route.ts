import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

export const revalidate = 15;

export async function GET(request: NextRequest) {
    const rateLimitResponse = rateLimit(request, {
        maxRequests: 10,
        windowMs: 60 * 1000,
    });
    
    if (rateLimitResponse) {
        return rateLimitResponse;
    }
    
    try {
        const serviceUrl = process.env.AUTOMATION_SERVICE_URL || 'http://localhost:3007';
        const response = await fetch(`${serviceUrl}/health`, {
            cache: 'no-store',
            signal: AbortSignal.timeout(5000),
        });
        const data = await response.json();
        
        return NextResponse.json(data, { 
            status: response.status,
            headers: {
                'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
            },
        });
    } catch (error) {
        return NextResponse.json(
            {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Failed to connect to automation service',
            },
            { 
                status: 503,
                headers: {
                    'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
                },
            }
        );
    }
}
