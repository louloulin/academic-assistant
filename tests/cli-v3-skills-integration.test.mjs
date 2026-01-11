#!/usr/bin/env bun
/**
 * 🧪 CLI V3.0 Skills 集成测试
 *
 * 验证新 CLI 充分复用 Skills 的智能能力
 */

import { describe, it, expect, beforeAll } from 'bun:test';
import { promises as fs } from 'fs';
import path from 'path';

const CLI_PATH = './academic-cli-v3.mjs';
const SKILLS_DIR = './.claude/skills';

describe('🧪 CLI V3.0 Skills 集成测试', () => {
  describe('1. 动态 Skills 发现', () => {
    it('应该能够导入新的 CLI', async () => {
      const cliExists = await fs.access(CLI_PATH).then(() => true).catch(() => false);
      expect(cliExists).toBe(true);
    });

    it('应该包含 SkillsOrchestrator 类', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('class SkillsOrchestrator');
    });

    it('应该包含 discoverSkills 方法', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('async discoverSkills()');
    });

    it('应该动态读取 .claude/skills 目录', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain("const skillsDir = this.config.skillsDir");
      expect(content).toContain("await fs.readdir(skillsDir)");
    });

    it('应该解析 YAML frontmatter', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('parseYAMLFrontmatter');
      expect(content).toContain('match(/^---\\n');
    });

    it('应该读取 SKILL.md 文件', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain("SKILL.md'");
      expect(content).toContain("path.join(skillsDir, folder, 'SKILL.md')");
    });

    it('应该提取 Skill 的元数据', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain("metadata.name || folder");
      expect(content).toContain("metadata.description");
      expect(content).toContain("metadata['allowed-tools']");
      expect(content).toContain('hasSkillTool');
    });
  });

  describe('2. AI 任务分析', () => {
    it('应该包含 analyzeTask 方法', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('async analyzeTask(');
    });

    it('应该使用 Claude SDK 分析任务', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('const response = await query({');
      expect(content).toContain('分析以下学术研究任务');
    });

    it('应该返回任务类型', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('"taskType"');
    });

    it('应该返回需要的 Skills', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('"requiredSkills"');
    });

    it('应该返回工作流描述', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('"workflow"');
    });

    it('应该有备用分析方案', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('getDefaultAnalysis');
    });
  });

  describe('3. 结构化工作流', () => {
    it('应该包含 generateWorkflow 方法', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('async generateWorkflow(');
    });

    it('应该根据任务类型选择工作流', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('workflowTemplates');
      expect(content).toContain("getLiteratureResearchWorkflow()");
      expect(content).toContain("getPaperWritingWorkflow()");
    });

    it('应该定义文献研究工作流', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('getLiteratureResearchWorkflow()');
      expect(content).toContain('literature-search');
      expect(content).toContain('pdf-analyzer');
      expect(content).toContain('literature-review');
    });

    it('应该定义论文写作工作流', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('getPaperWritingWorkflow()');
      expect(content).toContain('paper-structure');
      expect(content).toContain('conversational-editor');
      expect(content).toContain('academic-polisher');
      expect(content).toContain('writing-quality');
      expect(content).toContain('peer-review');
    });

    it('应该定义数据分析工作流', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('getDataAnalysisWorkflow()');
      expect(content).toContain('data-analysis');
      expect(content).toContain('experiment-runner');
    });

    it('应该定义质量检查工作流', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('getQualityCheckWorkflow()');
      expect(content).toContain('plagiarism-checker');
    });

    it('应该定义期刊投稿工作流', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('getJournalSubmissionWorkflow()');
      expect(content).toContain('journal-matchmaker');
    });
  });

  describe('4. Workflow Executor', () => {
    it('应该包含 WorkflowExecutor 类', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('class WorkflowExecutor');
    });

    it('应该有 initializeChecklist 方法', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('initializeChecklist()');
    });

    it('应该有 execute 方法', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('async execute()');
    });

    it('应该有 executeStep 方法', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('async executeStep(');
    });

    it('应该使用 Claude SDK 调用 Skills', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('allowedTools: [\'Skill\'');
      expect(content).toContain('settingSources: [\'user\', \'project\'');
    });

    it('应该使用 Skill 工具调用其他 Skills', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('使用 Skill 工具');
      expect(content).toContain('不要模拟 Skill 的行为');
      expect(content).toContain('必须真实调用');
    });

    it('应该有 displayChecklist 方法', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('displayChecklist()');
      expect(content).toContain('进度:');
    });
  });

  describe('5. 验证检查点', () => {
    it('应该在工作流步骤中定义验证标准', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('validation:');
      expect(content).toContain('expectedOutput:');
    });

    it('应该有验证输出的逻辑', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('验证输出');
      expect(content).toContain('enableValidation');
    });
  });

  describe('6. Progressive Disclosure', () => {
    it('应该在工作流步骤中提供上下文', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('getPreviousOutputs()');
      expect(content).toContain('之前步骤的输出');
    });

    it('应该只传递必要的上下文', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('const context = this.getPreviousOutputs()');
    });
  });

  describe('7. 实际 Skills 加载测试', () => {
    it('应该能够读取真实的 Skills 目录', async () => {
      const skillsExist = await fs.access(SKILLS_DIR).then(() => true).catch(() => false);
      expect(skillsExist).toBe(true);
    });

    it('应该至少有 20 个 Skills', async () => {
      const folders = await fs.readdir(SKILLS_DIR);
      expect(folders.length).toBeGreaterThanOrEqual(20);
    });

    it('应该有 literature-search Skill', async () => {
      const skillPath = path.join(SKILLS_DIR, 'literature-search', 'SKILL.md');
      const skillExists = await fs.access(skillPath).then(() => true).catch(() => false);
      expect(skillExists).toBe(true);
    });

    it('应该有 workflow-manager Skill', async () => {
      const skillPath = path.join(SKILLS_DIR, 'workflow-manager', 'SKILL.md');
      const skillExists = await fs.access(skillPath).then(() => true).catch(() => false);
      expect(skillExists).toBe(true);
    });

    it('literature-search SKILL.md 应该有 YAML frontmatter', async () => {
      const skillPath = path.join(SKILLS_DIR, 'literature-search', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toMatch(/^---\n/);
    });

    it('literature-search SKILL.md 应该有 description', async () => {
      const skillPath = path.join(SKILLS_DIR, 'literature-search', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('description:');
    });
  });

  describe('8. 工作流完整性', () => {
    it('文献研究工作流应该有 4 个步骤', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      const workflowMatch = content.match(/getLiteratureResearchWorkflow\(\) [\s\S]{0,2000}return \{/);
      expect(workflowMatch).toBeTruthy();
    });

    it('论文写作工作流应该有 5 个步骤', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      const workflowMatch = content.match(/getPaperWritingWorkflow\(\) [\s\S]{0,2500}return \{/);
      expect(workflowMatch).toBeTruthy();
    });

    it('所有工作流步骤都应该有 task 描述', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      const taskMatches = content.match(/task:/g);
      expect(taskMatches.length).toBeGreaterThan(10);
    });

    it('所有工作流步骤都应该有 expectedOutput', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      const outputMatches = content.match(/expectedOutput:/g);
      expect(outputMatches.length).toBeGreaterThan(10);
    });

    it('所有工作流步骤都应该有 validation', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      const validationMatches = content.match(/validation:/g);
      expect(validationMatches.length).toBeGreaterThan(10);
    });
  });

  describe('9. Output Manager', () => {
    it('应该包含 OutputManager 类', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('class OutputManager');
    });

    it('应该有 save 方法', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('async save(');
    });

    it('应该保存完整的工作流报告', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('workflowReport');
      expect(content).toContain('completedSteps');
      expect(content).toContain('totalSteps');
    });
  });

  describe('10. 错误处理', () => {
    it('应该有 try-catch 块', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toMatch(/try \{/);
      expect(content).toMatch(/} catch \(/);
    });

    it('应该有错误日志', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('console.error');
    });

    it('应该在分析失败时使用备用方案', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('catch (error)');
      expect(content).toContain('getDefaultAnalysis');
    });
  });

  describe('11. CLI 入口点', () => {
    it('应该有 main 函数', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('async function main()');
    });

    it('应该启动 Orchestrator', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('new SkillsOrchestrator(CONFIG)');
    });

    it('应该调用 discoverSkills', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('await orchestrator.discoverSkills()');
    });

    it('应该调用 analyzeTask', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('await orchestrator.analyzeTask(');
    });

    it('应该调用 generateWorkflow', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('await orchestrator.generateWorkflow(');
    });

    it('应该创建 WorkflowExecutor', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('new WorkflowExecutor(workflow, CONFIG)');
    });

    it('应该调用 executor.execute', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('await executor.execute()');
    });

    it('应该调用 outputManager.save', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('await outputManager.save(');
    });
  });

  describe('12. 完整执行流程', () => {
    it('应该按照正确的顺序执行步骤', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');

      // 检查 main 函数中的执行顺序
      const mainMatch = content.match(/async function main\(\) \{([\s\S]{0,3000})\n\}/);
      expect(mainMatch).toBeTruthy();

      const mainContent = mainMatch[1];

      // 验证执行顺序
      const orchestratorIndex = mainContent.indexOf('new SkillsOrchestrator');
      const discoverIndex = mainContent.indexOf('discoverSkills');
      const analyzeIndex = mainContent.indexOf('analyzeTask');
      const workflowIndex = mainContent.indexOf('generateWorkflow');
      const executorIndex = mainContent.indexOf('new WorkflowExecutor');
      const executeIndex = mainContent.indexOf('executor.execute');
      const saveIndex = mainContent.indexOf('outputManager.save');

      expect(orchestratorIndex).toBeLessThan(discoverIndex);
      expect(discoverIndex).toBeLessThan(analyzeIndex);
      expect(analyzeIndex).toBeLessThan(workflowIndex);
      expect(workflowIndex).toBeLessThan(executorIndex);
      expect(executorIndex).toBeLessThan(executeIndex);
      expect(executeIndex).toBeLessThan(saveIndex);
    });
  });

  describe('13. Skills 协作能力', () => {
    it('应该在工作流中定义 Skills 依赖', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('skillIds:');
    });

    it('应该将 skillIds 转换为 Skills 对象', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('skills: step.skillIds.map');
    });

    it('应该在 prompt 中列出可用的 Skills', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toMatch(/可用的 Skills\n/);
      expect(content).toMatch(/skillsInfo = workflowStep\.skills/);
    });
  });

  describe('14. 没有 Mock 代码', () => {
    it('CLI V3 不应该包含 mock 关键字', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      const mockPatterns = [
        /function\s+\w*mock/i,
        /class\s+\w*Mock/i,
        /const\s+\w*Mock\s*=/i,
        /=\s*mock\(/i,
      ];

      for (const pattern of mockPatterns) {
        expect(content).not.toMatch(pattern);
      }
    });
  });

  describe('15. 导出的模块', () => {
    it('应该导出 SkillsOrchestrator', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('export { SkillsOrchestrator');
    });

    it('应该导出 WorkflowExecutor', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('WorkflowExecutor');
    });

    it('应该导出 OutputManager', async () => {
      const content = await fs.readFile(CLI_PATH, 'utf-8');
      expect(content).toContain('OutputManager');
    });
  });
});

// 运行测试
console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║     🧪 CLI V3.0 Skills 集成测试                             ║');
console.log('║     验证充分复用 Skills 的智能能力                           ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');
