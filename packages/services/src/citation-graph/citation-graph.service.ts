/**
 * Citation Graph Service
 *
 * Generate interactive citation graphs to visualize research relationships
 * and identify key papers using PageRank algorithm.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

// Semantic Scholar API endpoints
const SEMANTIC_SCHOLAR_API = 'https://api.semanticscholar.org/graph/v1';

export interface CitationGraphOptions {
  maxDepth?: number;
  minCitations?: number;
  includeYear?: boolean;
  algorithm?: 'pagerank' | 'degree' | 'betweenness';
  timeout?: number;
}

export interface PaperNode {
  id: string;
  title: string;
  authors: string[];
  year?: number;
  venue?: string;
  citations: number;
  pageRank: number;
  community: number;
  centrality: number;
  abstract?: string;
  url?: string;
}

export interface CitationEdge {
  source: string;
  target: string;
  weight: number;
  year?: number;
}

export interface CitationGraph {
  nodes: PaperNode[];
  edges: CitationEdge[];
}

export interface GraphMetrics {
  totalNodes: number;
  totalEdges: number;
  density: number;
  avgClustering: number;
  avgPathLength: number;
  maxDegree: number;
  avgDegree: number;
}

export interface Community {
  id: number;
  size: number;
  topPapers: string[];
  keywords: string[];
  topAuthors: string[];
}

export interface KeyPaper {
  id: string;
  title: string;
  pageRank: number;
  citations: number;
  centrality: number;
  reason: string;
}

export interface TimelineData {
  year: number;
  papers: number;
  citations: number;
  avgPageRank: number;
  emergingTopics: string[];
}

export interface CitationGraphResult {
  graph: CitationGraph;
  metrics: GraphMetrics;
  communities: Community[];
  keyPapers: KeyPaper[];
  timeline: TimelineData[];
  buildInfo: {
    buildTime: number;
    sourceCount: number;
    apiCalls: number;
    maxDepthReached: number;
  };
}

/**
 * Citation Graph Service
 */
export class CitationGraphService {
  private apiCallCount = 0;
  private cache = new Map<string, any>();

  /**
   * Build citation graph from seed papers
   */
  async buildGraph(
    papers: Array<{ doi?: string; title?: string }>,
    options: CitationGraphOptions = {}
  ): Promise<CitationGraphResult> {
    const startTime = Date.now();
    const {
      maxDepth = 2,
      minCitations = 1,
      includeYear = true,
      algorithm = 'pagerank'
    } = options;

    console.log(`🔗 Building citation graph...`);
    console.log(`   Papers: ${papers.length}`);
    console.log(`   Max depth: ${maxDepth}`);
    console.log(`   Min citations: ${minCitations}`);

    const nodes = new Map<string, PaperNode>();
    const edges: CitationEdge[] = [];
    const visited = new Set<string>();

    // Fetch seed papers and build graph
    for (const paper of papers) {
      if (paper.doi) {
        await this.traverseCitations(
          paper.doi,
          nodes,
          edges,
          visited,
          0,
          maxDepth,
          minCitations
        );
      }
    }

    // Convert map to array
    const nodesArray = Array.from(nodes.values());

    // Calculate PageRank
    console.log(`📊 Calculating PageRank for ${nodesArray.length} nodes...`);
    const pageRanks = this.calculatePageRank(nodesArray, edges);

    // Apply PageRank scores
    for (const node of nodesArray) {
      node.pageRank = pageRanks.get(node.id) || 0;
    }

    // Detect communities
    console.log(`🔍 Detecting communities...`);
    const communities = this.detectCommunities(nodesArray, edges);

    // Apply community assignments
    for (const node of nodesArray) {
      node.community = communities.get(node.id) || 0;
    }

    // Calculate centrality
    const centralities = this.calculateCentrality(nodesArray, edges, algorithm);

    // Apply centrality scores
    for (const node of nodesArray) {
      node.centrality = centralities.get(node.id) || 0;
    }

    // Calculate graph metrics
    const metrics = this.calculateGraphMetrics(nodesArray, edges);

    // Identify key papers
    const keyPapers = this.identifyKeyPapers(nodesArray, edges);

    // Analyze timeline
    const timeline = this.analyzeTimeline(nodesArray, edges);

    // Group communities
    const communityGroups = this.groupCommunities(nodesArray, communities);

    const buildTime = Date.now() - startTime;

    return {
      graph: {
        nodes: nodesArray,
        edges
      },
      metrics,
      communities: communityGroups,
      keyPapers,
      timeline,
      buildInfo: {
        buildTime,
        sourceCount: papers.length,
        apiCalls: this.apiCallCount,
        maxDepthReached: maxDepth
      }
    };
  }

  /**
   * Traverse citations recursively
   */
  private async traverseCitations(
    doi: string,
    nodes: Map<string, PaperNode>,
    edges: CitationEdge[],
    visited: Set<string>,
    currentDepth: number,
    maxDepth: number,
    minCitations: number
  ): Promise<void> {
    if (visited.has(doi) || currentDepth > maxDepth) {
      return;
    }

    visited.add(doi);

    // Fetch paper details
    const paper = await this.fetchPaper(doi);
    if (!paper) {
      return;
    }

    // Add node
    if (!nodes.has(doi)) {
      nodes.set(doi, {
        id: doi,
        title: paper.title || 'Unknown',
        authors: paper.authors || [],
        year: paper.year,
        venue: paper.venue,
        citations: paper.citationCount || 0,
        pageRank: 0,
        community: 0,
        centrality: 0,
        abstract: paper.abstract,
        url: paper.url
      });
    }

    // Fetch citations (papers that cite this paper)
    if (currentDepth < maxDepth) {
      const citations = await this.fetchCitations(doi);

      for (const citation of citations) {
        if (!citation.citationDoi) continue;

        // Add edge from citing paper to cited paper
        edges.push({
          source: citation.citationDoi,
          target: doi,
          weight: 1,
          year: citation.year
        });

        // Recursively traverse
        await this.traverseCitations(
          citation.citationDoi,
          nodes,
          edges,
          visited,
          currentDepth + 1,
          maxDepth,
          minCitations
        );
      }
    }
  }

  /**
   * Fetch paper details from Semantic Scholar API
   */
  private async fetchPaper(doi: string): Promise<any> {
    // Check cache
    if (this.cache.has(`paper:${doi}`)) {
      return this.cache.get(`paper:${doi}`);
    }

    try {
      const url = `${SEMANTIC_SCHOLAR_API}/paper/${encodeURIComponent(doi)}`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`Failed to fetch paper: ${doi} (${response.status})`);
        return null;
      }

      const data = await response.json();
      this.cache.set(`paper:${doi}`, data);
      this.apiCallCount++;

      return data;
    } catch (error) {
      console.error(`Error fetching paper ${doi}:`, error.message);
      return null;
    }
  }

  /**
   * Fetch citations from Semantic Scholar API
   */
  private async fetchCitations(doi: string): Promise<any[]> {
    // Check cache
    if (this.cache.has(`citations:${doi}`)) {
      return this.cache.get(`citations:${doi}`);
    }

    try {
      const url = `${SEMANTIC_SCHOLAR_API}/paper/${encodeURIComponent(doi)}/citations`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const citations = data.data || [];
      this.cache.set(`citations:${doi}`, citations);
      this.apiCallCount++;

      return citations;
    } catch (error) {
      console.error(`Error fetching citations for ${doi}:`, error.message);
      return [];
    }
  }

  /**
   * Calculate PageRank for all nodes
   */
  private calculatePageRank(
    nodes: PaperNode[],
    edges: CitationEdge[],
    dampingFactor = 0.85,
    iterations = 100
  ): Map<string, number> {
    let pageRank = new Map<string, number>();

    // Initialize equally
    const initialRank = 1 / nodes.length;
    for (const node of nodes) {
      pageRank.set(node.id, initialRank);
    }

    // Build adjacency map
    const inEdges = new Map<string, string[]>();
    for (const node of nodes) {
      inEdges.set(node.id, []);
    }

    for (const edge of edges) {
      const targets = inEdges.get(edge.target) || [];
      targets.push(edge.source);
      inEdges.set(edge.target, targets);
    }

    // Iterate
    for (let iter = 0; iter < iterations; iter++) {
      const newPageRank = new Map<string, number>();

      for (const node of nodes) {
        let rank = (1 - dampingFactor) / nodes.length;

        const incoming = inEdges.get(node.id) || [];
        for (const sourceId of incoming) {
          const sourceNode = nodes.find(n => n.id === sourceId);
          if (!sourceNode) continue;

          const outDegree = edges.filter(e => e.source === sourceId).length;
          if (outDegree > 0) {
            const sourceRank = pageRank.get(sourceId) || 0;
            rank += dampingFactor * (sourceRank / outDegree);
          }
        }

        newPageRank.set(node.id, rank);
      }

      pageRank = newPageRank;
    }

    return pageRank;
  }

  /**
   * Detect communities using simple label propagation
   */
  private detectCommunities(
    nodes: PaperNode[],
    edges: CitationEdge[]
  ): Map<string, number> {
    const communities = new Map<string, number>();
    const nodeIds = nodes.map(n => n.id);

    // Initialize: each node in its own community
    nodeIds.forEach((id, index) => {
      communities.set(id, index);
    });

    // Build adjacency list
    const adjacency = new Map<string, Set<string>>();
    for (const node of nodes) {
      adjacency.set(node.id, new Set());
    }

    for (const edge of edges) {
      const neighbors = adjacency.get(edge.source) || new Set();
      neighbors.add(edge.target);
      adjacency.set(edge.source, neighbors);

      const targets = adjacency.get(edge.target) || new Set();
      targets.add(edge.source);
      adjacency.set(edge.target, targets);
    }

    // Label propagation (simplified)
    for (let iter = 0; iter < 10; iter++) {
      for (const nodeId of nodeIds) {
        const neighbors = adjacency.get(nodeId) || new Set();
        const neighborCommunities = Array.from(neighbors)
          .map(n => communities.get(n))
          .filter(c => c !== undefined);

        if (neighborCommunities.length > 0) {
          // Most frequent community
          const counts = new Map<number, number>();
          for (const c of neighborCommunities) {
            counts.set(c, (counts.get(c) || 0) + 1);
          }

          const maxCommunity = Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])[0][0];

          communities.set(nodeId, maxCommunity);
        }
      }
    }

    // Renumber communities 0..n-1
    const uniqueCommunities = Array.from(new Set(communities.values()));
    const remap = new Map(
      uniqueCommunities.map((c, i) => [c, i])
    );

    for (const [nodeId, comm] of communities) {
      communities.set(nodeId, remap.get(comm) || 0);
    }

    return communities;
  }

  /**
   * Calculate centrality for all nodes
   */
  private calculateCentrality(
    nodes: PaperNode[],
    edges: CitationEdge[],
    algorithm: string
  ): Map<string, number> {
    const centrality = new Map<string, number>();

    if (algorithm === 'degree') {
      // Degree centrality
      const degree = new Map<string, number>();
      for (const node of nodes) {
        degree.set(node.id, 0);
      }

      for (const edge of edges) {
        degree.set(edge.source, (degree.get(edge.source) || 0) + 1);
        degree.set(edge.target, (degree.get(edge.target) || 0) + 1);
      }

      const maxDegree = Math.max(...degree.values());
      for (const [id, deg] of degree) {
        centrality.set(id, deg / maxDegree);
      }
    } else {
      // Default to PageRank for betweenness
      const pageRanks = this.calculatePageRank(nodes, edges);
      const maxRank = Math.max(...pageRanks.values());
      for (const [id, rank] of pageRanks) {
        centrality.set(id, rank / maxRank);
      }
    }

    return centrality;
  }

  /**
   * Calculate graph metrics
   */
  private calculateGraphMetrics(
    nodes: PaperNode[],
    edges: CitationEdge[]
  ): GraphMetrics {
    const totalNodes = nodes.length;
    const totalEdges = edges.length;

    // Density
    const maxPossibleEdges = totalNodes * (totalNodes - 1);
    const density = maxPossibleEdges > 0 ? totalEdges / maxPossibleEdges : 0;

    // Average degree
    const degreeSum = edges.length * 2; // Each edge contributes to degree of 2 nodes
    const avgDegree = totalNodes > 0 ? degreeSum / totalNodes : 0;

    // Max degree
    const degreeCount = new Map<string, number>();
    for (const edge of edges) {
      degreeCount.set(edge.source, (degreeCount.get(edge.source) || 0) + 1);
      degreeCount.set(edge.target, (degreeCount.get(edge.target) || 0) + 1);
    }
    const maxDegree = degreeCount.size > 0 ? Math.max(...degreeCount.values()) : 0;

    return {
      totalNodes,
      totalEdges,
      density,
      avgClustering: 0, // Placeholder
      avgPathLength: 0, // Placeholder
      maxDegree,
      avgDegree
    };
  }

  /**
   * Identify key papers
   */
  private identifyKeyPapers(
    nodes: PaperNode[],
    edges: CitationEdge[]
  ): KeyPaper[] {
    // Sort by PageRank
    const sorted = [...nodes].sort((a, b) => b.pageRank - a.pageRank);

    return sorted.slice(0, 10).map(node => ({
      id: node.id,
      title: node.title,
      pageRank: node.pageRank,
      citations: node.citations,
      centrality: node.centrality,
      reason: this.generateKeyPaperReason(node, nodes, edges)
    }));
  }

  /**
   * Generate reason for why a paper is key
   */
  private generateKeyPaperReason(
    node: PaperNode,
    allNodes: PaperNode[],
    edges: CitationEdge[]
  ): string {
    const reasons = [];

    // High PageRank
    if (node.pageRank > 0.01) {
      reasons.push('Very influential');
    }

    // Highly cited
    if (node.citations > 100) {
      reasons.push('Highly cited');
    }

    // Central hub
    if (node.centrality > 0.5) {
      reasons.push('Central hub');
    }

    // Recent and impactful
    if (node.year && node.year >= 2020 && node.citations > 50) {
      reasons.push('Recent impact');
    }

    return reasons.length > 0
      ? reasons.join(', ')
      : 'Key research paper';
  }

  /**
   * Analyze timeline
   */
  private analyzeTimeline(
    nodes: PaperNode[],
    edges: CitationEdge[]
  ): TimelineData[] {
    const yearMap = new Map<number, {
      papers: Set<string>;
      citations: number;
      pageRanks: number[];
    }>();

    // Group by year
    for (const node of nodes) {
      if (!node.year) continue;

      const year = node.year;
      if (!yearMap.has(year)) {
        yearMap.set(year, {
          papers: new Set(),
          citations: 0,
          pageRanks: []
        });
      }

      const data = yearMap.get(year)!;
      data.papers.add(node.id);
      data.citations += node.citations;
      data.pageRanks.push(node.pageRank);
    }

    // Convert to array and sort
    const timeline = Array.from(yearMap.entries())
      .map(([year, data]) => ({
        year: parseInt(year),
        papers: data.papers.size,
        citations: data.citations,
        avgPageRank: data.pageRanks.reduce((a, b) => a + b, 0) / data.pageRanks.length,
        emergingTopics: [] // Placeholder
      }))
      .sort((a, b) => a.year - b.year);

    return timeline;
  }

  /**
   * Group communities
   */
  private groupCommunities(
    nodes: PaperNode[],
    communityMap: Map<string, number>
  ): Community[] {
    const communityGroups = new Map<number, PaperNode[]>();

    // Group nodes by community
    for (const node of nodes) {
      const comm = communityMap.get(node.id) || 0;
      if (!communityGroups.has(comm)) {
        communityGroups.set(comm, []);
      }
      communityGroups.get(comm)!.push(node);
    }

    // Convert to community info
    return Array.from(communityGroups.entries()).map(([id, members]) => {
      // Sort by PageRank
      const sorted = members.sort((a, b) => b.pageRank - a.pageRank);

      // Extract top authors
      const authorCount = new Map<string, number>();
      for (const node of members) {
        for (const author of node.authors) {
          authorCount.set(author, (authorCount.get(author) || 0) + 1);
        }
      }

      const topAuthors = Array.from(authorCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(e => e[0]);

      return {
        id,
        size: members.length,
        topPapers: sorted.slice(0, 5).map(n => n.id),
        keywords: [], // Placeholder
        topAuthors
      };
    });
  }

  /**
   * Export graph to JSON
   */
  async exportToJSON(result: CitationGraphResult, outputPath: string): Promise<void> {
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2));
  }

  /**
   * Export graph to interactive HTML
   */
  async exportToHTML(
    result: CitationGraphResult,
    outputPath: string,
    options: { width?: number; height?: number; interactive?: boolean } = {}
  ): Promise<void> {
    const { width = 1200, height = 800, interactive = true } = options;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Citation Graph Visualization</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
        }
        #graph {
            width: ${width}px;
            height: ${height}px;
            border: 1px solid #ccc;
            margin: 20px auto;
        }
        .info {
            max-width: ${width}px;
            margin: 20px auto;
            padding: 20px;
            background: #f5f5f5;
            border-radius: 5px;
        }
        .node {
            stroke: #fff;
            stroke-width: 1.5px;
        }
        .link {
            stroke: #999;
            stroke-opacity: 0.6;
        }
        .tooltip {
            position: absolute;
            padding: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: #fff;
            border-radius: 4px;
            pointer-events: none;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <h1>Citation Graph Visualization</h1>

    <div class="info">
        <h2>Graph Metrics</h2>
        <ul>
            <li>Total Papers: ${result.metrics.totalNodes}</li>
            <li>Total Citations: ${result.metrics.totalEdges}</li>
            <li>Network Density: ${result.metrics.density.toFixed(4)}</li>
            <li>Average Degree: ${result.metrics.avgDegree.toFixed(2)}</li>
        </ul>

        <h2>Key Papers</h2>
        <ol>
            ${result.keyPapers.slice(0, 5).map(p => `
                <li>
                    <strong>${p.title}</strong><br>
                    PageRank: ${p.pageRank.toFixed(4)} | Citations: ${p.citations}<br>
                    <em>${p.reason}</em>
                </li>
            `).join('')}
        </ol>
    </div>

    <div id="graph"></div>

    <script>
        const graph = ${JSON.stringify(result.graph, null, 2)};

        // Color scale for communities
        const color = d3.scaleOrdinal(d3.schemeCategory10);

        // Create SVG
        const svg = d3.select("#graph")
            .append("svg")
            .attr("width", ${width})
            .attr("height", ${height})
            .call(d3.zoom().on("zoom", (event) => {
                g.attr("transform", event.transform);
            }))
            .append("g");

        const g = svg.append("g");

        // Create force simulation
        const simulation = d3.forceSimulation(graph.nodes)
            .force("link", d3.forceLink(graph.edges).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(${width / 2}, ${height / 2}))
            .force("collision", d3.forceCollide().radius(20));

        // Create links
        const link = g.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(graph.edges)
            .join("line")
            .attr("class", "link")
            .attr("stroke-width", d => Math.sqrt(d.weight));

        // Create nodes
        const node = g.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(graph.nodes)
            .join("circle")
            .attr("class", "node")
            .attr("r", d => 5 + d.pageRank * 5000)
            .attr("fill", d => color(d.community))
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        // Add tooltips
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        node.on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(\`
                <strong>\${d.title}</strong><br/>
                Authors: \${d.authors.slice(0, 3).join(", ")}<br/>
                Year: \${d.year || "N/A"}<br/>
                Citations: \${d.citations}<br/>
                PageRank: \${d.pageRank.toFixed(4)}
            \`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

        // Update positions
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
}
