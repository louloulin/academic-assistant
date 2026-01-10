// Logger utility using Pino
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname'
          }
        }
      : undefined
});

export default logger;

export const log = {
  info: (msg: string, ...args: unknown[]) => logger.info(args, msg),
  error: (msg: string, ...args: unknown[]) => logger.error(args, msg),
  warn: (msg: string, ...args: unknown[]) => logger.warn(args, msg),
  debug: (msg: string, ...args: unknown[]) => logger.debug(args, msg)
};
