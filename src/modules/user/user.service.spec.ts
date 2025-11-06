import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UserService', () => {
  let service: UserService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const hashedPassword = 'hashed-password';
      const mockUser = {
        id: 'user-id',
        email: createUserDto.email,
        name: createUserDto.name,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockUser);
      mockPrismaService.user.create.mockResolvedValue({
        ...mockUser,
        password: undefined,
      });

      const result = await service.create(createUserDto);

      expect(result).toBeDefined();
      expect(result.email).toBe(createUserDto.email);
      expect(result.name).toBe(createUserDto.name);
      expect(result).not.toHaveProperty('password');
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
    });

    it('should throw ConflictException if email already exists', async () => {
      const createUserDto = {
        email: 'duplicate@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const existingUser = {
        id: 'existing-id',
        email: createUserDto.email,
        name: 'Existing User',
        password: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      const loginDto = {
        email: 'valid@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'user-id',
        email: loginDto.email,
        name: 'Valid User',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(loginDto);

      expect(result).toBeDefined();
      expect(result.email).toBe(loginDto.email);
      expect(result).not.toHaveProperty('password');
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.password);
    });

    it('should throw UnauthorizedException with invalid email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.validateUser({
          email: 'invalid@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with invalid password', async () => {
      const loginDto = {
        email: 'test2@example.com',
        password: 'wrongpassword',
      };

      const mockUser = {
        id: 'user-id',
        email: loginDto.email,
        name: 'Test User',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.validateUser(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('findOne', () => {
    it('should return user without password', async () => {
      const userId = 'user-id';
      const mockUser = {
        id: userId,
        email: 'find@example.com',
        name: 'Find User',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        password: undefined,
      });

      const result = await service.findOne(userId);

      expect(result).toBeDefined();
      expect(result.id).toBe(userId);
      expect(result).not.toHaveProperty('password');
    });
  });
});
