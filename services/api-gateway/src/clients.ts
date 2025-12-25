import { Logger } from '@splits-network/shared-logging';

export class ServiceClient {
    constructor(
        private serviceName: string,
        private baseUrl: string,
        private logger: Logger
    ) {}

    private async request<T>(
        method: string,
        path: string,
        data?: any,
        params?: Record<string, any>,
        correlationId?: string,
        customHeaders?: Record<string, string>
    ): Promise<T> {
        const url = new URL(path, this.baseUrl);
        
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.append(key, String(value));
            });
        }

        this.logger.debug(
            { service: this.serviceName, method, url: url.toString(), correlationId },
            'Calling service'
        );

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...customHeaders,
        };

        // Propagate correlation ID to downstream services
        if (correlationId) {
            headers['x-correlation-id'] = correlationId;
        }

        const options: RequestInit = {
            method,
            headers,
        };

        if (data) {
            // If data is a Buffer (raw body), don't stringify
            options.body = Buffer.isBuffer(data) ? data : JSON.stringify(data);
        }

        try {
            const response = await fetch(url.toString(), options);

            this.logger.debug(
                { service: this.serviceName, status: response.status, correlationId },
                'Service response received'
            );

            if (!response.ok) {
                const errorBody = await response.text().catch(() => 'Unable to read error body');
                this.logger.error(
                    {
                        service: this.serviceName,
                        status: response.status,
                        correlationId,
                        error: errorBody,
                    },
                    'Service call failed'
                );
                throw new Error(`Service call failed with status ${response.status}: ${errorBody}`);
            }

            return await response.json() as T;
        } catch (error: any) {
            this.logger.error(
                {
                    service: this.serviceName,
                    error: error.message,
                    correlationId,
                },
                'Service call failed'
            );
            throw error;
        }
    }

    async get<T>(path: string, params?: Record<string, any>, correlationId?: string, customHeaders?: Record<string, string>): Promise<T> {
        return this.request<T>('GET', path, undefined, params, correlationId, customHeaders);
    }

    async post<T>(path: string, data?: any, correlationId?: string, customHeaders?: Record<string, string>): Promise<T> {
        return this.request<T>('POST', path, data, undefined, correlationId, customHeaders);
    }

    async patch<T>(path: string, data?: any, correlationId?: string, customHeaders?: Record<string, string>): Promise<T> {
        return this.request<T>('PATCH', path, data, undefined, correlationId, customHeaders);
    }

    async delete<T>(path: string, correlationId?: string): Promise<T> {
        return this.request<T>('DELETE', path, undefined, undefined, correlationId);
    }
}

export class ServiceRegistry {
    private clients: Map<string, ServiceClient> = new Map();

    constructor(private logger: Logger) { }

    register(serviceName: string, baseUrl: string): void {
        const client = new ServiceClient(serviceName, baseUrl, this.logger);
        this.clients.set(serviceName, client);
        this.logger.info({ service: serviceName, url: baseUrl }, 'Service registered');
    }

    get(serviceName: string): ServiceClient {
        const client = this.clients.get(serviceName);
        if (!client) {
            throw new Error(`Service ${serviceName} not registered`);
        }
        return client;
    }
}
