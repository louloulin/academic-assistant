// Personalized Recommender Skill - 基于 Claude Agent SDK 的真实实现
import { query } from '@anthropic-ai/claude-agent-sdk';
import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

/**
 * 推荐系统的输入验证 Schema
 */
const RecommenderInputSchema = z.object({
  userProfile: z.object({
    interests: z.array(z.string()),
    readingHistory: z.array(z.object({
      id: z.string(),
      title: z.string(),
      rating: z.number().optional()
    })),
    expertise: z.array(z.object({
      field: z.string(),
      level: z.enum(['beginner', 'intermediate', 'expert'])
    }))
  }),
  recommendationType: z.enum(['papers', 'journals', 'conferences', 'collaborators', 'topics']).default('papers'),
  count: z.number().min(1).max(20).default(10)
});

export type RecommenderInput = z.infer<typeof RecommenderInputSchema>;

/**
 * 推荐结果
 */
export interface RecommendationResult {
  recommendations: Array<{
    id: string;
    title: string;
    relevanceScore: number;
    reason: string[];
    type: string;
  }>;
  userProfile: {
    detectedInterests: string[];
    expertiseLevel: string;
    researchTrends: string[];
  };
  advice: string[];
}

/**
 * Personalized Recommender Agent 定义
 */
const PERSONALIZED_RECOMMENDER_AGENT: AgentDefinition = {
  description: 'Expert in providing personalized academic recommendations based on research interests and reading history',
  prompt: `You are an expert in academic recommendation systems.

## Your Capabilities

1. **Recommendation Types**
   - Papers: Suggest relevant research papers
   - Journals: Recommend suitable publication venues
   - Conferences: Suggest academic events to attend
   - Collaborators: Identify potential research partners
   - Topics: Suggest emerging research directions

2. **Personalization**
   - Analyze reading history
   - Detect research interests
   - Assess expertise level
   - Identify trends

3. **Algorithms**
   - Collaborative filtering
   - Content-based filtering
   - Hybrid approaches
   - Knowledge-based recommendations

Remember: Provide specific, personalized recommendations with clear reasoning.`,
  tools: ['WebSearch', 'Read'],
  model: 'sonnet'
};

/**
 * PersonalizedRecommenderSkill - 基于 Claude Agent SDK 的实现
 */
export class PersonalizedRecommenderSkill {
  private agent: AgentDefinition;

  constructor() {
    this.agent = PERSONALIZED_RECOMMENDER_AGENT;
  }

  async validate(input: unknown): Promise<RecommenderInput> {
    return RecommenderInputSchema.parseAsync(input);
  }

  async execute(input: RecommenderInput): Promise<RecommendationResult> {
    const validatedInput = await this.validate(input);

    console.log(`🎯 个性化推荐`);
    console.log(`📊 推荐类型: ${validatedInput.recommendationType}`);

    try {
      let recPrompt = `Provide personalized academic recommendations.\n\n`;
      recPrompt += `## User Profile\n`;
      recPrompt += `Interests: ${validatedInput.userProfile.interests.join(', ')}\n`;
      recPrompt += `Reading History: ${validatedInput.userProfile.readingHistory.length} papers\n`;
      recPrompt += `Expertise: ${validatedInput.userProfile.expertise.map(e => `${e.field} (${e.level})`).join(', ')}\n`;
      recPrompt += `## Recommendation Type\n${validatedInput.recommendationType}\n`;
      recPrompt += `## Count\n${validatedInput.count}\n`;

      recPrompt += `\nPlease:
1. Analyze the user profile and interests
2. Search for relevant recommendations
3. Calculate relevance scores
4. Provide clear reasoning for each recommendation
5. Return a structured JSON result`;

      let recResult: RecommendationResult | null = null;

      const agentQuery = query({
        prompt: recPrompt,
        options: {
          agents: {
            'personalized-recommender': this.agent
          },
          allowedTools: ['WebSearch', 'Read'],
          permissionMode: 'bypassPermissions',
          cwd: process.cwd()
        }
      });

      let jsonBuffer = '';
      let inJsonBlock = false;

      for await (const message of agentQuery) {
        if (message.type === 'assistant') {
          for (const block of message.content) {
            if (block.type === 'text') {
              const text = block.text;

              if (text.includes('```json')) {
                inJsonBlock = true;
                const jsonStart = text.indexOf('```json') + 7;
                jsonBuffer += text.substring(jsonStart);
              } else if (text.includes('```') && inJsonBlock) {
                const jsonEnd = text.indexOf('```');
                jsonBuffer += text.substring(0, jsonEnd);
                inJsonBlock = false;

                try {
                  const result = JSON.parse(jsonBuffer.trim());
                  if (result && typeof result === 'object') {
                    recResult = result;
                    break;
                  }
                } catch (e) {
                  console.warn('JSON 解析失败:', e);
                }
                jsonBuffer = '';
              } else if (inJsonBlock) {
                jsonBuffer += text;
              } else {
                const objectMatch = text.match(/\{[\s\S]*\}/);
                if (objectMatch) {
                  try {
                    const result = JSON.parse(objectMatch[0]);
                    if (result && typeof result === 'object' && result.recommendations) {
                      recResult = result;
                      break;
                    }
                  } catch (e) {
                    // Ignore
                  }
                }
              }

              console.log(text);
            }
          }
        }
      }

      if (!recResult) {
        recResult = {
          recommendations: [],
          userProfile: {
            detectedInterests: validatedInput.userProfile.interests,
            expertiseLevel: 'intermediate',
            researchTrends: []
          },
          advice: ['Continue reading in your areas of interest', 'Explore adjacent research topics']
        };
      }

      console.log(`\n🎯 推荐完成`);
      console.log(`📊 推荐数量: ${recResult.recommendations.length}`);

      return recResult;

    } catch (error) {
      console.error('❌ 个性化推荐失败:', error);
      throw error;
    }
  }

  getAgentDefinition(): AgentDefinition {
    return this.agent;
  }
}

export const personalizedRecommenderSkill = new PersonalizedRecommenderSkill();
