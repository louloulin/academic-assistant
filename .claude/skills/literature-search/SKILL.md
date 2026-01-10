---
name: literature-search
description: Search academic papers across multiple databases (ArXiv, Google Scholar, PubMed) using Claude Agent SDK and MCP servers
version: 1.0.0
author: Academic Assistant Team
capabilities:
  - web_search
  - web_fetch
  - mcp_integration
parameters:
  query:
    type: string
    required: true
    description: Search query for academic papers
  maxResults:
    type: number
    default: 10
    description: Maximum number of results to return
  sources:
    type: array
    default: ["arxiv", "semantic-scholar", "mcp"]
    description: Databases to search (arxiv, semantic-scholar, pubmed, acl, google-scholar, mcp)
  useMCP:
    type: boolean
    default: true
    description: Prioritize MCP servers if available
---

# Literature Search Skill

基于 **Claude Agent SDK** 和 **MCP 协议** 的学术文献搜索技能。

## 功能特性

- ✅ 多数据库搜索 (ArXiv, Google Scholar, PubMed)
- ✅ MCP 服务器集成
- ✅ 真实 Claude API 调用
- ✅ 智能降级机制
- ✅ 结果去重和排序
