import { TaskPriority } from '@prisma/client';

export class CreateTaskDto {
  title: string;
  description: string;
  priority?: TaskPriority;
}
