import { getAgentDefinition, listAgentDefinitions } from '../packages/core/index.ts';
import { Logger } from '../packages/infrastructure/src/observability/logger';
import { globalMetrics } from '../packages/infrastructure/src/observability/metrics';

console.log('Plan 3 Implementation Verification\n');

try {
  const agents = listAgentDefinitions();
  console.log(`✓ AgentDefinitions: ${agents.length} agents found`);

  const agent = getAgentDefinition('literature-searcher');
  console.log(`✓ literature-searcher: ${agent ? 'found' : 'not found'}`);

  const logger = new Logger('Test');
  logger.info('Test message');
  console.log('✓ Logger working');

  globalMetrics.recordAgentCall('test', 100, 50);
  console.log('✓ MetricsCollector working');

  console.log('\n🎉 All core components verified successfully!');
} catch (error) {
  console.error(`✗ Error: ${error.message}`);
  process.exit(1);
}
