export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum TaskStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
}

export class Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  userId: string;
  createdAt: Date;
  completedAt?: Date;

  constructor(
    title: string,
    description: string,
    userId: string,
    priority: TaskPriority = TaskPriority.MEDIUM,
  ) {
    this.id = Math.random().toString(36).substring(2, 15);
    this.title = title;
    this.description = description;
    this.priority = priority;
    this.status = TaskStatus.PENDING;
    this.userId = userId;
    this.createdAt = new Date();
  }
}
