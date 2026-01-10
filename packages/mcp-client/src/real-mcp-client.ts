// 真实的 MCP 客户端实现 - 连接到实际的学术 MCP 服务器
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

/**
 * 真实的 MCP 客户端
 * 连接到实际的 MCP 服务器，如 Academia, ArXiv 等
 */
export class RealMCPClient {
  private clients: Map<string, Client> = new Map();

  /**
   * 连接到 MCP 服务器
   * @param serverName 服务器名称
   * @param command 启动命令
   * @param args 命令参数
   */
  async connect(serverName: string, command: string, args: string[] = []): Promise<void> {
    if (this.clients.has(serverName)) {
      console.log(`✓ 已连接到 ${serverName}`);
      return;
    }

    console.log(`🔌 连接到 MCP 服务器: ${serverName}`);

    try {
      const transport = new StdioClientTransport({
        command,
        args
      });

      const client = new Client({
        name: `academic-assistant-${serverName}`,
        version: '1.0.0'
      }, {
        capabilities: {}
      });

      await client.connect(transport);
      this.clients.set(serverName, client);

      console.log(`✓ 成功连接到 ${serverName}`);

    } catch (error) {
      console.error(`✗ 连接 ${serverName} 失败:`, error);
      throw error;
    }
  }

  /**
   * 调用 MCP 服务器的工具
   * @param serverName 服务器名称
   * @param toolName 工具名称
   * @param args 参数
   */
  async callTool<T>(serverName: string, toolName: string, args: any = {}): Promise<T> {
    const client = this.clients.get(serverName);

    if (!client) {
      throw new Error(`未连接到服务器: ${serverName}`);
    }

    console.log(`🔧 调用 ${serverName} 的工具: ${toolName}`);

    try {
      const response = await client.callTool({
        name: toolName,
        arguments: args
      });

      if (response.content && response.content.length > 0) {
        const result = response.content[0];
        if ('text' in result) {
          // 尝试解析 JSON
          try {
            return JSON.parse(result.text) as T;
          } catch {
            return result.text as T;
          }
        }
      }

      return response as any;

    } catch (error) {
      console.error(`✗ 工具调用失败:`, error);
      throw error;
    }
  }

  /**
   * 获取服务器的可用工具列表
   * @param serverName 服务器名称
   */
  async listTools(serverName: string): Promise<any[]> {
    const client = this.clients.get(serverName);

    if (!client) {
      throw new Error(`未连接到服务器: ${serverName}`);
    }

    try {
      const response = await client.listTools();
      return response.tools || [];

    } catch (error) {
      console.error(`✗ 获取工具列表失败:`, error);
      throw error;
    }
  }

  /**
   * 断开所有连接
   */
  async disconnectAll(): Promise<void> {
    console.log('🔌 断开所有 MCP 服务器连接');

    for (const [name, client] of this.clients) {
      try {
        await client.close();
        console.log(`✓ 已断开 ${name}`);
      } catch (error) {
        console.error(`✗ 断开 ${name} 失败:`, error);
      }
    }

    this.clients.clear();
  }

  /**
   * 检查服务器是否已连接
   * @param serverName 服务器名称
   */
  isConnected(serverName: string): boolean {
    return this.clients.has(serverName);
  }
}

/**
 * 单例实例
 */
export const realMCPClient = new RealMCPClient();

/**
 * 预配置的学术 MCP 服务器
 */
export const ACADEMIC_MCP_SERVERS = {
  // Academia MCP Server - ArXiv, ACL Anthology 搜索
  academia: {
    name: 'academia',
    command: 'npx',
    args: ['-y', '@ilyagus/academia_mcp']
  },

  // 可以添加更多服务器
  // arxiv: {
  //   name: 'arxiv',
  //   command: 'npx',
  //   args: ['-y', 'arxiv-mcp-server']
  // }
};

/**
 * 连接所有预配置的学术服务器
 */
export async function connectAcademicServers(client: RealMCPClient): Promise<void> {
  console.log('🎓 连接学术 MCP 服务器...');

  for (const server of Object.values(ACADEMIC_MCP_SERVERS)) {
    try {
      await client.connect(server.name, server.command, server.args);
    } catch (error) {
      console.warn(`⚠️  无法连接到 ${server.name}，将使用备用方案`);
      // 不抛出错误，继续连接其他服务器
    }
  }
}
