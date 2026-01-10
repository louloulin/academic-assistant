/**
 * Configuration Loader
 *
 * 配置加载器
 * 支持YAML配置文件
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from '../observability/logger';

/**
 * MCP服务器配置
 */
export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  enabled?: boolean;
}

/**
 * Agent配置
 */
export interface AgentConfig {
  name: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * 应用配置
 */
export interface AppConfig {
  mcp: {
    servers: MCPServerConfig[];
  };
  agents: Record<string, AgentConfig>;
  skills: {
    enabled: string[];
  };
  observability: {
    logLevel: string;
    enableMetrics: boolean;
  };
}

/**
 * 配置加载器类
 */
export class ConfigLoader {
  private logger = new Logger('ConfigLoader');
  private cache: Map<string, any> = new Map();

  /**
   * 加载YAML配置文件
   * @param configPath 配置文件路径
   * @returns 解析后的配置对象
   */
  async load<T = any>(configPath: string): Promise<T> {
    // 检查缓存
    if (this.cache.has(configPath)) {
      return this.cache.get(configPath) as T;
    }

    try {
      const absolutePath = path.resolve(configPath);
      const content = await fs.readFile(absolutePath, 'utf-8');

      // 简单的YAML解析（生产环境应使用yaml库）
      const config = this.parseYAML(content) as T;

      // 缓存配置
      this.cache.set(configPath, config);

      this.logger.debug(`Loaded config from ${configPath}`);
      return config;
    } catch (error) {
      this.logger.error(`Failed to load config from ${configPath}`, error);
      throw error;
    }
  }

  /**
   * 加载主配置文件
   * @param configPath 配置文件路径
   * @returns 应用配置
   */
  async loadAppConfig(configPath: string = './config/default.yaml'): Promise<AppConfig> {
    return this.load<AppConfig>(configPath);
  }

  /**
   * 加载MCP服务器配置
   * @param configPath 配置文件路径
   * @returns MCP服务器配置数组
   */
  async loadMCPServers(configPath: string = './config/mcp-servers.yaml'): Promise<MCPServerConfig[]> {
    try {
      const config = await this.load<{ servers: MCPServerConfig[] }>(configPath);
      return config.servers || [];
    } catch (error) {
      this.logger.warn(`Failed to load MCP servers config, using empty array`, { error });
      return [];
    }
  }

  /**
   * 简单的YAML解析器
   * 注意：生产环境应该使用yaml库
   * @param content YAML内容
   * @returns 解析后的对象
   */
  private parseYAML(content: string): any {
    const lines = content.split('\n');
    const result: any = {};
    const stack: Array<{ obj: any; indent: number }> = [{ obj: result, indent: -1 }];

    for (const line of lines) {
      const trimmed = line.trim();

      // 跳过注释和空行
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const indent = line.search(/\S|$/);
      const currentLevel = stack.findIndex(level => level.indent < indent);

      if (currentLevel === -1) {
        continue;
      }

      // 保留当前层级及以上的层级
      stack.length = currentLevel + 1;
      const parent = stack[currentLevel];

      // 解析键值对
      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim();

      if (value === '' || value.startsWith('|')) {
        // 这是一个对象或列表
        parent.obj[key] = {};
        stack.push({ obj: parent.obj[key], indent });
      } else if (value.startsWith('-')) {
        // 这是一个列表项
        if (!Array.isArray(parent.obj[key])) {
          parent.obj[key] = [];
        }
        const itemValue = value.substring(1).trim();
        parent.obj[key].push(this.parseValue(itemValue));
      } else {
        // 这是一个简单值
        parent.obj[key] = this.parseValue(value);
      }
    }

    return result;
  }

  /**
   * 解析YAML值
   * @param value 值字符串
   * @returns 解析后的值
   */
  private parseValue(value: string): any {
    // 移除引号
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }

    // 布尔值
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null' || value === '~') return null;

    // 数字
    const num = Number(value);
    if (!isNaN(num)) {
      return num;
    }

    // 列表
    if (value.startsWith('[') && value.endsWith(']')) {
      const items = value.slice(1, -1).split(',');
      return items.map(item => this.parseValue(item.trim()));
    }

    // 默认返回字符串
    return value;
  }

  /**
   * 清除缓存
   * @param configPath 配置文件路径（可选，不提供则清除所有）
   */
  clearCache(configPath?: string): void {
    if (configPath) {
      this.cache.delete(configPath);
    } else {
      this.cache.clear();
    }
  }

  /**
   * 重新加载配置
   * @param configPath 配置文件路径
   * @returns 解析后的配置对象
   */
  async reload<T = any>(configPath: string): Promise<T> {
    this.clearCache(configPath);
    return this.load<T>(configPath);
  }
}

/**
 * 全局配置加载器实例
 */
export const globalConfigLoader = new ConfigLoader();
