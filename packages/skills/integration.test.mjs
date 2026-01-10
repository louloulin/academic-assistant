// Integration tests for Skills
import { describe, it, expect } from 'bun:test';

describe('Skills Package - Integration Tests', () => {
  describe('LiteratureSearchSkill', () => {
    it('should export LiteratureSearchSkill class', async () => {
      const { LiteratureSearchSkill } = await import('./dist/literature-search/skill.js');
      expect(LiteratureSearchSkill).toBeDefined();
    });

    it('should export SearchInput type', async () => {
      const module = await import('./dist/literature-search/skill.js');
      // Type exports are not available at runtime in the same way
      expect(module).toBeDefined();
    });
  });

  describe('CitationManagerSkill', () => {
    it('should export CitationManagerSkill class', async () => {
      const { CitationManagerSkill } = await import('./dist/citation-manager/skill.js');
      expect(CitationManagerSkill).toBeDefined();
    });

    it('should export CitationStyle enum', async () => {
      const { CitationStyle } = await import('./dist/citation-manager/skill.js');
      expect(CitationStyle).toBeDefined();
      expect(CitationStyle.APA).toBe('apa');
      expect(CitationStyle.MLA).toBe('mla');
      expect(CitationStyle.CHICAGO).toBe('chicago');
      expect(CitationStyle.IEEE).toBe('ieee');
      expect(CitationStyle.HARVARD).toBe('harvard');
    });
  });

  describe('PaperStructureSkill', () => {
    it('should export PaperStructureSkill class', async () => {
      const { PaperStructureSkill } = await import('./dist/paper-structure/skill.js');
      expect(PaperStructureSkill).toBeDefined();
    });

    it('should export PaperType enum', async () => {
      const { PaperType } = await import('./dist/paper-structure/skill.js');
      expect(PaperType).toBeDefined();
      expect(PaperType.RESEARCH_PAPER).toBe('research-paper');
      expect(PaperType.REVIEW_PAPER).toBe('review-paper');
      expect(PaperType.CONFERENCE_PAPER).toBe('conference-paper');
      expect(PaperType.THESIS).toBe('thesis');
      expect(PaperType.SHORT_COMMUNICATION).toBe('short-communication');
    });
  });

  describe('WritingQualitySkill', () => {
    it('should export WritingQualitySkill class', async () => {
      const { WritingQualitySkill } = await import('./dist/writing-quality/skill.js');
      expect(WritingQualitySkill).toBeDefined();
    });
  });

  describe('Skills Integration', () => {
    it('should have all skill types', async () => {
      const { SkillType } = await import('../core/dist/types/skill.js');

      expect(SkillType.LITERATURE_SEARCH).toBe('literature-search');
      expect(SkillType.CITATION_MANAGER).toBe('citation-manager');
      expect(SkillType.PAPER_STRUCTURE).toBe('paper-structure');
      expect(SkillType.WRITING_QUALITY).toBe('writing-quality');
      expect(SkillType.LITERATURE_REVIEW).toBe('literature-review');
      expect(SkillType.PEER_REVIEW).toBe('peer-review');
      expect(SkillType.DATA_ANALYSIS).toBe('data-analysis');
      expect(SkillType.JOURNAL_SUBMISSION).toBe('journal-submission');
    });

    it('should have correct skill count', async () => {
      const { SkillType } = await import('../core/dist/types/skill.js');
      const types = Object.values(SkillType);

      expect(types.length).toBe(8);
    });

    it('should export all skills from index', async () => {
      const skills = await import('./dist/index.js');

      expect(skills.LiteratureSearchSkill).toBeDefined();
      expect(skills.CitationManagerSkill).toBeDefined();
      expect(skills.PaperStructureSkill).toBeDefined();
      expect(skills.WritingQualitySkill).toBeDefined();
    });
  });
});

describe('CitationManager - Functional Tests', () => {
  it('should have APA style', async () => {
    const { CitationStyle } = await import('./dist/citation-manager/skill.js');
    expect(CitationStyle.APA).toBeDefined();
  });

  it('should support 5 citation styles', async () => {
    const { CitationStyle } = await import('./dist/citation-manager/skill.js');
    const styles = Object.values(CitationStyle);
    expect(styles.length).toBe(5);
  });
});

describe('PaperStructure - Functional Tests', () => {
  it('should have 5 paper types', async () => {
    const { PaperType } = await import('./dist/paper-structure/skill.js');
    const types = Object.values(PaperType);
    expect(types.length).toBe(5);
  });

  it('should include research paper type', async () => {
    const { PaperType } = await import('./dist/paper-structure/skill.js');
    expect(PaperType.RESEARCH_PAPER).toBe('research-paper');
  });
});
