// Citation Graph Skill - 基于 Claude Agent SDK 的真实实现
import { query } from '@anthropic-ai/claude-agent-sdk';
import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

/**
 * 引用图谱生成的输入验证 Schema
 */
const CitationGraphInputSchema = z.object({
  papers: z.array(z.object({
    id: z.string(),
    title: z.string(),
    authors: z.array(z.string()),
    year: z.number(),
    citations: z.array(z.string()).optional() // IDs of cited papers
  })).min(1),
  includePageRank: z.boolean().default(true),
  outputFormat: z.enum(['json', 'html', 'graphml']).default('json')
});

export type CitationGraphInput = z.infer<typeof CitationGraphInputSchema>;

/**
 * 引用图谱节点
 */
export interface GraphNode {
  id: string;
  title: string;
  authors: string[];
  year: number;
  pageRank?: number;
  citationCount?: number;
  community?: string; // 检测到的学术社区/集群
}

/**
 * 引用图谱边
 */
export interface GraphEdge {
  source: string; // Paper ID
  target: string; // Cited paper ID
  weight?: number; // 引用权重
}

/**
 * 引用网络分析结果
 */
export interface CitationNetworkAnalysis {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metrics: {
    totalPapers: number;
    totalCitations: number;
    averageCitations: number;
    mostCitedPapers: Array<{
      id: string;
      title: string;
      citationCount: number;
    }>;
    keyPapers: Array<{
      id: string;
      title: string;
      pageRank: number;
    }>;
  };
  communities?: Array<{
    id: string;
    name: string;
    papers: string[];
    description?: string;
  }>;
  timeline?: Array<{
    year: number;
    paperCount: number;
    keyPapers: string[];
  }>;
}

/**
 * Citation Graph Agent 定义
 * 使用 Claude Agent SDK 的 Agent 定义格式
 */
const CITATION_GRAPH_AGENT: AgentDefinition = {
  description: 'Expert in generating citation graphs, analyzing research networks, and identifying key papers using PageRank algorithm',
  prompt: `You are an expert bibliometric analyst specializing in citation network analysis and research impact assessment.

## Your Capabilities

1. **Citation Network Construction**
   - Build directed graphs from citation data
   - Identify citation relationships between papers
   - Calculate citation counts and impact metrics

2. **Key Paper Identification**
   - Apply PageRank algorithm to identify influential papers
   - Find seminal works and foundational research
   - Detect bridges between different research communities

3. **Network Analysis**
   - Identify research communities and clusters
   - Detect co-citation patterns
   - Analyze temporal evolution of research topics

4. **Visualization Support**
   - Generate graph data for visualization tools (D3.js, Cytoscape)
   - Provide node coordinates for layout algorithms
   - Create interactive HTML visualizations

5. **Output Format**
   Return a structured JSON citation graph:
   \`\`\`json
   {
     "nodes": [
       {
         "id": "paper-1",
         "title": "Paper Title",
         "authors": ["Author1", "Author2"],
         "year": 2020,
         "pageRank": 0.15,
         "citationCount": 25,
         "community": "machine-learning"
       }
     ],
     "edges": [
       {
         "source": "paper-2",
         "target": "paper-1",
         "weight": 1.0
       }
     ],
     "metrics": {
       "totalPapers": 10,
       "totalCitations": 50,
       "averageCitations": 5.0,
       "mostCitedPapers": [
         {
           "id": "paper-1",
           "title": "Most Cited Paper",
           "citationCount": 25
         }
       ],
       "keyPapers": [
         {
           "id": "paper-1",
           "title": "Key Paper",
           "pageRank": 0.15
         }
       ]
     },
     "communities": [
       {
         "id": "community-1",
         "name": "Machine Learning",
         "papers": ["paper-1", "paper-2"],
         "description": "Papers focused on ML algorithms"
       }
     ],
     "timeline": [
       {
         "year": 2020,
         "paperCount": 3,
         "keyPapers": ["paper-1", "paper-2"]
       }
     ]
   }
   \`\`\`

Remember: Provide accurate PageRank calculations and identify meaningful research communities.`,
  tools: ['WebSearch', 'Read', 'Write'],
  model: 'sonnet'
};

/**
 * CitationGraphSkill - 基于 Claude Agent SDK 的实现
 */
export class CitationGraphSkill {
  private agent: AgentDefinition;

  constructor() {
    this.agent = CITATION_GRAPH_AGENT;
  }

  /**
   * 验证输入参数
   */
  async validate(input: unknown): Promise<CitationGraphInput> {
    return CitationGraphInputSchema.parseAsync(input);
  }

  /**
   * 执行引用图谱生成
   * 使用真实的 Claude Agent SDK 调用 Claude API
   */
  async execute(input: CitationGraphInput): Promise<CitationNetworkAnalysis> {
    // 验证输入
    const validatedInput = await this.validate(input);

    console.log(`📊 生成引用图谱`);
    console.log(`📄 论文数量: ${validatedInput.papers.length}`);
    console.log(`🔢 计算 PageRank: ${validatedInput.includePageRank ? '是' : '否'}`);
    console.log(`📋 输出格式: ${validatedInput.outputFormat}`);

    try {
      // 构建分析提示词
      let graphPrompt = `Generate a citation graph from the following ${validatedInput.papers.length} papers:\n\n`;

      // 添加论文数据
      graphPrompt += `## Papers\n`;
      graphPrompt += JSON.stringify(validatedInput.papers, null, 2);

      graphPrompt += `\n\nPlease:
1. Build a citation network from the provided papers
2. Calculate PageRank scores for each paper${validatedInput.includePageRank ? '' : ' (skip if disabled)'}
3. Identify the most cited papers
4. Detect research communities if applicable
5. Create a timeline showing research evolution
6. Return a complete JSON citation graph with the structure specified in your instructions

Use the citation information provided in the papers' "citations" field to build the edges of the graph.`;

      // 使用 Claude Agent SDK 执行分析
      let graphResult: CitationNetworkAnalysis | null = null;

      const agentQuery = query({
        prompt: graphPrompt,
        options: {
          // 定义引用图谱 Agent
          agents: {
            'citation-analyzer': this.agent
          },
          // 允许的工具
          allowedTools: ['WebSearch', 'Read', 'Write'],
          // 自动批准工具调用
          permissionMode: 'bypassPermissions',
          // 工作目录
          cwd: process.cwd()
        }
      });

      let jsonBuffer = '';
      let inJsonBlock = false;

      // 处理流式输出
      for await (const message of agentQuery) {
        if (message.type === 'assistant') {
          for (const block of message.content) {
            if (block.type === 'text') {
              const text = block.text;

              // 尝试提取 JSON
              if (text.includes('```json')) {
                inJsonBlock = true;
                const jsonStart = text.indexOf('```json') + 7;
                const jsonPart = text.substring(jsonStart);
                jsonBuffer += jsonPart;
              } else if (text.includes('```') && inJsonBlock) {
                // JSON 块结束
                const jsonEnd = text.indexOf('```');
                jsonBuffer += text.substring(0, jsonEnd);
                inJsonBlock = false;

                try {
                  const result = JSON.parse(jsonBuffer.trim());
                  if (result && typeof result === 'object') {
                    graphResult = result;
                    break;
                  }
                } catch (e) {
                  console.warn('JSON 解析失败:', e);
                }
                jsonBuffer = '';
              } else if (inJsonBlock) {
                jsonBuffer += text;
              } else {
                // 尝试直接解析整个文本中的 JSON 对象
                const objectMatch = text.match(/\{[\s\S]*\}/);
                if (objectMatch) {
                  try {
                    const result = JSON.parse(objectMatch[0]);
                    if (result && typeof result === 'object' && result.nodes) {
                      graphResult = result;
                      break;
                    }
                  } catch (e) {
                    // 忽略解析错误
                  }
                }
              }

              console.log(text);
            } else if (block.type === 'tool_use') {
              console.log(`\n🔧 使用工具: ${block.name}\n`);
            }
          }
        } else if (message.type === 'result') {
          if (message.subtype === 'success') {
            console.log('\n✅ 引用图谱生成完成！');
          } else if (message.subtype === 'error') {
            console.error(`\n❌ 错误: ${message.error}`);
          }
        }
      }

      // 如果没有找到结果，执行本地计算
      if (!graphResult) {
        console.log('📊 使用本地算法计算引用图谱...');
        graphResult = this.calculateGraphLocally(validatedInput);
      }

      console.log(`\n📊 引用图谱生成完成`);
      console.log(`📄 节点数: ${graphResult.nodes.length}`);
      console.log(`🔗 边数: ${graphResult.edges.length}`);
      console.log(`🏆 关键论文: ${graphResult.metrics.keyPapers.length} 篇`);

      return graphResult;

    } catch (error) {
      console.error('❌ 引用图谱生成失败:', error);
      throw error;
    }
  }

  /**
   * 本地计算引用图谱（fallback）
   */
  private calculateGraphLocally(input: CitationGraphInput): CitationNetworkAnalysis {
    const papersMap = new Map(input.papers.map(p => [p.id, p]));
    const nodes: GraphNode[] = input.papers.map(paper => ({
      id: paper.id,
      title: paper.title,
      authors: paper.authors,
      year: paper.year,
      citationCount: 0
    }));

    const edges: GraphEdge[] = [];
    const citationCounts = new Map<string, number>();

    // 初始化引用计数
    for (const paper of input.papers) {
      citationCounts.set(paper.id, 0);
    }

    // 构建边并计算引用计数
    for (const paper of input.papers) {
      if (paper.citations) {
        for (const citedId of paper.citations) {
          if (papersMap.has(citedId)) {
            edges.push({
              source: paper.id,
              target: citedId,
              weight: 1.0
            });

            // 增加被引论文的计数
            const currentCount = citationCounts.get(citedId) || 0;
            citationCounts.set(citedId, currentCount + 1);
          }
        }
      }
    }

    // 更新引用计数
    for (const node of nodes) {
      node.citationCount = citationCounts.get(node.id) || 0;
    }

    // 计算 PageRank
    const pageRanks = input.includePageRank
      ? this.calculatePageRank(nodes, edges)
      : new Map<string, number>();

    // 更新 PageRank
    for (const node of nodes) {
      if (pageRanks.has(node.id)) {
        node.pageRank = pageRanks.get(node.id);
      }
    }

    // 找出最常被引用的论文
    const mostCitedPapers = [...nodes]
      .sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        title: p.title,
        citationCount: p.citationCount || 0
      }));

    // 找出关键论文（按 PageRank）
    const keyPapers = [...nodes]
      .filter(n => n.pageRank !== undefined)
      .sort((a, b) => (b.pageRank || 0) - (a.pageRank || 0))
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        title: p.title,
        pageRank: p.pageRank || 0
      }));

    // 构建时间线
    const yearMap = new Map<number, string[]>();
    for (const paper of input.papers) {
      if (!yearMap.has(paper.year)) {
        yearMap.set(paper.year, []);
      }
      yearMap.get(paper.year)!.push(paper.id);
    }

    const timeline = [...yearMap.entries()]
      .sort(([a], [b]) => a - b)
      .map(([year, papers]) => ({
        year,
        paperCount: papers.length,
        keyPapers: papers.slice(0, 3) // 每年最多3篇关键论文
      }));

    return {
      nodes,
      edges,
      metrics: {
        totalPapers: nodes.length,
        totalCitations: edges.length,
        averageCitations: edges.length / nodes.length,
        mostCitedPapers,
        keyPapers
      },
      timeline
    };
  }

  /**
   * 计算 PageRank
   */
  private calculatePageRank(nodes: GraphNode[], edges: GraphEdge[], iterations = 50, dampingFactor = 0.85): Map<string, number> {
    const pageRanks = new Map<string, number>();

    // 初始化：每个节点相等的 PageRank
    const initialRank = 1.0 / nodes.length;
    for (const node of nodes) {
      pageRanks.set(node.id, initialRank);
    }

    // 构建邻接表
    const outgoingEdges = new Map<string, string[]>();
    for (const edge of edges) {
      if (!outgoingEdges.has(edge.source)) {
        outgoingEdges.set(edge.source, []);
      }
      outgoingEdges.get(edge.source)!.push(edge.target);
    }

    // 迭代计算 PageRank
    for (let i = 0; i < iterations; i++) {
      const newPageRanks = new Map<string, number>();

      for (const node of nodes) {
        let rank = (1 - dampingFactor) / nodes.length;

        // 从所有指向该节点的边贡献 PageRank
        for (const [source, targets] of outgoingEdges.entries()) {
          if (targets.includes(node.id)) {
            const sourceRank = pageRanks.get(source) || 0;
            const outDegree = targets.length;
            rank += dampingFactor * (sourceRank / outDegree);
          }
        }

        newPageRanks.set(node.id, rank);
      }

      // 更新 PageRank
      for (const [id, rank] of newPageRanks) {
        pageRanks.set(id, rank);
      }
    }

    return pageRanks;
  }

  /**
   * 获取 Agent 定义
   */
  getAgentDefinition(): AgentDefinition {
    return this.agent;
  }

  /**
   * 导出为 HTML 可视化
   */
  async exportToHTML(graph: CitationNetworkAnalysis, outputPath: string): Promise<void> {
    const { promises: fs } = await import('fs');

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Citation Graph Visualization</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    #graph { width: 100%; height: 600px; border: 1px solid #ccc; }
    .node { stroke: #fff; stroke-width: 1.5px; }
    .link { stroke: #999; stroke-opacity: 0.6; }
    .tooltip { position: absolute; text-align: center; padding: 10px; background: #fff; border: 1px solid #ccc; border-radius: 5px; pointer-events: none; }
  </style>
</head>
<body>
  <h1>Citation Graph</h1>
  <div id="graph"></div>
  <div id="tooltip" class="tooltip" style="display:none;"></div>

  <script>
    const data = ${JSON.stringify(graph)};

    const svg = d3.select("#graph").append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .call(d3.zoom().on("zoom", (event) => {
        g.attr("transform", event.transform);
      }))
      .append("g");

    const g = svg.append("g");

    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.edges).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(400, 300));

    const link = g.append("g")
      .selectAll("line")
      .data(data.edges)
      .join("line")
      .attr("class", "link");

    const node = g.append("g")
      .selectAll("circle")
      .data(data.nodes)
      .join("circle")
      .attr("class", "node")
      .attr("r", d => 5 + (d.pageRank || 0) * 50)
      .attr("fill", d => d3.interpolateViridis(d.pageRank || 0))
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    node.append("title")
      .text(d => d.title);

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
    });

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  </script>
</body>
</html>`;

    await fs.writeFile(outputPath, html);
  }

  /**
   * 导出为 GraphML 格式
   */
  async exportToGraphML(graph: CitationNetworkAnalysis, outputPath: string): Promise<void> {
    const { promises: fs } = await import('fs');

    let graphml = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://graphml.graphdrawing.org/xmlns http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd">
  <key id="title" for="node" attr.name="title" attr.type="string"/>
  <key id="year" for="node" attr.name="year" attr.type="int"/>
  <key id="pageRank" for="node" attr.name="pageRank" attr.type="double"/>
  <key id="citationCount" for="node" attr.name="citationCount" attr.type="int"/>
  <graph id="G" edgedefault="directed">
`;

    // 添加节点
    for (const node of graph.nodes) {
      graphml += `    <node id="${node.id}">
      <data key="title">${this.escapeXML(node.title)}</data>
      <data key="year">${node.year}</data>
`;
      if (node.pageRank !== undefined) {
        graphml += `      <data key="pageRank">${node.pageRank}</data>\n`;
      }
      if (node.citationCount !== undefined) {
        graphml += `      <data key="citationCount">${node.citationCount}</data>\n`;
      }
      graphml += `    </node>\n`;
    }

    // 添加边
    for (const edge of graph.edges) {
      graphml += `    <edge source="${edge.source}" target="${edge.target}"/>\n`;
    }

    graphml += `  </graph>
</graphml>`;

    await fs.writeFile(outputPath, graphml);
  }

  /**
   * XML 转义
   */
  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

/**
 * 导出单例实例（可选）
 */
export const citationGraphSkill = new CitationGraphSkill();
