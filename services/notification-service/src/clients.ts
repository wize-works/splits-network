import { Logger } from '@splits-network/shared-logging';

/**
 * Simple HTTP client for inter-service communication
 */
export class ServiceClient {
    constructor(
        private baseUrl: string,
        private serviceName: string,
        private logger: Logger
    ) {}

    async get<T>(path: string): Promise<T> {
        const url = `${this.baseUrl}${path}`;
        this.logger.debug({ url, service: this.serviceName }, 'Fetching from service');

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(
                    `${this.serviceName} request failed: ${response.status} ${response.statusText} - ${text}`
                );
            }

            return await response.json() as T;
        } catch (error) {
            this.logger.error(
                { error, url, service: this.serviceName },
                'Failed to fetch from service'
            );
            throw error;
        }
    }
}

/**
 * Service registry for notification service
 */
export class ServiceRegistry {
    private identityService: ServiceClient;
    private atsService: ServiceClient;
    private networkService: ServiceClient;

    constructor(
        identityUrl: string,
        atsUrl: string,
        networkUrl: string,
        logger: Logger
    ) {
        this.identityService = new ServiceClient(identityUrl, 'identity-service', logger);
        this.atsService = new ServiceClient(atsUrl, 'ats-service', logger);
        this.networkService = new ServiceClient(networkUrl, 'network-service', logger);
    }

    getIdentityService() {
        return this.identityService;
    }

    getAtsService() {
        return this.atsService;
    }

    getNetworkService() {
        return this.networkService;
    }
}
