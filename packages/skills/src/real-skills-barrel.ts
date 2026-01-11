/**
 * Real Skills - 基于 Claude Agent SDK 的真实实现
 *
 * 这些 Skills 使用 Claude Agent SDK 的 query() 函数、AgentDefinition 和工具系统
 * 完全无 Mock，真实调用 Claude API
 */

// P0 Skills - 最高优先级
export { PDFAnalyzerSkill, pdfAnalyzerSkill } from './pdf-analyzer/real-skill';
export type { PDFAnalyzeInput, PDFAnalysisResult, PDFMetadata, PDFSection, PDFTable, PDFFormula, PDFImage } from './pdf-analyzer/real-skill';

export { CitationGraphSkill, citationGraphSkill } from './citation-graph/real-skill';
export type { CitationGraphInput, CitationNetworkAnalysis, GraphNode, GraphEdge } from './citation-graph/real-skill';

export { ConversationalEditorSkill, conversationalEditorSkill } from './conversational-editor/real-skill';
export type { ConversationalEditInput, ConversationalResponse, EditSuggestion } from './conversational-editor/real-skill';

export { ZoteroIntegratorSkill, zoteroIntegratorSkill } from './zotero-integrator/real-skill';
export type { ZoteroIntegratorInput, ZoteroIntegrationResult, ZoteroItem, ZoteroCollection, ZoteroLibrary } from './zotero-integrator/real-skill';

// 已有的 Real Skills
export { LiteratureSearchSkill, literatureSearchSkill } from './literature-search/real-skill';
export type { SearchInput, Paper } from './literature-search/real-skill';

// P1 Skills - 高优先级
export { AcademicPolisherSkill, academicPolisherSkill } from './academic-polisher/real-skill';
export type { PolishInput, PolishResult, PolishSuggestion } from './academic-polisher/real-skill';

export { VersionControlSkill, versionControlSkill } from './version-control/real-skill';
export type { VersionControlInput, VersionControlResult } from './version-control/real-skill';

export { ExperimentRunnerSkill, experimentRunnerSkill } from './experiment-runner/real-skill';
export type { ExperimentInput, ExperimentResult } from './experiment-runner/real-skill';

export { JournalMatchmakerSkill, journalMatchmakerSkill } from './journal-matchmaker/real-skill';
export type { JournalMatchInput, JournalMatchResult, JournalRecommendation } from './journal-matchmaker/real-skill';

export { DataAnalyzerSkill, dataAnalyzerSkill } from './data-analyzer-real/real-skill';
export type { DataAnalysisInput, AnalysisPlan, StatisticalMethod, VisualizationSuggestion } from './data-analyzer-real/real-skill';

export { PlagiarismCheckerSkill, plagiarismCheckerSkill } from './plagiarism-checker-real/real-skill';
export type { PlagiarismCheckInput, PlagiarismCheckResult, SimilarityMatch, MissingCitation } from './plagiarism-checker-real/real-skill';

// P2 Skills - 中等优先级
export { CreativeExpanderSkill, creativeExpanderSkill } from './creative-expander/real-skill';
export type { CreativeExpandInput, ExpansionResult } from './creative-expander/real-skill';

export { PersonalizedRecommenderSkill, personalizedRecommenderSkill } from './personalized-recommender/real-skill';
export type { RecommenderInput, RecommendationResult } from './personalized-recommender/real-skill';

export { MultilingualWriterSkill, multilingualWriterSkill } from './multilingual-writer/real-skill';
export type { MultilingualWriteInput, MultilingualResult } from './multilingual-writer/real-skill';
