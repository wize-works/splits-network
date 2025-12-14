'use client';

import { useEffect, useState } from 'react';

interface ServiceHealth {
    name: string;
    url: string;
    status: 'healthy' | 'unhealthy' | 'checking';
    timestamp?: string;
    error?: string;
    responseTime?: number;
}

const services: Omit<ServiceHealth, 'status' | 'timestamp' | 'error' | 'responseTime'>[] = [
    { name: 'API Gateway', url: '/api-health/gateway' },
    { name: 'Identity Service', url: '/api-health/identity' },
    { name: 'ATS Service', url: '/api-health/ats' },
    { name: 'Network Service', url: '/api-health/network' },
    { name: 'Billing Service', url: '/api-health/billing' },
    { name: 'Notification Service', url: '/api-health/notification' },
    { name: 'Document Service', url: '/api-health/document' },
];

export default function StatusPage() {
    const [serviceStatuses, setServiceStatuses] = useState<ServiceHealth[]>(
        services.map(s => ({ ...s, status: 'checking' as const }))
    );
    const [lastChecked, setLastChecked] = useState<Date>(new Date());

    const checkServiceHealth = async (service: typeof services[0]): Promise<ServiceHealth> => {
        const startTime = Date.now();
        try {
            const response = await fetch(service.url, {
                cache: 'no-store',
                signal: AbortSignal.timeout(5000), // 5 second timeout
            });
            const responseTime = Date.now() - startTime;
            const data = await response.json();

            if (response.ok && data.status === 'healthy') {
                return {
                    ...service,
                    status: 'healthy',
                    timestamp: data.timestamp,
                    responseTime,
                };
            } else {
                return {
                    ...service,
                    status: 'unhealthy',
                    error: data.error || 'Service returned unhealthy status',
                    timestamp: data.timestamp,
                    responseTime,
                };
            }
        } catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                ...service,
                status: 'unhealthy',
                error: error instanceof Error ? error.message : 'Failed to connect to service',
                responseTime,
            };
        }
    };

    const checkAllServices = async () => {
        const results = await Promise.all(services.map(checkServiceHealth));
        setServiceStatuses(results);
        setLastChecked(new Date());
    };

    useEffect(() => {
        checkAllServices();
        // Auto-refresh every 30 seconds
        const interval = setInterval(checkAllServices, 30000);
        return () => clearInterval(interval);
    }, []);

    const healthyCount = serviceStatuses.filter(s => s.status === 'healthy').length;
    const totalCount = serviceStatuses.length;
    const allHealthy = healthyCount === totalCount;
    const someUnhealthy = serviceStatuses.some(s => s.status === 'unhealthy');

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-2">System Status</h1>
                <p className="text-base-content/70">Real-time status of all Splits Network services</p>
            </div>

            {/* Overall Status Card */}
            <div className={`card shadow-lg mb-6 ${
                allHealthy ? 'bg-success text-success-content' :
                someUnhealthy ? 'bg-error text-error-content' :
                'bg-warning text-warning-content'
            }`}>
                <div className="card-body">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="card-title text-2xl">
                                {allHealthy ? (
                                    <><i className="fa-solid fa-circle-check"></i> All Systems Operational</>
                                ) : someUnhealthy ? (
                                    <><i className="fa-solid fa-circle-exclamation"></i> Service Degradation</>
                                ) : (
                                    <><i className="fa-solid fa-spinner fa-spin"></i> Checking Services...</>
                                )}
                            </h2>
                            <p className="text-sm opacity-90 mt-1">
                                {healthyCount} of {totalCount} services healthy
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs opacity-75">
                                Last checked: {lastChecked.toLocaleTimeString()}
                            </p>
                            <p className="text-xs opacity-60 mt-1">
                                Auto-refreshes every 30 seconds
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Service Status List */}
            <div className="space-y-4">
                {serviceStatuses.map((service) => (
                    <div key={service.name} className="card bg-base-100 shadow">
                        <div className="card-body p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {/* Status Indicator */}
                                    <div className="flex-shrink-0">
                                        {service.status === 'healthy' && (
                                            <div className="w-3 h-3 rounded-full bg-success animate-pulse"></div>
                                        )}
                                        {service.status === 'unhealthy' && (
                                            <div className="w-3 h-3 rounded-full bg-error animate-pulse"></div>
                                        )}
                                        {service.status === 'checking' && (
                                            <div className="w-3 h-3 rounded-full bg-warning animate-pulse"></div>
                                        )}
                                    </div>

                                    {/* Service Info */}
                                    <div>
                                        <h3 className="font-semibold">{service.name}</h3>
                                        <div className="flex items-center gap-3 text-sm text-base-content/70">
                                            <span className={`badge badge-sm ${
                                                service.status === 'healthy' ? 'badge-success' :
                                                service.status === 'unhealthy' ? 'badge-error' :
                                                'badge-warning'
                                            }`}>
                                                {service.status === 'healthy' ? 'Operational' :
                                                 service.status === 'unhealthy' ? 'Down' :
                                                 'Checking...'}
                                            </span>
                                            {service.responseTime !== undefined && (
                                                <span>Response: {service.responseTime}ms</span>
                                            )}
                                            {service.timestamp && (
                                                <span>Last check: {new Date(service.timestamp).toLocaleTimeString()}</span>
                                            )}
                                        </div>
                                        {service.error && (
                                            <p className="text-xs text-error mt-1">
                                                <i className="fa-solid fa-triangle-exclamation"></i> {service.error}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Status Icon */}
                                <div className="flex-shrink-0 text-2xl">
                                    {service.status === 'healthy' && (
                                        <i className="fa-solid fa-circle-check text-success"></i>
                                    )}
                                    {service.status === 'unhealthy' && (
                                        <i className="fa-solid fa-circle-xmark text-error"></i>
                                    )}
                                    {service.status === 'checking' && (
                                        <i className="fa-solid fa-spinner fa-spin text-warning"></i>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Info */}
            <div className="text-center mt-8 text-sm text-base-content/60">
                <p>Status updates automatically every 30 seconds</p>
                <p className="mt-2">
                    Having issues? Contact support at{' '}
                    <a href="mailto:support@splits.network" className="link">
                        support@splits.network
                    </a>
                </p>
            </div>
        </div>
    );
}
