// Skill type definitions
export enum SkillType {
  LITERATURE_SEARCH = 'literature-search',
  LITERATURE_REVIEW = 'literature-review',
  PAPER_STRUCTURE = 'paper-structure',
  CITATION_MANAGER = 'citation-manager',
  WRITING_QUALITY = 'writing-quality',
  PEER_REVIEW = 'peer-review',
  DATA_ANALYSIS = 'data-analysis',
  JOURNAL_SUBMISSION = 'journal-submission'
}

export interface SkillConfig {
  id: string;
  type: SkillType;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  dependencies?: SkillType[];
}

export interface SkillMetadata {
  author: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}
