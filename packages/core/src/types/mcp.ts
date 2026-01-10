// MCP type definitions
export enum MCPTransportType {
  STDIO = 'stdio',
  SSE = 'sse',
  HTTP = 'http'
}

export interface MCPServerInfo {
  name: string;
  version: string;
  transport: MCPTransportType;
  endpoint?: string;
  capabilities: string[];
}

export interface MCPRequest {
  server: string;
  method: string;
  params?: unknown;
}

export interface MCPResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: unknown;
}
