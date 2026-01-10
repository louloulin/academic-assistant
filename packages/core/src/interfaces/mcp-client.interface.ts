// MCP Client interface
import type { MCPRequest, MCPResponse, MCPServerInfo } from '../types/mcp.js';

export interface IMCPClient {
  connect(serverName: string): Promise<void>;
  disconnect(serverName: string): Promise<void>;
  call<T = unknown>(request: MCPRequest): Promise<MCPResponse<T>>;
  getServerInfo(serverName: string): Promise<MCPServerInfo>;
  listServers(): Promise<string[]>;
  isConnected(serverName: string): boolean;
}

export interface IMCPClientFactory {
  create(config: MCPClientConfig): IMCPClient;
}

export interface MCPClientConfig {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}
