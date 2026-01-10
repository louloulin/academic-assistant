// Event Bus interface
export type EventHandler<T = unknown> = (data: T) => Promise<void> | void;

export interface IEventBus {
  subscribe<T = unknown>(event: string, handler: EventHandler<T>): () => void;
  unsubscribe(event: string, handler: EventHandler): void;
  publish<T = unknown>(event: string, data: T): Promise<void>;
  clear(): void;
  clearEvent(event: string): void;
}

export interface IEventEmitter {
  on<T = unknown>(event: string, handler: EventHandler<T>): this;
  off<T = unknown>(event: string, handler: EventHandler<T>): this;
  emit<T = unknown>(event: string, data: T): Promise<void>;
}
