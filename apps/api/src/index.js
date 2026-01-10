// API Entry Point
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { WorkflowManagerAgent } from '@assistant/agents';
import { LiteratureSearchSkill } from '@assistant/skills';
import { MCPClient } from '@assistant/mcp-client';
import { log } from '@assistant/utils';
const app = new Hono();
// Middleware
app.use('*', cors());
app.use('*', logger());
// Initialize services
async function initializeServices() {
    log.info('Initializing API services...');
    // Create MCP client
    const mcpClient = new MCPClient();
    // await mcpClient.connect('literature-search'); // Uncomment when server is ready
    // Create skills
    const skills = new Map([
        ['literature-search', new LiteratureSearchSkill(mcpClient)]
    ]);
    // Create workflow manager
    const workflowConfig = {
        id: 'workflow-manager-1',
        type: 'workflow-manager',
        name: 'Workflow Manager',
        description: 'Orchestrates research workflows',
        capabilities: ['task-planning', 'coordination'],
        maxConcurrency: 3
    };
    const workflowManager = new WorkflowManagerAgent(workflowConfig.id, workflowConfig.name, workflowConfig, { skills, mcpClient });
    await workflowManager.initialize();
    log.info('API services initialized');
    return { mcpClient, skills, workflowManager };
}
// Routes
app.get('/health', (c) => {
    return c.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '0.1.0'
    });
});
app.post('/api/search', async (c) => {
    try {
        const { query, maxResults = 10 } = await c.req.json();
        const { skills } = await initializeServices();
        const skill = skills.get('literature-search');
        if (!skill) {
            return c.json({ error: 'Skill not found' }, 404);
        }
        const task = {
            id: crypto.randomUUID(),
            title: `Search: ${query}`,
            input: { query, maxResults },
            status: 'pending',
            priority: 2,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const result = await skill.execute(task);
        return c.json(result);
    }
    catch (error) {
        log.error(`Search error: ${error}`);
        return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
});
app.post('/api/workflow', async (c) => {
    try {
        const { goal } = await c.req.json();
        const { workflowManager } = await initializeServices();
        const task = {
            id: crypto.randomUUID(),
            title: goal,
            input: { goal },
            status: 'pending',
            priority: 2,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const result = await workflowManager.execute(task);
        return c.json(result);
    }
    catch (error) {
        log.error(`Workflow error: ${error}`);
        return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
});
const port = parseInt(process.env.PORT || '3001');
log.info(`Starting API server on port ${port}`);
export default {
    port,
    fetch: app.fetch
};
//# sourceMappingURL=index.js.map