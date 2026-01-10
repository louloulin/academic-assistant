// Task type definitions
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum TaskPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  URGENT = 4
}

export interface Task<T = unknown, U = unknown> {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  input: T;
  output?: U;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  assignedAgent?: string;
  requiredSkills?: string[];
}

export interface TaskResult<T = unknown> {
  taskId: string;
  success: boolean;
  data?: T;
  error?: string;
  executionTime: number;
}
