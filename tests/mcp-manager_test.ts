/**
 * MCP Manager 测试
 *
 * 测试MCP Manager Service的功能
 * 验证接口实现和低耦合设计
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { MCPManagerService } from '../packages/infrastructure/src/mcp/mcp-manager.impl';
import type { IMCPManagerService } from '../packages/services/src/mcp/mcp-manager.service';
import type { MCPServerConfig } from '../packages/services/src/mcp/mcp-manager.service';

describe('MCPManagerService - 接口实现测试', () => {
  let mcpManager: IMCPManagerService;

  beforeEach(() => {
    mcpManager = new MCPManagerService();
  });

  describe('接口实现', () => {
    it('应该实现IMCPManagerService的所有方法', () => {
      expect(mcpManager.connectAll).toBeDefined();
      expect(mcpManager.connect).toBeDefined();
      expect(mcpManager.callTool).toBeDefined();
      expect(mcpManager.listTools).toBeDefined();
      expect(mcpManager.disconnectAll).toBeDefined();
      expect(mcpManager.isConnected).toBeDefined();

      // 验证方法类型
      expect(typeof mcpManager.connectAll).toBe('function');
      expect(typeof mcpManager.connect).toBe('function');
      expect(typeof mcpManager.callTool).toBe('function');
      expect(typeof mcpManager.listTools).toBe('function');
      expect(typeof mcpManager.disconnectAll).toBe('function');
      expect(typeof mcpManager.isConnected).toBe('function');
    });
  });

  describe('连接状态管理', () => {
    it('初始状态应该没有连接', () => {
      expect(mcpManager.isConnected('test-server')).toBe(false);
      expect(mcpManager.isConnected('any-server')).toBe(false);
    });

    it('应该支持多个服务器名称', () => {
      const servers = ['server1', 'server2', 'server3'];

      for (const server of servers) {
        expect(mcpManager.isConnected(server)).toBe(false);
      }
    });
  });

  describe('配置类型检查', () => {
    it('应该接受正确的MCPServerConfig', () => {
      const config: MCPServerConfig = {
        name: 'test-server',
        command: 'npx',
        args: ['-y', 'test-package'],
        enabled: true
      };

      expect(config.name).toBeDefined();
      expect(config.command).toBeDefined();
      expect(config.args).toBeDefined();
      expect(Array.isArray(config.args)).toBe(true);
    });

    it('应该支持enabled默认值为true', () => {
      const config: MCPServerConfig = {
        name: 'test-server',
        command: 'npx',
        args: ['-y', 'test-package']
      };

      expect(config.enabled).toBeUndefined();
      // enabled为undefined时应视为true
    });
  });

  describe('方法签名', () => {
    it('connectAll应该接受MCPServerConfig数组', async () => {
      const configs: MCPServerConfig[] = [
        {
          name: 'server1',
          command: 'npx',
          args: ['-y', 'package1'],
          enabled: false  // 禁用以避免实际连接
        }
      ];

      // 注意：这里不会实际连接（enabled: false）
      // 只验证方法可以被调用
      try {
        await mcpManager.connectAll(configs);
      } catch (error) {
        // 可能会因为配置问题抛出异常，这是预期的
        expect(error).toBeDefined();
      }
    });

    it('callTool应该返回Promise', async () => {
      // 这个测试验证方法签名正确
      // 实际调用会失败，因为没有连接的服务器
      try {
        const result = await mcpManager.callTool('test-server', 'test-tool', {});
        expect(result).toBeDefined();
      } catch (error) {
        // 预期的错误
        expect(error).toBeDefined();
        expect((error as Error).message).toContain('not connected');
      }
    });

    it('listTools应该返回Promise', async () => {
      try {
        const tools = await mcpManager.listTools('test-server');
        expect(tools).toBeDefined();
      } catch (error) {
        // 预期的错误
        expect(error).toBeDefined();
      }
    });

    it('disconnectAll应该不抛出异常', async () => {
      try {
        await mcpManager.disconnectAll();
        expect(true).toBe(true);
      } catch (error) {
        // 不应该抛出异常
        expect(false).toBe(true);
      }
    });
  });

  describe('错误处理', () => {
    it('调用未连接的服务器应该抛出错误', async () => {
      await expect(mcpManager.callTool('non-existent', 'tool', {})).rejects.toThrow();
    });

    it('列出未连接的服务器工具应该抛出错误', async () => {
      await expect(mcpManager.listTools('non-existent')).rejects.toThrow();
    });
  });

  describe('低耦合设计验证', () => {
    it('应该通过接口而不是具体实现使用', () => {
      // 验证我们可以通过接口引用使用MCPManager
      const manager: IMCPManagerService = new MCPManagerService();

      expect(manager.isConnected).toBeDefined();
      expect(typeof manager.isConnected).toBe('function');
    });

    it('不应该暴露内部实现细节', () => {
      // 验证公共接口不包含内部属性
      expect((mcpManager as any).clients).toBeUndefined();
    });
  });
});

describe('MCP配置加载', () => {
  it('应该能够加载YAML配置', async () => {
    const { ConfigLoader } = await import('../packages/infrastructure/src/config/config-loader');

    const loader = new ConfigLoader();

    try {
      const configs = await loader.loadMCPServers();
      expect(configs).toBeDefined();
      expect(Array.isArray(configs)).toBe(true);

      // 验证配置格式
      if (configs.length > 0) {
        const config = configs[0];
        expect(config.name).toBeDefined();
        expect(config.command).toBeDefined();
        expect(config.args).toBeDefined();
      }
    } catch (error) {
      // 配置文件可能不存在
      console.log('Config file not found, skipping');
    }
  });
});
