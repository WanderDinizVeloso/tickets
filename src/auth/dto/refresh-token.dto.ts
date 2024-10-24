import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { RefreshTokenDTOSwagger } from '../swagger/auth-dto.swagger';

export class RefreshTokenDto {
  @ApiProperty(RefreshTokenDTOSwagger.refreshToken.apiProperty)
  @IsNotEmpty()
  @IsUUID()
  readonly refreshToken: string;
}
