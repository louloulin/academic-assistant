// 真实 Skills 统一导出 - 基于 Claude Agent SDK + MCP
// 这是生产就绪的实现，删除了所有模拟代码

export { LiteratureSearchSkill, literatureSearchSkill, SearchInput, Paper } from '../literature-search/real-skill-v2';
export { RealMCPClient, realMCPClient, connectAcademicServers, ACADEMIC_MCP_SERVERS } from '../../../mcp-client/src/real-mcp-client';

// 重新导出类型定义
export * from '../../core/src';
