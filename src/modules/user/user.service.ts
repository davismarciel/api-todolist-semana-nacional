import { Injectable, ConflictException, NotFoundException, UnauthorizedException, Logger } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, LoginDto } from './dto/update-user.dto';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    this.logger.debug(`Creating user with email: ${createUserDto.email}`);
    
    try {
      if (!createUserDto.email || !createUserDto.password || !createUserDto.name) {
        this.logger.warn(`User creation failed: missing required fields`);
        throw new ConflictException('Email, senha e nome são obrigatórios');
      }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    
    if (existingUser) {
      this.logger.warn(`User creation failed: email ${createUserDto.email} already exists`);
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      
      this.logger.debug(`Hashing password completed, creating user in database...`);
      
    const user = await this.prisma.user.create({
      data: {
          email: createUserDto.email.trim(),
        password: hashedPassword,
          name: createUserDto.name.trim(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

      // Verify user was actually created in database
      const verifyUser = await this.prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!verifyUser) {
        this.logger.error(`CRITICAL: User was created but not found in database: ${user.id}`);
        throw new Error('Falha ao criar usuário no banco de dados');
      }

      this.logger.log(`User created successfully: ${user.id} - ${user.email} - ${user.name}`);
      this.logger.debug(`User verified in database: ${verifyUser.id} - ${verifyUser.email}`);
    return user;
    } catch (error: any) {
      this.logger.error(`Error creating user: ${error?.message || 'Unknown error'}`, error?.stack);

      if (error instanceof ConflictException) {
        throw error;
      }
      
      if (error?.code === 'P2002') {
        this.logger.warn(`Duplicate entry error: ${error?.meta?.target}`);
        throw new ConflictException('User with this email already exists');
      }

      throw error;
    }
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async validateUser(loginDto: LoginDto) {
    this.logger.debug(`Validating credentials for user: ${loginDto.email}`);
    
    const user = await this.findByEmail(loginDto.email);
    if (!user) {
      this.logger.warn(`Authentication failed: user not found for email ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Authentication failed: invalid password for user ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.debug(`Credentials validated successfully for user: ${user.id}`);
    const { password, ...result } = user;
    return result;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });
    
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updateData: any = {};
    if (updateUserDto.email) updateData.email = updateUserDto.email;
    if (updateUserDto.name) updateData.name = updateUserDto.name;
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    await this.prisma.user.delete({
      where: { id },
    });
  }
}
