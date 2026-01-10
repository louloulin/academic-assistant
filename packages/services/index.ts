/**
 * Services Package
 * 服务层导出
 */

// MCP Manager Service Interface
export type {
  IMCPManagerService,
  MCPServerConfig,
  MCPToolResult
} from './src/mcp/mcp-manager.service';

// Orchestrator Service
export {
  OrchestratorService
} from './src/orchestrator/orchestrator.service';
export type {
  Paper,
  LiteratureReviewResult
} from './src/orchestrator/orchestrator.service';
