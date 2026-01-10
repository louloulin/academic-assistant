// 真实 Skills 导出 - 基于 Claude Agent SDK
export { LiteratureSearchSkill, literatureSearchSkill, SearchInput, Paper } from './literature-search/real-skill';
export { CitationManagerSkill, citationManagerSkill, CitationInput, FormattedCitations } from './citation-manager/real-skill';

// 重新导出所有 Skills
export * from '../index';
