import { UUID } from 'crypto';
import { Request } from 'express';

export interface IAuthResponse {
  id: string;
  message: string;
  statusCode: number;
}

export interface IUserTokensResponse {
  accessToken: string;
  refreshToken: UUID;
}

export interface ITicketsRequest extends Request {
  userId: UUID;
}
