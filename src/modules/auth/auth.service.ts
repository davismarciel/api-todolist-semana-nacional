import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { LoginDto } from '../user/dto/update-user.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    this.logger.debug(`Validating user credentials for email: ${loginDto.email}`);
    
    try {
      this.logger.debug(`Calling userService.validateUser for email: ${loginDto.email}`);
      const user = await this.userService.validateUser(loginDto);
      
      if (!user) {
        this.logger.warn(`Login failed: user not found for email ${loginDto.email}`);
        throw new UnauthorizedException('Credenciais inválidas');
      }
      
      this.logger.debug(`User validated successfully: ${user.id} - ${user.email}`);
      
      const payload = { email: user.email, sub: user.id };
      this.logger.debug(`Generating JWT token for user ${user.id} with payload: ${JSON.stringify({ email: payload.email, sub: payload.sub })}`);
      
      const accessToken = this.jwtService.sign(payload);
      
      this.logger.log(`JWT token generated successfully for user: ${user.id} - ${user.email}`);
      
      return {
        access_token: accessToken,
        user,
      };
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        this.logger.warn(`Login failed for email ${loginDto.email}: ${error.message}`);
        throw error;
      }
      this.logger.error(`Login error for email ${loginDto.email}: ${error?.message || 'Unknown error'}`, error?.stack);
      throw new UnauthorizedException('Erro ao fazer login. Tente novamente.');
    }
  }

  async validateUser(payload: any) {
    this.logger.debug(`Validating JWT payload for user ID: ${payload.sub}, email: ${payload.email}`);
    
    try {
    const user = await this.userService.findOne(payload.sub);
      if (!user) {
        this.logger.warn(`JWT validation failed: User ${payload.sub} not found in database`);
        return null;
      }
      
      this.logger.debug(`JWT user validated successfully: ${user.id} - ${user.email}`);
    return user;
    } catch (error: any) {
      this.logger.error(`JWT validation error for user ID ${payload.sub}: ${error?.message || 'Unknown error'}`, error?.stack);
      return null;
    }
  }
}

