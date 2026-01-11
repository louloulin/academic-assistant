# CLI 问题分析与改进方案

## 当前 CLI 存在的问题

### 问题 1: ❌ 简单关键词匹配，未充分利用 Skills 的智能能力

**当前实现** (academic-cli.mjs):
```javascript
// 简单的关键词匹配
const keywords = {
  'literature-search': ['搜索', 'search', '论文', 'paper'],
  'citation-manager': ['引用', 'citation', '格式'],
  ...
};

// 线性匹配，无法处理复杂请求
for (const [skill, words] of Object.entries(keywords)) {
  for (const word of words) {
    if (request.includes(word)) {
      selectedSkills.push(skill);
    }
  }
}
```

**问题**:
- ❌ 无法理解复杂的多步骤请求
- ❌ 无法识别 Skills 之间的依赖关系
- ❌ 无法智能选择最优的 Skills 组合
- ❌ 无法根据任务复杂度调整策略

**最佳实践建议**:
- ✅ 使用 Orchestrator-Worker 模式
- ✅ 让 AI 智能分析并选择 Skills
- ✅ 支持条件分支和动态工作流

---

### 问题 2: ❌ 硬编码 Skills 注册表，未使用自动发现

**当前实现**:
```javascript
// 硬编码 24 个 Skills
const SKILLS_REGISTRY = {
  'literature-search': { ... },
  'citation-manager': { ... },
  ... // 24 个手动定义
};
```

**问题**:
- ❌ 新增 Skill 需要修改 CLI 代码
- ❌ 无法自动发现新的 Skills
- ❌ 违反开闭原则
- ❌ 维护成本高

**最佳实践建议**:
- ✅ 使用 `settingSources: ['user', 'project']` 自动发现
- ✅ 读取 `.claude/skills/*/SKILL.md` 动态加载
- ✅ 自动解析 YAML frontmatter

---

### 问题 3: ❌ 简单的 Prompt 模板，未引导 Skills 协作

**当前实现**:
```javascript
let prompt = `You are an academic research assistant.

## Available Skills
${selectedSkills.map(skill => `- ${skill}: ${s.description}`).join('\n')}

## User Request
${userRequest}

## Instructions
Use the available skills...`;
```

**问题**:
- ❌ 没有明确的工作流指导
- ❌ 没有 Checklist 让 Claude 跟踪进度
- ❌ 没有条件分支指导
- ❌ 没有验证检查点
- ❌ 缺少 Progressive Disclosure

**最佳实践建议**:
- ✅ 提供结构化的工作流
- ✅ 使用 Checklist 跟踪进度
- ✅ 明确条件分支: "如果需要 X，则使用 Y Skill"
- ✅ 添加验证检查点
- ✅ 使用 Progressive Disclosure 架构

---

### 问题 4: ❌ 缺少工作流状态跟踪

**当前实现**:
- ❌ 没有进度跟踪
- ❌ 没有状态管理
- ❌ 无法恢复中断的任务
- ❌ 没有验证机制

**最佳实践建议**:
- ✅ 实现进度跟踪系统
- ✅ 使用 Checklist 文件记录状态
- ✅ 支持任务恢复
- ✅ 添加验证步骤

---

### 问题 5: ❌ 未使用 `context: fork` 隔离复杂操作

**当前实现**:
```javascript
// 所有操作都在同一个 context 中
const response = await query({
  prompt,
  options: {
    settingSources: ['user', 'project'],
    allowedTools: ['Skill', 'WebSearch', ...]
  }
});
```

**问题**:
- ❌ 复杂的多步骤任务会污染主上下文
- ❌ 无法并行执行独立任务
- ❌ 调试困难
- ❌ Token 浪费

**最佳实践建议**:
- ✅ 对复杂操作使用 `context: fork`
- ✅ 让 workflow-manager 在独立上下文中编排
- ✅ 支持并行执行

---

## 改进方案设计

### 方案 1: 智能 Orchestrator 架构

```javascript
/**
 * 新架构: 智能 Orchestrator
 *
 * 1. 动态发现 Skills
 * 2. AI 分析任务并选择 Skills
 * 3. 生成结构化工作流
 * 4. 跟踪进度和验证
 */
class SkillsOrchestrator {
  async discoverSkills() {
    // 读取 .claude/skills/*/SKILL.md
    // 解析 YAML frontmatter
    // 构建动态 Skills 注册表
  }

  async analyzeTask(userRequest) {
    // 使用 AI 分析任务
    // 识别任务类型
    // 确定需要的 Skills
    // 生成执行计划
  }

  async generateWorkflow(plan) {
    // 生成结构化工作流
    // 包含 Checklist
    // 条件分支
    // 验证检查点
  }

  async executeWorkflow(workflow) {
    // 执行工作流
    // 跟踪进度
    // 验证输出
    // 保存结果
  }
}
```

---

### 方案 2: Progressive Disclosure Prompt 架构

```markdown
## 学术研究助手工作流

### 阶段 1: 任务分析
- [ ] 分析用户请求
- [ ] 识别任务类型
- [ ] 确定需要的 Skills
- [ ] 生成执行计划

### 阶段 2: 执行计划
**根据任务类型选择工作流:**

**文献研究？** → 使用文献研究工作流
- [ ] 搜索文献 (literature-search)
- [ ] 分析论文 (pdf-analyzer)
- [ ] 提取关键信息
- [ ] 生成综述 (literature-review)

**论文写作？** → 使用论文写作工作流
- [ ] 生成结构 (paper-structure)
- [ ] 撰写内容
- [ ] 质量检查 (writing-quality)
- [ ] 同行评审 (peer-review)

**数据分析？** → 使用数据分析工作流
- [ ] 分析数据 (data-analysis)
- [ ] 运行实验 (experiment-runner)
- [ ] 可视化结果
- [ ] 生成报告

### 阶段 3: 验证和输出
- [ ] 验证输出质量
- [ ] 保存到文件
- [ ] 生成元数据
```

---

### 方案 3: 动态 Skills 发现和加载

```javascript
/**
 * 动态 Skills 发现
 */
async function discoverSkills() {
  const skillsDir = '.claude/skills';
  const skills = [];

  // 递归读取所有 SKILL.md 文件
  const skillFolders = await fs.readdir(skillsDir);

  for (const folder of skillFolders) {
    const skillFile = path.join(skillsDir, folder, 'SKILL.md');

    try {
      const content = await fs.readFile(skillFile, 'utf-8');

      // 解析 YAML frontmatter
      const match = content.match(/^---\n([\s\S]+?)\n---/);
      if (match) {
        const metadata = parseYAML(match[1]);

        skills.push({
          id: folder,
          name: metadata.name,
          description: metadata.description,
          allowedTools: metadata['allowed-tools'] || [],
          context: metadata.context,
          agent: metadata.agent,
          hasSkillTool: metadata['allowed-tools']?.includes('Skill')
        });
      }
    } catch (error) {
      console.warn(`⚠️  无法加载 Skill: ${folder}`);
    }
  }

  return skills;
}

/**
 * 智能任务分析
 */
async function analyzeTask(userRequest, availableSkills) {
  const analysisPrompt = `分析以下学术研究任务，确定需要哪些 Skills：

## 任务
${userRequest}

## 可用的 Skills
${availableSkills.map(s => `- **${s.id}**: ${s.description}`).join('\n')}

## 分析要求
1. 识别任务类型（文献研究、论文写作、数据分析等）
2. 确定需要的 Skills（按优先级排序）
3. 识别 Skills 之间的依赖关系
4. 建议执行顺序

## 输出格式
\`\`\`json
{
  "taskType": "文献研究|论文写作|数据分析|...",
  "requiredSkills": ["skill-id1", "skill-id2"],
  "workflow": "工作流描述",
  "dependencies": {
    "skill-id1": ["需要调用的其他 skills"]
  }
}
\`\`\``;

  const response = await query({
    prompt: analysisPrompt,
    options: { maxTurns: 1 }
  });

  // 解析 AI 返回的 JSON
  const analysis = extractJSON(response);

  return analysis;
}
```

---

### 方案 4: 带验证检查点的工作流执行

```javascript
/**
 * 工作流执行器
 */
class WorkflowExecutor {
  constructor(workflow, skills) {
    this.workflow = workflow;
    this.skills = skills;
    this.checklist = this.initializeChecklist();
    this.state = {
      currentStep: 0,
      completedSteps: [],
      errors: []
    };
  }

  initializeChecklist() {
    // 从工作流生成 Checklist
    return this.workflow.steps.map((step, index) => ({
      id: step.id,
      title: step.title,
      status: 'pending', // pending | in_progress | completed | failed
      requiredSkills: step.skills,
      validation: step.validation,
      output: null
    }));
  }

  async execute() {
    console.log('\n📋 执行工作流:\n');
    this.displayChecklist();

    for (let i = 0; i < this.checklist.length; i++) {
      const step = this.checklist[i];
      this.state.currentStep = i;

      // 更新状态
      step.status = 'in_progress';
      this.displayChecklist();

      try {
        // 执行步骤
        const result = await this.executeStep(step);
        step.output = result;

        // 验证输出
        if (step.validation) {
          const isValid = await this.validate(step, result);
          if (!isValid) {
            throw new Error('验证失败');
          }
        }

        // 标记完成
        step.status = 'completed';
        this.state.completedSteps.push(step.id);
        this.displayChecklist();

      } catch (error) {
        step.status = 'failed';
        this.state.errors.push({
          step: step.id,
          error: error.message
        });
        this.displayChecklist();

        // 决定是否继续
        const shouldContinue = await this.askForContinuation(step, error);
        if (!shouldContinue) {
          break;
        }
      }
    }

    // 生成最终报告
    return this.generateReport();
  }

  displayChecklist() {
    console.clear();
    console.log('\n📋 工作流进度:\n');

    this.checklist.forEach((step, index) => {
      const icon = {
        'pending': '⏳',
        'in_progress': '🔄',
        'completed': '✅',
        'failed': '❌'
      }[step.status];

      const prefix = index === this.state.currentStep ? '→' : ' ';
      console.log(`${prefix} ${icon} ${step.title}`);
    });

    console.log(`\n进度: ${this.state.completedSteps.length}/${this.checklist.length}\n`);
  }

  async executeStep(step) {
    const prompt = this.buildStepPrompt(step);

    const response = await query({
      prompt,
      options: {
        settingSources: ['user', 'project'],
        allowedTools: ['Skill', 'WebSearch', 'WebFetch', 'Read', 'Write', 'Bash'],
        maxTurns: 10
      }
    });

    // 收集响应
    let content = '';
    for await (const message of response) {
      if (message.type === 'text') {
        content += message.text;
      }
    }

    return content;
  }

  buildStepPrompt(step) {
    return `## 工作流步骤: ${step.title}

### 可用的 Skills
${step.requiredSkills.map(s => `- ${s}`).join('\n')}

### 上下文
${this.getContext()}

### 任务
${step.task}

### 期望输出
${step.expectedOutput}

### 验证标准
${step.validation}

**重要**:
- 使用 Skill 工具调用其他 Skills
- 验证输出后再继续
- 如果遇到错误，报告具体问题
`;
  }

  getContext() {
    // 提供之前步骤的输出作为上下文
    return this.state.completedSteps.map(stepId => {
      const step = this.checklist.find(s => s.id === stepId);
      return `## ${step.title}\n${step.output}`;
    }).join('\n\n');
  }

  async validate(step, output) {
    // 验证输出
    const validationPrompt = `验证以下输出是否符合标准:

### 输出
${output}

### 验证标准
${step.validation}

返回 JSON: { "valid": true/false, "issues": [...] }`;

    const response = await query({
      prompt: validationPrompt,
      options: { maxTurns: 1 }
    });

    const result = extractJSON(response);
    return result.valid;
  }

  async askForContinuation(step, error) {
    // 询问用户是否继续
    console.log(`\n❌ 步骤 "${step.title}" 失败: ${error.message}`);
    console.log('是否继续执行后续步骤? (y/n)');

    // 在实际使用中应该从 stdin 读取
    // 这里为了演示返回 true
    return true;
  }

  generateReport() {
    return {
      workflow: this.workflow.name,
      completedSteps: this.state.completedSteps.length,
      totalSteps: this.checklist.length,
      errors: this.state.errors,
      outputs: this.checklist.map(step => ({
        step: step.title,
        output: step.output
      }))
    };
  }
}
```

---

## 新 CLI 架构概览

```
┌─────────────────────────────────────────────────────────┐
│                    CLI Entry Point                       │
│                   (academic-cli.mjs)                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Skills Orchestrator                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 1. Dynamic Skills Discovery                      │  │
│  │    - Read .claude/skills/*/SKILL.md              │  │
│  │    - Parse YAML frontmatter                      │  │
│  │    - Build skills registry                       │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 2. AI Task Analysis                              │  │
│  │    - Analyze user request                        │  │
│  │    - Identify task type                          │  │
│  │    - Select required skills                      │  │
│  │    - Generate execution plan                     │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 3. Workflow Generation                           │  │
│  │    - Build structured workflow                   │  │
│  │    - Create checklist                            │  │
│  │    - Define validation checkpoints               │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Workflow Executor                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ - Execute workflow step by step                  │  │
│  │ - Track progress with checklist                  │  │
│  │ - Validate outputs at checkpoints                │  │
│  │ - Handle errors gracefully                       │  │
│  │ - Use fork context for complex operations        │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  Output Manager                          │
│  - Save results to files                                │
│  - Generate metadata                                     │
│  - Export multiple formats                               │
└─────────────────────────────────────────────────────────┘
```

---

## 关键改进点总结

| 改进点 | 当前实现 | 改进方案 | 效果 |
|--------|---------|---------|------|
| Skills 发现 | 硬编码 24 个 | 动态读取 SKILL.md | ✅ 自动发现新 Skills |
| 任务分析 | 简单关键词匹配 | AI 智能分析 | ✅ 理解复杂请求 |
| 工作流生成 | 无结构 | 结构化 + Checklist | ✅ 进度可跟踪 |
| Skills 协作 | 简单列表 | 条件分支指导 | ✅ 智能协作 |
| 验证机制 | 无 | 检查点验证 | ✅ 质量保证 |
| 状态管理 | 无 | 完整状态跟踪 | ✅ 可恢复 |
| Context | 单一上下文 | Fork 复杂操作 | ✅ 隔离和并行 |

---

## 下一步

基于这个分析，我将实现:

1. **Skills Orchestrator** - 动态发现和智能分析
2. **Workflow Executor** - 带验证的工作流执行
3. **Progressive Disclosure Prompts** - 结构化工作流指导
4. **完整的测试** - 验证所有改进功能
