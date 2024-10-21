import { UUID } from 'crypto';
import { Request } from 'express';

export interface IUserTokensResponse {
  accessToken: string;
  refreshToken: UUID;
}

export interface ITicketsRequest extends Request {
  userId: UUID;
}

export interface IForgotPasswordResponse {
  message: string;
  statusCode: number;
}
