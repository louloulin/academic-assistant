# 🔧 CLI V3.0 生产效果差 - 根本原因与最终修复

## 问题现象

执行 CLI 后：
```
🔍 调试: 收到 0 条消息
🔍 调试: 内容长度 0 字符
⚠️  警告: 步骤输出为空！
```

生成的输出文件为空或几乎为空。

---

## 🔍 根本原因

### 问题 1: workflow-manager Skill 没有被正确调用 ❌

**分析**:
- CLI 调用了 `query()` 函数
- Prompt 中明确要求使用 Skill 工具调用 workflow-manager
- 但 `query()` 返回了 **0 条消息**
- 这说明 **Claude SDK 没有调用任何 Skill**

**可能原因**:
1. `settingSources: ['user', 'project']` 配置可能不正确
2. Skill 工具的权限配置可能有问题
3. workflow-manager Skill 的描述可能不够清晰
4. Claude SDK 可能无法识别或加载 Skills

---

### 问题 2: Fork Context 的副作用 ⚠️

**已修复**: 将 workflow-manager 的 `context: fork` 改为 `context: default`

但这还不够，因为问题的根源在于 **Skill 没有被调用**。

---

### 问题 3: AI 分析完全失败 ⚠️

```
🤔 分析任务...
⚠️  AI 分析返回格式错误，使用默认策略
```

**分析**:
- AI 分析任务时，应该调用 Claude SDK
- 但返回格式错误，无法解析 JSON
- 降级到关键词匹配（默认策略）

**影响**:
- 无法智能选择最优 Skills
- 只能使用简单的关键词匹配

---

## 🎯 最终修复方案

### 方案 A: 简化架构（推荐）⭐

**原理**: 不通过 workflow-manager，直接在 CLI 中调用 Skills

**实现**:
```javascript
// 不使用 workflow-manager Skill
// 直接在 CLI 中实现工作流逻辑

async executeSimpleWorkflow(userRequest, requiredSkills) {
  for (const skillId of requiredSkills) {
    console.log(`\n🔄 调用 Skill: ${skillId}`);

    // 直接构建 Skill 的 prompt
    const skillPrompt = `你是 ${skillId} Skill。

## 用户请求
${userRequest}

## 任务
请完成 ${skillId} 的任务。

## 输出要求
提供详细的、结构化的输出。`;

    const response = await query({
      prompt: skillPrompt,
      options: {
        model: this.config.model,
        maxTurns: 10,
        settingSources: ['user', 'project'],
        allowedTools: ['WebSearch', 'WebFetch', 'Read', 'Write', 'Bash'],
      }
    });

    // 收集输出
    let content = '';
    for await (const message of response) {
      if (message.type === 'text') {
        process.stdout.write(message.text);
        content += message.text;
      }
    }

    this.state.outputs[skillId] = content;
  }

  return this.state.outputs;
}
```

**优点**:
- ✅ 简单直接
- ✅ 完全控制执行流程
- ✅ 确保输出被捕获
- ✅ 立即见效

**缺点**:
- ⚠️ 失去 workflow-manager 的编排能力
- ⚠️ 需要在 CLI 中维护工作流逻辑

---

### 方案 B: 调试 Skill 调用（复杂）

**步骤**:

1. **验证 Skill 配置**
```bash
# 检查 workflow-manager SKILL.md
cat .claude/skills/workflow-manager/SKILL.md
```

2. **简化 Prompt**
```javascript
const prompt = `请调用 workflow-manager Skill 来完成以下任务: ${userRequest}`;
```

3. **添加更多调试**
```javascript
console.log('🔍 Prompt:', prompt.substring(0, 200));
console.log('🔍 Allowed Tools:', ['Skill', 'WebSearch', ...]);
console.log('🔍 Setting Sources:', ['user', 'project']);
```

4. **检查 Claude SDK 日志**
```javascript
const response = await query({
  prompt,
  options: {
    model: this.config.model,
    maxTurns: this.config.maxTurns,
    settingSources: ['user', 'project'],
    allowedTools: ['Skill', 'WebSearch', 'WebFetch', 'Read', 'Write', 'Bash', 'Edit'],
    // 添加调试选项
    debug: true,
  }
});
```

---

### 方案 C: 混合方案（最佳）⭐⭐

**原理**: 保留复杂的编排任务给 workflow-manager，简单的任务直接执行

**实现**:
```javascript
async executeWorkflow(workflow, config) {
  // 判断是否需要 workflow-manager
  if (workflow.steps.length === 1 &&
      workflow.steps[0].skillIds.includes('workflow-manager')) {

    // 简单任务：直接执行，不通过 workflow-manager
    console.log('📋 使用直接执行模式');
    return await this.executeDirectly(userRequest);
  } else {
    // 复杂任务：使用 workflow-manager
    console.log('📋 使用编排模式');
    return await this.executeOrchestrated(workflow);
  }
}

async executeDirectly(userRequest) {
  // 根据请求类型直接调用相应的 Skills
  const prompt = `你是学术助手。

## 用户请求
${userRequest}

## 请完成以下任务:
1. 理解用户的请求
2. 使用合适的工具（WebSearch, Read, Write等）
3. 提供详细的、结构化的输出

**重要**: 不要说"我将调用某个 Skill"，而是直接完成任务！`;

  const response = await query({
    prompt,
    options: {
      model: this.config.model,
      maxTurns: 10,
      settingSources: ['user', 'project'],
      allowedTools: ['WebSearch', 'WebFetch', 'Read', 'Write', 'Bash', 'Edit'],
    }
  });

  // 收集输出
  let content = '';
  for await (const message of response) {
    if (message.type === 'text') {
      process.stdout.write(message.text);
      content += message.text;
    }
  }

  return { orchestrate: content };
}
```

---

## 🚀 推荐的快速修复

**最简单有效的方案**: 修改 CLI，不使用 Skill 工具，直接完成任务

**修改 executeStep 方法**:

```javascript
async executeStep(workflowStep, checklistStep) {
  console.log(`\n🔄 执行步骤: ${step.title}`);
  console.log(`   Skills: ${step.skills}\n`);

  // 不使用 Skill 工具，直接构建任务 prompt
  const prompt = `## 任务: ${workflowStep.title}

### 描述
${workflowStep.task}

### 期望输出
${workflowStep.expectedOutput}

### 验证标准
${workflowStep.validation}

${this.getPreviousOutputs() ? `### 之前步骤的输出\n${this.getPreviousOutputs()}\n` : ''}

## 执行要求

请直接完成上述任务，提供详细的、结构化的输出。

你可以使用以下工具:
- WebSearch: 搜索网络信息
- WebFetch: 获取网页内容
- Read: 读取文件
- Write: 写入文件
- Bash: 执行命令

**重要**:
- 直接完成任务，不要说"我将调用某个工具"
- 提供详细的、结构化的输出
- 确保输出符合验证标准

开始执行:`;

  const response = await query({
    prompt,
    options: {
      model: this.config.model,
      maxTurns: this.config.maxTurns,
      settingSources: ['user', 'project'],
      allowedTools: ['WebSearch', 'WebFetch', 'Read', 'Write', 'Bash', 'Edit'],
    }
  });

  // 收集输出
  let content = '';
  let messageCount = 0;

  for await (const message of response) {
    if (message.type === 'text') {
      messageCount++;
      process.stdout.write(message.text);
      content += message.text;
    }
  }

  console.log('\n');
  console.log(`✅ 收到 ${messageCount} 条消息，内容长度 ${content.length} 字符`);

  if (content.length === 0) {
    console.warn('⚠️  警告: 步骤输出为空！');
  }

  return content;
}
```

---

## 📝 修复效果预期

### 修复前
```
🔍 调试: 收到 0 条消息
🔍 调试: 内容长度 0 字符
⚠️  警告: 步骤输出为空！

输出文件: 几乎为空
```

### 修复后
```
🔄 执行步骤: 编排执行
   Skills: workflow-manager, literature-search

[Claude 开始执行搜索任务...]
🔍 调试: 收到 15 条消息
🔍 调试: 内容长度 3542 字符
✅ 内容已捕获 (3542 字符)

输出文件: 包含完整的搜索结果
```

---

## 🎯 总结

**根本原因**:
1. ❌ Skill 工具调用失败（返回 0 条消息）
2. ❌ workflow-manager 编排没有实际执行
3. ❌ 输出完全丢失

**推荐修复**:
1. ✅ 不依赖 Skill 工具，直接构建 prompt
2. ✅ 给 Claude 明确的任务描述
3. ✅ 直接配置需要的工具（WebSearch, Read, Write等）
4. ✅ 捕获所有流式输出

**预期效果**:
- ✅ 输出不再为空
- ✅ 用户可以看到完整的结果
- ✅ 系统稳定可靠
