import { Logger } from '@splits-network/shared-logging';

export class ServiceClient {
    constructor(
        private serviceName: string,
        private baseUrl: string,
        private logger: Logger
    ) {}

    private async request<T>(method: string, path: string, data?: any, params?: Record<string, any>): Promise<T> {
        const url = new URL(path, this.baseUrl);
        
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.append(key, String(value));
            });
        }

        this.logger.debug(
            { service: this.serviceName, method, url: url.toString() },
            'Calling service'
        );

        const options: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url.toString(), options);

            this.logger.debug(
                { service: this.serviceName, status: response.status },
                'Service response received'
            );

            if (!response.ok) {
                throw new Error(`Service call failed with status ${response.status}`);
            }

            return await response.json() as T;
        } catch (error: any) {
            this.logger.error(
                {
                    service: this.serviceName,
                    error: error.message,
                },
                'Service call failed'
            );
            throw error;
        }
    }

    async get<T>(path: string, params?: Record<string, any>): Promise<T> {
        return this.request<T>('GET', path, undefined, params);
    }

    async post<T>(path: string, data?: any): Promise<T> {
        return this.request<T>('POST', path, data);
    }

    async patch<T>(path: string, data?: any): Promise<T> {
        return this.request<T>('PATCH', path, data);
    }

    async delete<T>(path: string): Promise<T> {
        return this.request<T>('DELETE', path);
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
