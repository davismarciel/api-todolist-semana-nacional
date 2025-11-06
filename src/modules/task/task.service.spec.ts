import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from './task.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('TaskService', () => {
  let service: TaskService;
  let prismaService: PrismaService;
  const userId = 'test-user-id';

  const mockPrismaService = {
    task: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const createTaskDto = {
        title: 'Test Task',
        description: 'Test Description',
        priority: TaskPriority.HIGH,
      };

      const mockTask = {
        id: 'task-id',
        title: createTaskDto.title,
        description: createTaskDto.description,
        priority: createTaskDto.priority,
        status: TaskStatus.PENDING,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.task.create.mockResolvedValue(mockTask);

      const result = await service.create(createTaskDto, userId);

      expect(result).toBeDefined();
      expect(result.title).toBe(createTaskDto.title);
      expect(result.description).toBe(createTaskDto.description);
      expect(result.priority).toBe(createTaskDto.priority);
      expect(result.status).toBe(TaskStatus.PENDING);
      expect(mockPrismaService.task.create).toHaveBeenCalledWith({
        data: {
          title: createTaskDto.title,
          description: createTaskDto.description,
          priority: createTaskDto.priority,
          userId,
        },
      });
    });

    it('should default to MEDIUM priority if not provided', async () => {
      const createTaskDto = {
        title: 'Test Task',
        description: 'Test Description',
      };

      const mockTask = {
        id: 'task-id',
        ...createTaskDto,
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.PENDING,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.task.create.mockResolvedValue(mockTask);

      const result = await service.create(createTaskDto, userId);

      expect(result.priority).toBe(TaskPriority.MEDIUM);
      expect(mockPrismaService.task.create).toHaveBeenCalledWith({
        data: {
          title: createTaskDto.title,
          description: createTaskDto.description,
          priority: TaskPriority.MEDIUM,
          userId,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return all tasks for user', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', description: 'Desc 1', userId, status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', title: 'Task 2', description: 'Desc 2', userId, status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM, createdAt: new Date(), updatedAt: new Date() },
      ];

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.findAll(userId);

      expect(result).toHaveLength(2);
      expect(result.every(t => t.userId === userId)).toBe(true);
      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      });
    });

    it('should filter by status', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', description: 'Desc 1', userId, status: TaskStatus.COMPLETED, priority: TaskPriority.MEDIUM, createdAt: new Date(), updatedAt: new Date() },
      ];

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.findAll(userId, TaskStatus.COMPLETED);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(TaskStatus.COMPLETED);
      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith({
        where: { userId, status: TaskStatus.COMPLETED },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      });
    });

    it('should filter by priority', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', description: 'Desc 1', userId, status: TaskStatus.PENDING, priority: TaskPriority.HIGH, createdAt: new Date(), updatedAt: new Date() },
      ];

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.findAll(userId, undefined, TaskPriority.HIGH);

      expect(result).toHaveLength(1);
      expect(result[0].priority).toBe(TaskPriority.HIGH);
      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith({
        where: { userId, priority: TaskPriority.HIGH },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      });
    });
  });

  describe('toggleComplete', () => {
    it('should mark task as completed', async () => {
      const taskId = 'task-id';
      const mockTask = {
        id: taskId,
        title: 'Task',
        description: 'Desc',
        userId,
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCompletedTask = {
        ...mockTask,
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.task.update.mockResolvedValue(mockCompletedTask);

      const result = await service.toggleComplete(taskId, userId);

      expect(result.status).toBe(TaskStatus.COMPLETED);
      expect(result.completedAt).toBeDefined();
    });

    it('should mark task as pending when toggled again', async () => {
      const taskId = 'task-id';
      const mockCompletedTask = {
        id: taskId,
        title: 'Task',
        description: 'Desc',
        userId,
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.MEDIUM,
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPendingTask = {
        ...mockCompletedTask,
        status: TaskStatus.PENDING,
        completedAt: null,
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockCompletedTask);
      mockPrismaService.task.update.mockResolvedValue(mockPendingTask);

      const result = await service.toggleComplete(taskId, userId);

      expect(result.status).toBe(TaskStatus.PENDING);
      expect(result.completedAt).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      mockPrismaService.task.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1);

      const stats = await service.getStats(userId);

      expect(stats.total).toBe(3);
      expect(stats.completed).toBe(1);
      expect(stats.pending).toBe(2);
      expect(stats.highPriority).toBe(1);
    });
  });

  describe('remove', () => {
    it('should remove a task', async () => {
      const taskId = 'task-id';
      const mockTask = {
        id: taskId,
        title: 'Task',
        description: 'Desc',
        userId,
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.task.delete.mockResolvedValue(mockTask);

      await service.remove(taskId, userId);

      expect(mockPrismaService.task.delete).toHaveBeenCalledWith({
        where: { id: taskId },
      });
    });
  });

  describe('access control', () => {
    it('should throw ForbiddenException when accessing another user task', async () => {
      const taskId = 'task-id';
      const otherUserId = 'other-user-id';
      const mockTask = {
        id: taskId,
        title: 'Task',
        description: 'Desc',
        userId: 'original-user-id',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

      await expect(service.findOne(taskId, otherUserId)).rejects.toThrow(ForbiddenException);
    });
  });
});
