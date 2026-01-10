// Skill interface
import type { Task, SkillConfig } from '../types/skill.js';

export interface ISkill {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly config: SkillConfig;

  canHandle<T>(task: Task<T>): boolean;
  validate<T>(input: T): Promise<boolean>;
  execute<T, U>(task: Task<T, U>): Promise<Task<T, U>>;
}

export interface ISkillRegistry {
  register(skill: ISkill): void;
  unregister(skillId: string): void;
  get(skillId: string): ISkill | undefined;
  list(): ISkill[];
  findForTask<T>(task: Task<T>): ISkill[];
}
