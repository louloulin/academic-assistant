/**
 * MCP Manager Implementation
 *
 * MCP管理器的具体实现
 * 依赖MCP TypeScript SDK
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type {
  IMCPManagerService,
  MCPServerConfig,
  MCPToolResult
} from '../../../services/src/mcp/mcp-manager.service';
import { Logger } from '../observability/logger';
import { globalMetrics } from '../observability/metrics';

/**
 * MCP管理器实现类
 * 具体实现类，依赖MCP SDK
 */
export class MCPManagerService implements IMCPManagerService {
  private clients: Map<string, Client> = new Map();
  private logger = new Logger('MCPManager');

  async connectAll(configs: MCPServerConfig[]): Promise<void> {
    const enabledConfigs = configs.filter(c => c.enabled !== false);

    this.logger.info(`Connecting to ${enabledConfigs.length} MCP servers`);

    // 并行连接所有服务器
    const results = await Promise.allSettled(
      enabledConfigs.map(config => this.connect(config))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    this.logger.info(`MCP connection complete: ${successful} successful, ${failed} failed`);

    if (failed > 0) {
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          this.logger.warn(`Failed to connect to ${enabledConfigs[index].name}`, {
            error: result.reason
          });
        }
      });
    }
  }

  async connect(config: MCPServerConfig): Promise<void> {
    if (this.clients.has(config.name)) {
      this.logger.debug(`Already connected to ${config.name}`);
      return;
    }

    this.logger.info(`Connecting to MCP server: ${config.name}`);
    const startTime = Date.now();

    try {
      const transport = new StdioClientTransport({
        command: config.command,
        args: config.args
      });

      const client = new Client(
        {
          name: `academic-assistant-${config.name}`,
          version: '1.0.0'
        },
        { capabilities: {} }
      );

      await client.connect(transport);
      this.clients.set(config.name, client);

      const duration = Date.now() - startTime;
      globalMetrics.recordMCPCall(config.name, 'connect', duration, true);
      this.logger.info(`✓ Connected to ${config.name}`, { duration });
    } catch (error) {
      const duration = Date.now() - startTime;
      globalMetrics.recordMCPCall(config.name, 'connect', duration, false);
      this.logger.error(`Failed to connect to ${config.name}`, error);
      throw error;
    }
  }

  async callTool<T>(
    serverName: string,
    toolName: string,
    args: any = {}
  ): Promise<MCPToolResult<T>> {
    const client = this.clients.get(serverName);

    if (!client) {
      this.logger.warn(`Server not connected: ${serverName}`);
      return {
        success: false,
        error: `MCP server not connected: ${serverName}`
      };
    }

    this.logger.debug(`Calling ${serverName}.${toolName}`, { args });
    const startTime = Date.now();

    try {
      const response = await client.callTool({
        name: toolName,
        arguments: args
      });

      const duration = Date.now() - startTime;
      globalMetrics.recordMCPCall(serverName, toolName, duration, true);

      if (response.content && response.content.length > 0) {
        const result = response.content[0];

        if ('text' in result) {
          // 尝试解析JSON
          try {
            const data = JSON.parse(result.text) as T;
            this.logger.debug(`Tool call successful: ${serverName}.${toolName}`, { duration });
            return { success: true, data };
          } catch {
            // 如果不是JSON，返回原始文本
            return { success: true, data: result.text as T };
          }
        }
      }

      return { success: true, data: response as any };
    } catch (error) {
      const duration = Date.now() - startTime;
      globalMetrics.recordMCPCall(serverName, toolName, duration, false);
      this.logger.error(`Tool call failed: ${serverName}.${toolName}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async listTools(serverName: string): Promise<any[]> {
    const client = this.clients.get(serverName);

    if (!client) {
      this.logger.warn(`Server not connected: ${serverName}`);
      throw new Error(`MCP server not connected: ${serverName}`);
    }

    try {
      const response = await client.listTools();
      this.logger.debug(`Listed tools for ${serverName}`, { count: response.tools?.length || 0 });
      return response.tools || [];
    } catch (error) {
      this.logger.error(`Failed to list tools for ${serverName}`, error);
      throw error;
    }
  }

  async disconnectAll(): Promise<void> {
    this.logger.info('Disconnecting all MCP servers');

    const disconnectPromises = Array.from(this.clients.entries()).map(
      async ([name, client]) => {
        try {
          await client.close();
          this.logger.debug(`Disconnected from ${name}`);
        } catch (error) {
          this.logger.error(`Failed to disconnect from ${name}`, error);
        }
      }
    );

    await Promise.all(disconnectPromises);
    this.clients.clear();

    this.logger.info('All MCP servers disconnected');
  }

  async disconnect(serverName: string): Promise<void> {
    const client = this.clients.get(serverName);

    if (!client) {
      this.logger.warn(`Server not connected: ${serverName}`);
      return;
    }

    try {
      await client.close();
      this.clients.delete(serverName);
      this.logger.debug(`Disconnected from ${serverName}`);
    } catch (error) {
      this.logger.error(`Failed to disconnect from ${serverName}`, error);
      throw error;
    }
  }

  isConnected(serverName: string): boolean {
    return this.clients.has(serverName);
  }

  getConnectedServers(): string[] {
    return Array.from(this.clients.keys());
  }
}

/**
 * 全局MCP管理器实例
 */
let globalMCPManager: MCPManagerService | null = null;

/**
 * 获取全局MCP管理器实例
 * @returns MCP管理器实例
 */
export function getMCPManager(): MCPManagerService {
  if (!globalMCPManager) {
    globalMCPManager = new MCPManagerService();
  }
  return globalMCPManager;
}

/**
 * 重置全局MCP管理器
 */
export function resetMCPManager(): void {
  if (globalMCPManager) {
    globalMCPManager.disconnectAll().catch(console.error);
  }
  globalMCPManager = null;
}
