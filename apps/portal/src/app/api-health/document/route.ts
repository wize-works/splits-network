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
        const serviceUrl = process.env.DOCUMENT_SERVICE_URL || 'http://localhost:3006';
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
                service: 'document-service',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            },
            { status: 503 }
        );
    }
}
