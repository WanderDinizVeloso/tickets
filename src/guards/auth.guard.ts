import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

import { ITicketsRequest } from '../auth/interfaces/auth.interface';
import { BEARER, INVALID_BEARER_TOKEN, IS_PUBLIC_KEY } from '../constants.util';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      if (isPublic) {
        return true;
      }

      const request: ITicketsRequest = context.switchToHttp().getRequest();

      const { userId } = await this.jwtService.verify(this.extractTokenFromHeader(request));

      request.userId = userId;

      return true;
    } catch (error) {
      throw new UnauthorizedException(INVALID_BEARER_TOKEN);
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers?.authorization?.split(' ') || [];

    if (type !== BEARER) {
      throw new UnauthorizedException(INVALID_BEARER_TOKEN);
    }

    return token;
  }
}
