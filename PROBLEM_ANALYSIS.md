# 🔍 CLI V3.0 生产效果差 - 问题分析

## 问题现象

执行 CLI V3 后，生成的输出文件几乎为空：

```markdown
## 步骤: orchestrate
（空白）
```

---

## 🔍 根本原因分析

### 问题 1: WorkflowExecutor 没有捕获 Skill 的输出

**当前实现** (academic-cli-v3.mjs):
```javascript
async executeStep(workflowStep, checklistStep) {
  const response = await query({
    prompt,
    options: {
      model: this.config.model,
      maxTurns: this.config.maxTurns,
      settingSources: ['user', 'project'],
      allowedTools: ['Skill', 'WebSearch', 'WebFetch', 'Read', 'Write', 'Bash', 'Edit'],
    }
  });

  // 收集响应
  let content = '';
  for await (const message of response) {
    if (message.type === 'text') {
      process.stdout.write(message.text);  // 只输出到控制台
      content += message.text;
    }
  }

  console.log('\n');
  return content;
}
```

**问题**:
- ✅ 内容输出到控制台 (用户可以看到)
- ❌ 但 Workflow Manager 调用其他 Skills 时，**那些 Skills 的输出没有被捕获**
- ❌ 只有最终的总结被保存，而不是 Skills 的实际执行结果

---

### 问题 2: workflow-manager 使用 Fork Context

**Fork Context 的问题**:
- Fork Context 创建**独立的子上下文**
- 子上下文的输出**不会返回**到父上下文
- 父上下文只能看到**最终的总结**，而不是详细的执行过程

**实际情况**:
```
Main Context
  └─> workflow-manager (Fork Context)
       └─> literature-search Skill
            └─> [大量输出] ❌ 不会返回到 Main Context
       └─> 最终总结: "完成" ✅ 只有这个返回
```

---

### 问题 3: AI 分析返回格式错误

**现象**:
```
🤔 分析任务...
⚠️  AI 分析返回格式错误，使用默认策略
```

**原因**:
- AI 返回的不是纯 JSON
- JSON 周围有额外的文本
- `extractJSON()` 函数无法正确解析

**影响**:
- 无法使用智能的任务分析
- 降级到简单的关键词匹配
- 无法选择最优的工作流

---

### 问题 4: 输出捕获机制不完整

**当前流程**:
1. 用户请求 → CLI
2. CLI → WorkflowExecutor
3. WorkflowExecutor → query() (Claude SDK)
4. Claude SDK → workflow-manager (Skill)
5. workflow-manager (Fork) → literature-search (Skill)
6. literature-search → **执行搜索，生成结果**
7. **但结果只在 Fork Context 中，没有返回**
8. workflow-manager → "完成"（只有总结）
9. ❌ 保存到文件的只有"完成"二字

---

## 📊 问题严重性评估

| 问题 | 严重性 | 影响 | 优先级 |
|------|--------|------|--------|
| Fork Context 输出丢失 | 🔴 高 | 核心功能失效 | P0 |
| 输出捕获不完整 | 🔴 高 | 用户看不到结果 | P0 |
| AI 分析格式错误 | 🟡 中 | 降级到关键词匹配 | P1 |
| 输出文件为空 | 🔴 高 | 功能无法使用 | P0 |

---

## 🔧 解决方案

### 方案 1: 不使用 Fork Context（推荐）

**原理**: 直接在主上下文中执行，所有输出都能被捕获

**修改**:
```yaml
---
name: workflow-manager
description: Orchestrate multi-agent research workflows
allowed-tools:
  - Bash
  - Read
  - Write
  - Skill
context: default  # 不使用 fork
agent: general-purpose
---
```

**优点**:
- ✅ 所有输出都能被捕获
- ✅ 简单直接
- ✅ 立即见效

**缺点**:
- ⚠️ 上下文可能变大（但可接受）

---

### 方案 2: 改进输出捕获机制

**原理**: 在 Fork Context 中将结果写入文件

**修改 workflow-manager**:
```markdown
## 执行指南

1. 使用 Skill 工具调用其他 Skills
2. **将结果写入文件** (使用 Write 工具)
3. 在最终总结中**包含文件路径**
```

**优点**:
- ✅ 保留 Fork Context 的隔离性
- ✅ 结果持久化

**缺点**:
- ⚠️ 需要修改所有 Skills 的实现

---

### 方案 3: 使用 Agent SDK 的返回值

**原理**: 利用 Agent SDK 的 `return` 值

**修改**:
```javascript
// 不使用流式输出，直接获取完整结果
const response = await query({
  prompt,
  options: {
    model: this.config.model,
    maxTurns: 10,
    // 不使用流式
  }
});

// response 是完整的结果
const content = response;
```

**优点**:
- ✅ 获取完整输出

**缺点**:
- ⚠️ 失去流式输出的实时反馈

---

### 方案 4: 混合方案（最佳）

**结合方案 1 和方案 2**:

1. **对于复杂任务**: 不使用 Fork Context，直接在主上下文执行
2. **对于隔离任务**: 使用 Fork Context，但要求将结果写入文件
3. **改进输出捕获**: 同时捕获流式输出和文件输出

**实现**:
```javascript
async executeStep(workflowStep, checklistStep) {
  const prompt = `...`;

  const response = await query({
    prompt,
    options: {
      model: this.config.model,
      maxTurns: this.config.maxTurns,
      settingSources: ['user', 'project'],
      allowedTools: ['Skill', 'WebSearch', 'WebFetch', 'Read', 'Write', 'Bash', 'Edit'],
    }
  });

  // 1. 收集流式输出
  let content = '';
  for await (const message of response) {
    if (message.type === 'text') {
      process.stdout.write(message.text);
      content += message.text;
    }
  }

  // 2. 检查是否有写入的文件
  const outputFile = `output/step-${workflowStep.id}-${Date.now()}.md`;
  try {
    const fileContent = await fs.readFile(outputFile, 'utf-8');
    if (fileContent.length > content.length) {
      // 文件内容更完整，使用文件内容
      content = fileContent;
    }
  } catch {
    // 文件不存在，使用流式输出的内容
  }

  return content;
}
```

---

## 🎯 推荐的修复步骤

### 第 1 步: 禁用 workflow-manager 的 Fork Context

```bash
# 修改 .claude/skills/workflow-manager/SKILL.md
# 将 context: fork 改为 context: default
```

### 第 2 步: 改进输出捕获

```javascript
// 在 executeStep 中添加文件读取
async executeStep(workflowStep, checklistStep) {
  // ... 现有代码 ...

  // 尝试读取 Skills 写入的文件
  const possibleFiles = [
    `output/${workflowStep.id}-result.md`,
    `output/step-${workflowStep.id}.md`,
  ];

  for (const file of possibleFiles) {
    try {
      const fileContent = await fs.readFile(file, 'utf-8');
      if (fileContent.trim().length > 0) {
        content = fileContent;
        break;
      }
    } catch {
      // 文件不存在，继续
    }
  }

  return content;
}
```

### 第 3 步: 修复 AI 分析的 JSON 解析

```javascript
function extractJSON(text) {
  // 尝试多种方式提取 JSON
  const patterns = [
    /```json\n([\s\S]+?)\n```/,
    /```\n([\s\S]+?)\n```/,
    /\{[\s\S]*?\}/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        // 清理可能的 markdown 标记
        let jsonStr = match[1] || match[0];
        jsonStr = jsonStr
          .replace(/^```json\n/, '')
          .replace(/^```\n/, '')
          .replace(/\n```$/, '')
          .trim();

        return JSON.parse(jsonStr);
      } catch (e) {
        continue;
      }
    }
  }

  return null;
}
```

### 第 4 步: 添加调试输出

```javascript
async executeStep(workflowStep, checklistStep) {
  console.log(`\n🔍 调试: 执行步骤 ${workflowStep.id}`);

  const response = await query({...});

  let content = '';
  let messageCount = 0;

  for await (const message of response) {
    if (message.type === 'text') {
      messageCount++;
      content += message.text;
    }
  }

  console.log(`\n🔍 调试: 收到 ${messageCount} 条消息`);
  console.log(`🔍 调试: 内容长度 ${content.length} 字符`);

  if (content.length === 0) {
    console.warn('⚠️  警告: 步骤输出为空！');
  }

  return content;
}
```

---

## 📝 总结

**根本原因**:
1. Fork Context 隔离了输出，导致结果丢失
2. 输出捕获机制不完整
3. AI 分析 JSON 解析失败

**推荐修复**:
1. ✅ 禁用 workflow-manager 的 Fork Context（立竿见影）
2. ✅ 改进输出捕获机制
3. ✅ 修复 JSON 解析
4. ✅ 添加调试输出

**预期效果**:
- 输出文件包含完整的内容
- 用户可以看到 Skills 的实际执行结果
- 系统稳定可靠
