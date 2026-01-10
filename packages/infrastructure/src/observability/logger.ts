/**
 * 结构化日志系统
 * 基于pino实现高性能日志记录
 */

import pino from 'pino';

/**
 * 全局logger实例
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
      singleLine: false
    }
  },
  formatters: {
    level: (label) => {
      return { level: label };
    }
  }
});

/**
 * Logger类
 * 提供上下文感知的日志记录
 */
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  /**
   * 记录信息级别日志
   */
  info(message: string, meta?: Record<string, any>): void {
    logger.info({
      context: this.context,
      ...meta
    }, message);
  }

  /**
   * 记录错误级别日志
   */
  error(message: string, error?: Error | unknown, meta?: Record<string, any>): void {
    const errorObj = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : { error };

    logger.error({
      context: this.context,
      ...errorObj,
      ...meta
    }, message);
  }

  /**
   * 记录警告级别日志
   */
  warn(message: string, meta?: Record<string, any>): void {
    logger.warn({
      context: this.context,
      ...meta
    }, message);
  }

  /**
   * 记录调试级别日志
   */
  debug(message: string, meta?: Record<string, any>): void {
    logger.debug({
      context: this.context,
      ...meta
    }, message);
  }

  /**
   * 记录跟踪级别日志
   */
  trace(message: string, meta?: Record<string, any>): void {
    logger.trace({
      context: this.context,
      ...meta
    }, message);
  }
}

/**
 * 创建子Logger
 * @param parentContext 父上下文
 * @param childContext 子上下文
 * @returns 新的Logger实例
 */
export function createChildLogger(parentContext: string, childContext: string): Logger {
  return new Logger(`${parentContext}:${childContext}`);
}
