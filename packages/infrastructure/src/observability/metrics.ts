/**
 * 指标收集器
 * 用于追踪Agent调用、MCP调用、性能指标等
 */

export interface AgentMetrics {
  calls: number;
  totalDuration: number;
  avgDuration: number;
  totalTokens: number;
  lastCallTime?: Date;
}

export interface MCPMetrics {
  calls: number;
  totalDuration: number;
  avgDuration: number;
  errors: number;
  lastCallTime?: Date;
}

export interface SearchMetrics {
  keywordCalls: number;
  semanticCalls: number;
  hybridCalls: number;
  totalResults: number;
  avgDuration: number;
}

/**
 * 指标收集器类
 */
export class MetricsCollector {
  private agentMetrics: Map<string, AgentMetrics> = new Map();
  private mcpMetrics: Map<string, MCPMetrics> = new Map();
  private searchMetrics: SearchMetrics = {
    keywordCalls: 0,
    semanticCalls: 0,
    hybridCalls: 0,
    totalResults: 0,
    avgDuration: 0
  };
  private startTime: Date = new Date();

  /**
   * 记录Agent调用
   * @param agentName Agent名称
   * @param duration 执行时长(ms)
   * @param tokensUsed 使用的token数
   */
  recordAgentCall(agentName: string, duration: number, tokensUsed: number = 0): void {
    const current = this.agentMetrics.get(agentName) || {
      calls: 0,
      totalDuration: 0,
      avgDuration: 0,
      totalTokens: 0
    };

    current.calls++;
    current.totalDuration += duration;
    current.avgDuration = current.totalDuration / current.calls;
    current.totalTokens += tokensUsed;
    current.lastCallTime = new Date();

    this.agentMetrics.set(agentName, current);
  }

  /**
   * 记录MCP工具调用
   * @param serverName MCP服务器名称
   * @param toolName 工具名称
   * @param duration 执行时长(ms)
   * @param success 是否成功
   */
  recordMCPCall(serverName: string, toolName: string, duration: number, success: boolean = true): void {
    const key = `${serverName}.${toolName}`;
    const current = this.mcpMetrics.get(key) || {
      calls: 0,
      totalDuration: 0,
      avgDuration: 0,
      errors: 0
    };

    current.calls++;
    current.totalDuration += duration;
    current.avgDuration = current.totalDuration / current.calls;
    if (!success) {
      current.errors++;
    }
    current.lastCallTime = new Date();

    this.mcpMetrics.set(key, current);
  }

  /**
   * 记录搜索指标
   * @param type 搜索类型
   * @param resultCount 结果数量
   * @param duration 执行时长(ms)
   */
  recordSearch(type: 'keyword' | 'semantic' | 'hybrid', resultCount: number, duration: number): void {
    if (type === 'keyword') {
      this.searchMetrics.keywordCalls++;
    } else if (type === 'semantic') {
      this.searchMetrics.semanticCalls++;
    } else {
      this.searchMetrics.hybridCalls++;
    }

    this.searchMetrics.totalResults += resultCount;
    const totalCalls = this.searchMetrics.keywordCalls + this.searchMetrics.semanticCalls + this.searchMetrics.hybridCalls;
    this.searchMetrics.avgDuration = (this.searchMetrics.avgDuration * (totalCalls - 1) + duration) / totalCalls;
  }

  /**
   * 获取Agent指标
   * @param agentName Agent名称
   * @returns Agent指标或undefined
   */
  getAgentMetrics(agentName: string): AgentMetrics | undefined {
    return this.agentMetrics.get(agentName);
  }

  /**
   * 获取所有Agent指标
   * @returns Agent指标对象
   */
  getAllAgentMetrics(): Record<string, AgentMetrics> {
    return Object.fromEntries(this.agentMetrics);
  }

  /**
   * 获取MCP指标
   * @param serverName MCP服务器名称
   * @param toolName 工具名称
   * @returns MCP指标或undefined
   */
  getMCPMetrics(serverName: string, toolName: string): MCPMetrics | undefined {
    return this.mcpMetrics.get(`${serverName}.${toolName}`);
  }

  /**
   * 获取所有MCP指标
   * @returns MCP指标对象
   */
  getAllMCPMetrics(): Record<string, MCPMetrics> {
    return Object.fromEntries(this.mcpMetrics);
  }

  /**
   * 获取搜索指标
   * @returns 搜索指标
   */
  getSearchMetrics(): SearchMetrics {
    return { ...this.searchMetrics };
  }

  /**
   * 获取所有指标
   * @returns 所有指标的对象
   */
  getAllMetrics(): {
    agents: Record<string, AgentMetrics>;
    mcp: Record<string, MCPMetrics>;
    search: SearchMetrics;
    uptime: number;
  } {
    return {
      agents: this.getAllAgentMetrics(),
      mcp: this.getAllMCPMetrics(),
      search: this.getSearchMetrics(),
      uptime: Date.now() - this.startTime.getTime()
    };
  }

  /**
   * 重置所有指标
   */
  reset(): void {
    this.agentMetrics.clear();
    this.mcpMetrics.clear();
    this.searchMetrics = {
      keywordCalls: 0,
      semanticCalls: 0,
      hybridCalls: 0,
      totalResults: 0,
      avgDuration: 0
    };
    this.startTime = new Date();
  }

  /**
   * 打印指标摘要
   */
  printSummary(): void {
    const metrics = this.getAllMetrics();

    console.log('\n📊 Metrics Summary:');
    console.log('==================');
    console.log(`Uptime: ${Math.floor(metrics.uptime / 1000)}s`);

    console.log('\n🤖 Agent Metrics:');
    for (const [name, data] of Object.entries(metrics.agents)) {
      console.log(`  ${name}:`);
      console.log(`    Calls: ${data.calls}`);
      console.log(`    Avg Duration: ${data.avgDuration.toFixed(0)}ms`);
      console.log(`    Total Tokens: ${data.totalTokens}`);
    }

    console.log('\n🔌 MCP Metrics:');
    for (const [name, data] of Object.entries(metrics.mcp)) {
      console.log(`  ${name}:`);
      console.log(`    Calls: ${data.calls}`);
      console.log(`    Avg Duration: ${data.avgDuration.toFixed(0)}ms`);
      console.log(`    Errors: ${data.errors}`);
    }

    console.log('\n🔍 Search Metrics:');
    console.log(`  Keyword: ${metrics.search.keywordCalls}`);
    console.log(`  Semantic: ${metrics.search.semanticCalls}`);
    console.log(`  Hybrid: ${metrics.search.hybridCalls}`);
    console.log(`  Total Results: ${metrics.search.totalResults}`);
    console.log(`  Avg Duration: ${metrics.search.avgDuration.toFixed(0)}ms`);
    console.log();
  }
}

/**
 * 全局指标收集器实例
 */
export const globalMetrics = new MetricsCollector();
