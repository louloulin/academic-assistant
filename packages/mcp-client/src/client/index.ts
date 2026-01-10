// MCP Client implementation
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type {
  IMCPClient,
  MCPRequest,
  MCPResponse,
  MCPServerInfo
} from '@assistant/core';
import { MCPTransportType } from '@assistant/core';
import { log } from '@assistant/utils';

export class MCPClient implements IMCPClient {
  private clients = new Map<string, Client>();
  private serverInfo = new Map<string, MCPServerInfo>();

  async connect(serverName: string): Promise<void> {
    if (this.clients.has(serverName)) {
      log.warn(`Already connected to server: ${serverName}`);
      return;
    }

    const client = new Client(
      {
        name: 'academic-assistant',
        version: '1.0.0'
      },
      {
        capabilities: {}
      }
    );

    // Create transport based on server configuration
    const transport = new StdioClientTransport({
      command: 'node',
      args: [`path-to-${serverName}-server`]
    });

    await client.connect(transport);
    this.clients.set(serverName, client);

    log.info(`Connected to MCP server: ${serverName}`);
  }

  async disconnect(serverName: string): Promise<void> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Not connected to server: ${serverName}`);
    }

    await client.close();
    this.clients.delete(serverName);
    this.serverInfo.delete(serverName);

    log.info(`Disconnected from MCP server: ${serverName}`);
  }

  async call<T = unknown>(request: MCPRequest): Promise<MCPResponse<T>> {
    const client = this.clients.get(request.server);
    if (!client) {
      throw new Error(`Not connected to server: ${request.server}`);
    }

    try {
      const result = await client.callTool({
        name: request.method,
        arguments: request.params as Record<string, unknown>
      });

      return {
        success: true,
        data: result as T
      };
    } catch (error) {
      log.error(`MCP call failed: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getServerInfo(serverName: string): Promise<MCPServerInfo> {
    const cached = this.serverInfo.get(serverName);
    if (cached) return cached;

    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Not connected to server: ${serverName}`);
    }

    // Use default server info - MCP SDK doesn't have getServerInfo method
    const info: MCPServerInfo = {
      name: serverName,
      version: '1.0.0',
      transport: MCPTransportType.STDIO,
      capabilities: []
    };

    this.serverInfo.set(serverName, info);

    return info;
  }

  async listServers(): Promise<string[]> {
    return Array.from(this.clients.keys());
  }

  isConnected(serverName: string): boolean {
    return this.clients.has(serverName);
  }
}
