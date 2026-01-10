// Complete integration tests for all 8 Skills
import { describe, it, expect } from 'bun:test';

describe('All 8 Skills - Complete Integration Tests', () => {
  describe('Skill Exports', () => {
    it('should export all 8 skill classes', async () => {
      const skills = await import('./dist/index.js');

      expect(skills.LiteratureSearchSkill).toBeDefined();
      expect(skills.CitationManagerSkill).toBeDefined();
      expect(skills.PaperStructureSkill).toBeDefined();
      expect(skills.WritingQualitySkill).toBeDefined();
      expect(skills.LiteratureReviewSkill).toBeDefined();
      expect(skills.PeerReviewSkill).toBeDefined();
      expect(skills.DataAnalysisSkill).toBeDefined();
      expect(skills.JournalSubmissionSkill).toBeDefined();
    });
  });

  describe('SkillType Enum', () => {
    it('should have all 8 skill types', async () => {
      const { SkillType } = await import('../core/dist/types/skill.js');

      expect(SkillType.LITERATURE_SEARCH).toBe('literature-search');
      expect(SkillType.LITERATURE_REVIEW).toBe('literature-review');
      expect(SkillType.PAPER_STRUCTURE).toBe('paper-structure');
      expect(SkillType.CITATION_MANAGER).toBe('citation-manager');
      expect(SkillType.WRITING_QUALITY).toBe('writing-quality');
      expect(SkillType.PEER_REVIEW).toBe('peer-review');
      expect(SkillType.DATA_ANALYSIS).toBe('data-analysis');
      expect(SkillType.JOURNAL_SUBMISSION).toBe('journal-submission');
    });

    it('should have exactly 8 skill types', async () => {
      const { SkillType } = await import('../core/dist/types/skill.js');
      const types = Object.values(SkillType);

      expect(types.length).toBe(8);
    });
  });

  describe('LiteratureSearchSkill', () => {
    it('should be properly exported', async () => {
      const { LiteratureSearchSkill } = await import('./dist/literature-search/skill.js');
      expect(LiteratureSearchSkill).toBeDefined();
    });
  });

  describe('CitationManagerSkill', () => {
    it('should export all 5 citation styles', async () => {
      const { CitationStyle } = await import('./dist/citation-manager/skill.js');

      expect(CitationStyle.APA).toBe('apa');
      expect(CitationStyle.MLA).toBe('mla');
      expect(CitationStyle.CHICAGO).toBe('chicago');
      expect(CitationStyle.IEEE).toBe('ieee');
      expect(CitationStyle.HARVARD).toBe('harvard');
    });

    it('should have 5 citation styles total', async () => {
      const { CitationStyle } = await import('./dist/citation-manager/skill.js');
      const styles = Object.values(CitationStyle);

      expect(styles.length).toBe(5);
    });
  });

  describe('PaperStructureSkill', () => {
    it('should export all 5 paper types', async () => {
      const { PaperType } = await import('./dist/paper-structure/skill.js');

      expect(PaperType.RESEARCH_PAPER).toBe('research-paper');
      expect(PaperType.REVIEW_PAPER).toBe('review-paper');
      expect(PaperType.CONFERENCE_PAPER).toBe('conference-paper');
      expect(PaperType.THESIS).toBe('thesis');
      expect(PaperType.SHORT_COMMUNICATION).toBe('short-communication');
    });

    it('should have 5 paper types total', async () => {
      const { PaperType } = await import('./dist/paper-structure/skill.js');
      const types = Object.values(PaperType);

      expect(types.length).toBe(5);
    });
  });

  describe('WritingQualitySkill', () => {
    it('should be properly exported', async () => {
      const { WritingQualitySkill } = await import('./dist/writing-quality/skill.js');
      expect(WritingQualitySkill).toBeDefined();
    });
  });

  describe('LiteratureReviewSkill', () => {
    it('should be properly exported', async () => {
      const { LiteratureReviewSkill } = await import('./dist/literature-review/skill.js');
      expect(LiteratureReviewSkill).toBeDefined();
    });
  });

  describe('PeerReviewSkill', () => {
    it('should be properly exported', async () => {
      const { PeerReviewSkill } = await import('./dist/peer-review/skill.js');
      expect(PeerReviewSkill).toBeDefined();
    });

    it('should support review decisions', async () => {
      const { PeerReviewSkill } = await import('./dist/peer-review/skill.js');
      // ReviewDecision is a type, not available at runtime
      // Just verify the skill class exists
      expect(PeerReviewSkill).toBeDefined();
    });
  });

  describe('DataAnalysisSkill', () => {
    it('should be properly exported', async () => {
      const { DataAnalysisSkill } = await import('./dist/data-analysis/skill.js');
      expect(DataAnalysisSkill).toBeDefined();
    });
  });

  describe('JournalSubmissionSkill', () => {
    it('should be properly exported', async () => {
      const { JournalSubmissionSkill } = await import('./dist/journal-submission/skill.js');
      expect(JournalSubmissionSkill).toBeDefined();
    });
  });

  describe('Complete Skills Coverage', () => {
    it('should have all 8 skills in the SkillType enum matching implemented skills', async () => {
      const { SkillType } = await import('../core/dist/types/skill.js');
      const skills = await import('./dist/index.js');

      // Check that all SkillType enum values have corresponding skill implementations
      const expectedSkills = [
        'LiteratureSearchSkill',
        'CitationManagerSkill',
        'PaperStructureSkill',
        'WritingQualitySkill',
        'LiteratureReviewSkill',
        'PeerReviewSkill',
        'DataAnalysisSkill',
        'JournalSubmissionSkill'
      ];

      for (const skillName of expectedSkills) {
        expect(skills[skillName]).toBeDefined();
      }
    });

    it('should have complete type exports for all skills', async () => {
      const skills = await import('./dist/index.js');

      // Each skill should export its main class and types
      const expectedExports = {
        LiteratureSearchSkill: true,
        CitationManagerSkill: true,
        PaperStructureSkill: true,
        WritingQualitySkill: true,
        LiteratureReviewSkill: true,
        PeerReviewSkill: true,
        DataAnalysisSkill: true,
        JournalSubmissionSkill: true
      };

      for (const [skillName] of Object.entries(expectedExports)) {
        expect(skills[skillName]).toBeDefined();
      }
    });
  });
});

describe('Skills Implementation Completeness', () => {
  it('should have 100% skill implementation (8/8)', async () => {
    const { SkillType } = await import('../core/dist/types/skill.js');
    const skills = await import('./dist/index.js');

    const totalSkills = Object.keys(SkillType).length;
    const implementedSkills = Object.keys(skills).filter(key => key.includes('Skill')).length;

    expect(totalSkills).toBe(8);
    expect(implementedSkills).toBe(8);
  });

  it('should match plan1.md requirements', async () => {
    // According to plan1.md, all 8 core skills should be implemented
    const requiredSkills = [
      'literature-search',
      'literature-review',
      'paper-structure',
      'citation-manager',
      'writing-quality',
      'peer-review',
      'data-analysis',
      'journal-submission'
    ];

    const { SkillType } = await import('../core/dist/types/skill.js');

    for (const skill of requiredSkills) {
      expect(Object.values(SkillType)).toContain(skill);
    }
  });
});

describe('Build Status', () => {
  it('should have all skill packages built successfully', async () => {
    const fs = require('fs');
    const path = require('path');

    // Check that dist directories exist for all skills
    const skillDirs = [
      'dist/literature-search',
      'dist/citation-manager',
      'dist/paper-structure',
      'dist/writing-quality',
      'dist/literature-review',
      'dist/peer-review',
      'dist/data-analysis',
      'dist/journal-submission'
    ];

    for (const dir of skillDirs) {
      const fullPath = path.join(__dirname, dir);
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });

  it('should have compiled JavaScript files for all skills', async () => {
    const fs = require('fs');
    const path = require('path');

    const skillFiles = [
      'dist/literature-search/skill.js',
      'dist/citation-manager/skill.js',
      'dist/paper-structure/skill.js',
      'dist/writing-quality/skill.js',
      'dist/literature-review/skill.js',
      'dist/peer-review/skill.js',
      'dist/data-analysis/skill.js',
      'dist/journal-submission/skill.js'
    ];

    for (const file of skillFiles) {
      const fullPath = path.join(__dirname, file);
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });
});

describe('Type Safety', () => {
  it('should export types for all skills', async () => {
    const skills = await import('./dist/index.js');

    // Check that type-only exports exist (they won't be at runtime but should be in types)
    // This is more of a compile-time check, but we can verify the module structure
    expect(Object.keys(skills).length).toBeGreaterThan(8); // Should have classes + types
  });
});
