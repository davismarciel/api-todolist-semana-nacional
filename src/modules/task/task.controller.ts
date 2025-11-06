import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, Logger } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TaskStatus, TaskPriority } from '@prisma/client';

@Controller('task')
@UseGuards(JwtAuthGuard)
export class TaskController {
  private readonly logger = new Logger(TaskController.name);

  constructor(private readonly taskService: TaskService) {}

  @Post()
  async create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    this.logger.log(`Creating task for user ${req.user.id} (${req.user.email}): "${createTaskDto.title}" - Priority: ${createTaskDto.priority || 'MEDIUM'}`);
    
    try {
      const task = await this.taskService.create(createTaskDto, req.user.id);
      this.logger.log(`Task created successfully: ${task.id} - "${task.title}" by user ${req.user.id} (${req.user.email})`);
      return task;
    } catch (error: any) {
      this.logger.error(`Failed to create task for user ${req.user.id}: ${error?.message || 'Unknown error'}`, error?.stack);
      throw error;
    }
  }

  @Get()
  async findAll(
    @Request() req,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: TaskPriority,
  ) {
    const filters = { status: status || 'all', priority: priority || 'all' };
    this.logger.debug(`Fetching tasks for user ${req.user.id} (${req.user.email}) with filters: ${JSON.stringify(filters)}`);
    
    try {
    const tasks = await this.taskService.findAll(req.user.id, status, priority);
      this.logger.log(`Found ${tasks.length} task(s) for user ${req.user.id} (${req.user.email})`);
    return tasks;
    } catch (error: any) {
      this.logger.error(`Failed to fetch tasks for user ${req.user.id}: ${error?.message || 'Unknown error'}`, error?.stack);
      throw error;
    }
  }

  @Get('stats')
  async getStats(@Request() req) {
    this.logger.debug(`Fetching statistics for user ${req.user.id} (${req.user.email})`);
    
    try {
    const stats = await this.taskService.getStats(req.user.id);
      this.logger.log(`Stats retrieved for user ${req.user.id} (${req.user.email}): ${JSON.stringify(stats)}`);
    return stats;
    } catch (error: any) {
      this.logger.error(`Failed to fetch stats for user ${req.user.id}: ${error?.message || 'Unknown error'}`, error?.stack);
      throw error;
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    this.logger.debug(`Fetching task ${id} for user ${req.user.id}`);
    
    try {
      const task = await this.taskService.findOne(id, req.user.id);
      this.logger.debug(`Task ${id} retrieved successfully for user ${req.user.id}`);
      return task;
    } catch (error) {
      this.logger.warn(`Failed to fetch task ${id} for user ${req.user.id}: ${error.message}`);
      throw error;
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @Request() req) {
    this.logger.log(`Updating task ${id} for user ${req.user.id}`);
    
    try {
      const task = await this.taskService.update(id, updateTaskDto, req.user.id);
      this.logger.log(`Task ${id} updated successfully by user ${req.user.id}`);
      return task;
    } catch (error) {
      this.logger.error(`Failed to update task ${id} for user ${req.user.id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Patch(':id/toggle')
  async toggleComplete(@Param('id') id: string, @Request() req) {
    this.logger.log(`Toggling completion status for task ${id} by user ${req.user.id}`);
    
    try {
      const task = await this.taskService.toggleComplete(id, req.user.id);
      this.logger.log(`Task ${id} status toggled to ${task.status} by user ${req.user.id}`);
      return task;
    } catch (error) {
      this.logger.error(`Failed to toggle task ${id} for user ${req.user.id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    this.logger.log(`Deleting task ${id} for user ${req.user.id}`);
    
    try {
      await this.taskService.remove(id, req.user.id);
      this.logger.log(`Task ${id} deleted successfully by user ${req.user.id}`);
    } catch (error) {
      this.logger.error(`Failed to delete task ${id} for user ${req.user.id}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
