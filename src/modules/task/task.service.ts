import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma, TaskPriority, TaskStatus } from '@prisma/client';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(private prisma: PrismaService) {}

  async create(createTaskDto: CreateTaskDto, userId: string) {
    this.logger.debug(`Creating task for user ${userId}: title="${createTaskDto.title}", priority=${createTaskDto.priority || TaskPriority.MEDIUM}`);
    
    try {
    const task = await this.prisma.task.create({
      data: {
        title: createTaskDto.title,
        description: createTaskDto.description,
        priority: createTaskDto.priority || TaskPriority.MEDIUM,
        userId,
      },
    });
      
      this.logger.log(`Task created successfully: ${task.id} - "${task.title}" for user ${userId}`);
    return task;
    } catch (error: any) {
      this.logger.error(`Failed to create task for user ${userId}: ${error?.message || 'Unknown error'}`, error?.stack);
      throw error;
    }
  }

  async findAll(userId: string, status?: TaskStatus, priority?: TaskPriority) {
    this.logger.debug(`Finding tasks for user ${userId} with filters: status=${status || 'all'}, priority=${priority || 'all'}`);
    
    const where: Prisma.TaskWhereInput = {
      userId,
    };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    try {
    const tasks = await this.prisma.task.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

      this.logger.debug(`Found ${tasks.length} task(s) for user ${userId}`);
    return tasks;
    } catch (error: any) {
      this.logger.error(`Failed to find tasks for user ${userId}: ${error?.message || 'Unknown error'}`, error?.stack);
      throw error;
    }
  }

  async findOne(id: string, userId: string) {
    this.logger.debug(`Finding task ${id} for user ${userId}`);
    
    try {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });
    
    if (!task) {
        this.logger.warn(`Task not found: ${id} for user ${userId}`);
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    
    if (task.userId !== userId) {
        this.logger.warn(`Access denied: User ${userId} attempted to access task ${id} (${task.title}) owned by ${task.userId}`);
      throw new ForbiddenException('You do not have access to this task');
    }
    
      this.logger.debug(`Task ${id} found successfully for user ${userId}`);
    return task;
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Failed to find task ${id} for user ${userId}: ${error?.message || 'Unknown error'}`, error?.stack);
      throw error;
    }
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string) {
    this.logger.debug(`Updating task ${id} for user ${userId} with data: ${JSON.stringify(updateTaskDto)}`);
    
    await this.findOne(id, userId);

    const updateData: Prisma.TaskUpdateInput = {};
    if (updateTaskDto.title !== undefined) updateData.title = updateTaskDto.title;
    if (updateTaskDto.description !== undefined) updateData.description = updateTaskDto.description;
    if (updateTaskDto.priority !== undefined) updateData.priority = updateTaskDto.priority;

    try {
    const task = await this.prisma.task.update({
      where: { id },
      data: updateData,
    });

      this.logger.log(`Task ${id} updated successfully by user ${userId}`);
    return task;
    } catch (error: any) {
      this.logger.error(`Failed to update task ${id} for user ${userId}: ${error?.message || 'Unknown error'}`, error?.stack);
      throw error;
    }
  }

  async toggleComplete(id: string, userId: string) {
    this.logger.debug(`Toggling completion status for task ${id} by user ${userId}`);
    
    const task = await this.findOne(id, userId);
    
    const updateData: Prisma.TaskUpdateInput = {};
    const newStatus = task.status === TaskStatus.PENDING ? TaskStatus.COMPLETED : TaskStatus.PENDING;
    
    if (task.status === TaskStatus.PENDING) {
      updateData.status = TaskStatus.COMPLETED;
      updateData.completedAt = new Date();
    } else {
      updateData.status = TaskStatus.PENDING;
      updateData.completedAt = null;
    }

    this.logger.debug(`Task ${id} status changing from ${task.status} to ${newStatus}`);

    try {
    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: updateData,
    });

      this.logger.log(`Task ${id} status toggled to ${newStatus} by user ${userId}`);
    return updatedTask;
    } catch (error: any) {
      this.logger.error(`Failed to toggle task ${id} for user ${userId}: ${error?.message || 'Unknown error'}`, error?.stack);
      throw error;
    }
  }

  async getStats(userId: string) {
    this.logger.debug(`Calculating statistics for user ${userId}`);
    
    try {
    const [total, completed, pending, highPriority] = await Promise.all([
      this.prisma.task.count({ where: { userId } }),
      this.prisma.task.count({ where: { userId, status: TaskStatus.COMPLETED } }),
      this.prisma.task.count({ where: { userId, status: TaskStatus.PENDING } }),
      this.prisma.task.count({
        where: {
          userId,
          priority: TaskPriority.HIGH,
          status: TaskStatus.PENDING,
        },
      }),
    ]);

      const stats = {
      total,
      completed,
      pending,
      highPriority,
    };

      this.logger.debug(`Stats calculated for user ${userId}: ${JSON.stringify(stats)}`);
      return stats;
    } catch (error: any) {
      this.logger.error(`Failed to get stats for user ${userId}: ${error?.message || 'Unknown error'}`, error?.stack);
      throw error;
    }
  }

  async remove(id: string, userId: string) {
    this.logger.debug(`Removing task ${id} for user ${userId}`);
    
    await this.findOne(id, userId);
    
    try {
    await this.prisma.task.delete({
      where: { id },
    });
      this.logger.log(`Task ${id} deleted successfully by user ${userId}`);
    } catch (error: any) {
      this.logger.error(`Failed to delete task ${id} for user ${userId}: ${error?.message || 'Unknown error'}`, error?.stack);
      throw error;
    }
  }
}
