import pino, { Logger } from 'pino';

export interface LoggerOptions {
    serviceName: string;
    level?: string;
    prettyPrint?: boolean;
}

/**
 * Create a logger instance for a service
 */
export function createLogger(options: LoggerOptions | string): Logger {
    // Support both string and object parameter for backward compatibility
    const config = typeof options === 'string' 
        ? { serviceName: options } 
        : options;
    const { serviceName, level = 'info', prettyPrint = false } = config;

    const pinoOptions: pino.LoggerOptions = {
        name: serviceName,
        level,
        ...(prettyPrint && {
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'HH:MM:ss Z',
                    ignore: 'pid,hostname',
                },
            },
        }),
    };

    return pino(pinoOptions);
}

/**
 * Create child logger with additional context
 */
export function createChildLogger(
    parentLogger: Logger,
    context: Record<string, any>
): Logger {
    return parentLogger.child(context);
}

export type { Logger };
