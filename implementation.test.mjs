// Simple test to verify our implementation
import { describe, it, expect } from 'bun:test';

describe('Academic Assistant - Basic Tests', () => {
  it('should have required packages', () => {
    const fs = require('fs');
    const path = require('path');
    
    // Check if package files exist
    expect(fs.existsSync('packages/core/package.json')).toBe(true);
    expect(fs.existsSync('packages/utils/package.json')).toBe(true);
    expect(fs.existsSync('packages/skills/package.json')).toBe(true);
    expect(fs.existsSync('packages/agents/package.json')).toBe(true);
  });
  
  it('should have Agent Skills', () => {
    const fs = require('fs');
    
    expect(fs.existsSync('.claude/skills/literature-search/SKILL.md')).toBe(true);
    expect(fs.existsSync('.claude/skills/citation-manager/SKILL.md')).toBe(true);
    expect(fs.existsSync('.claude/skills/workflow-manager/SKILL.md')).toBe(true);
  });
  
  it('should have TypeScript files', () => {
    const fs = require('fs');
    const glob = require('fast-glob');
    
    const tsFiles = glob.sync('packages/*/src/**/*.ts');
    expect(tsFiles.length).toBeGreaterThan(0);
  });
});

describe('Core Package - Type Tests', () => {
  it('should export AgentType enum', async () => {
    const { AgentType } = await import('./packages/core/src/types/agent.js');
    
    expect(AgentType.WORKFLOW_MANAGER).toBe('workflow-manager');
    expect(AgentType.RESEARCHER).toBe('researcher');
  });
  
  it('should export SkillType enum', async () => {
    const { SkillType } = await import('./packages/core/src/types/skill.js');
    
    expect(SkillType.LITERATURE_SEARCH).toBe('literature-search');
    expect(SkillType.CITATION_MANAGER).toBe('citation-manager');
  });
  
  it('should export TaskStatus enum', async () => {
    const { TaskStatus } = await import('./packages/core/src/types/task.js');
    
    expect(TaskStatus.PENDING).toBe('pending');
    expect(TaskStatus.COMPLETED).toBe('completed');
  });
});

describe('Utils Package - Function Tests', () => {
  it('should export validateInput function', async () => {
    const { validateInput } = await import('./packages/utils/src/validation/index.js');
    const { z } = await import('zod');
    
    const schema = z.object({
      name: z.string()
    });
    
    const result = await validateInput(schema, { name: 'test' });
    expect(result).toEqual({ name: 'test' });
  });
  
  it('should export MemoryCache class', async () => {
    const { MemoryCache } = await import('./packages/utils/src/cache/index.js');
    
    const cache = new MemoryCache();
    await cache.set('test', 'value');
    const value = await cache.get('test');
    
    expect(value).toBe('value');
  });
});
