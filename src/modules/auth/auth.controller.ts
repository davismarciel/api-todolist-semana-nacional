import { Controller, Post, Body, Logger, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../user/dto/update-user.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserService } from '../user/user.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    this.logger.log(`Attempting to register new user: ${createUserDto?.email || 'unknown'}`);
    this.logger.debug(`Registration data received: ${JSON.stringify({ 
      email: createUserDto?.email, 
      name: createUserDto?.name, 
      hasPassword: !!createUserDto?.password 
    })}`);
    
    try {
      if (!createUserDto) {
        throw new BadRequestException('Dados do usuário são obrigatórios');
      }

      // Log detailed validation
      if (!createUserDto.email) {
        this.logger.warn('Registration failed: email is missing');
        throw new BadRequestException('Email é obrigatório');
      }
      if (!createUserDto.password) {
        this.logger.warn('Registration failed: password is missing');
        throw new BadRequestException('Senha é obrigatória');
      }
      if (!createUserDto.name) {
        this.logger.warn('Registration failed: name is missing');
        throw new BadRequestException('Nome é obrigatório');
      }

      this.logger.debug(`Calling userService.create with email: ${createUserDto.email}, name: ${createUserDto.name}`);
      const user = await this.userService.create(createUserDto);
      this.logger.log(`User registered successfully: ${user.id} - ${user.email} - ${user.name}`);
      return user;
    } catch (error: any) {
      this.logger.error(`Failed to register user ${createUserDto?.email || 'unknown'}: ${error?.message || 'Unknown error'}`, error?.stack);
      throw error;
    }
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    this.logger.log(`Login attempt for email: ${loginDto.email}`);
    
    try {
      if (!loginDto.email || !loginDto.password) {
        this.logger.warn(`Login failed: missing credentials`);
        throw new BadRequestException('Email e senha são obrigatórios');
      }
      
      const result = await this.authService.login(loginDto);
      this.logger.log(`Login successful for user: ${result.user.id} - ${result.user.email}`);
      return result;
    } catch (error) {
      this.logger.warn(`Login failed for email ${loginDto.email}: ${error.message}`);
      throw error;
    }
  }
}

