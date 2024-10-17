import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  readonly refreshToken: string;
}
