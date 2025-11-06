import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'your-secret-key-change-in-production',
    });
    this.logger.log('JWT Strategy initialized');
  }

  async validate(payload: any) {
    this.logger.debug(`Validating JWT token - payload: ${JSON.stringify({ sub: payload.sub, email: payload.email })}`);
    
    try {
      if (!payload || !payload.sub) {
        this.logger.warn(`JWT validation failed: Invalid payload structure`);
        throw new UnauthorizedException('Invalid token payload');
      }

      this.logger.debug(`Calling authService.validateUser for user ID: ${payload.sub}`);
      const user = await this.authService.validateUser(payload);
      
      if (!user) {
        this.logger.warn(`JWT validation failed: user not found for ID ${payload.sub}`);
        throw new UnauthorizedException('User not found');
      }
      
      this.logger.debug(`JWT validation successful for user: ${user.id} - ${user.email}`);
      return user;
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`JWT validation error: ${error?.message || 'Unknown error'}`, error?.stack);
      throw new UnauthorizedException('Token validation failed');
    }
  }
}

