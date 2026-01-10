/**
 * MCP Manager Service Interface
 *
 * MCP管理器的服务接口
 * 实现依赖倒置原则：高层服务依赖接口，不依赖具体实现
 */

export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  enabled?: boolean;
}

/**
 * MCP工具调用结果
 */
export interface MCPToolResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * MCP管理器服务接口
 * 抽象MCP客户端操作，实现依赖倒置
 */
export interface IMCPManagerService {
  /**
   * 连接到所有配置的MCP服务器
   * @param configs MCP服务器配置数组
   */
  connectAll(configs: MCPServerConfig[]): Promise<void>;

  /**
   * 连接到单个MCP服务器
   * @param config MCP服务器配置
   */
  connect(config: MCPServerConfig): Promise<void>;

  /**
   * 调用MCP工具
   * @param serverName 服务器名称
   * @param toolName 工具名称
   * @param args 工具参数
   * @returns 工具执行结果
   */
  callTool<T>(serverName: string, toolName: string, args?: any): Promise<MCPToolResult<T>>;

  /**
   * 列出服务器的可用工具
   * @param serverName 服务器名称
   * @returns 工具列表
   */
  listTools(serverName: string): Promise<any[]>;

  /**
   * 断开所有连接
   */
  disconnectAll(): Promise<void>;

  /**
   * 断开单个服务器连接
   * @param serverName 服务器名称
   */
  disconnect(serverName: string): Promise<void>;

  /**
   * 检查服务器是否已连接
   * @param serverName 服务器名称
   * @returns 是否已连接
   */
  isConnected(serverName: string): boolean;

  /**
   * 获取所有已连接的服务器名称
   * @returns 服务器名称数组
   */
  getConnectedServers(): string[];
}
