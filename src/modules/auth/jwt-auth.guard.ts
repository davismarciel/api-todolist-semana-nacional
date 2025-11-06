import { Injectable, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      this.logger.warn(`Authentication failed: No authorization header for ${request.method} ${request.url}`);
      return false;
    }

    this.logger.debug(`Validating JWT token for ${request.method} ${request.url}`);
    return super.canActivate(context) as boolean | Promise<boolean>;
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      this.logger.warn(`JWT authentication failed: ${err?.message || info?.message || 'Invalid token'}`);
      throw err || new UnauthorizedException();
    }
    this.logger.debug(`JWT authentication successful for user: ${user.id}`);
    return user;
  }
}

