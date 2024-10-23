import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { ChangePasswordDto } from './change-password.dto';
import { ResetTokenDTOSwagger } from '../swagger/auth-dto.swagger';

export class ResetPasswordDto extends PickType(ChangePasswordDto, ['newPassword'] as const) {
  @ApiProperty(ResetTokenDTOSwagger.resetToken.apiProperty)
  @IsNotEmpty()
  @IsUUID()
  readonly resetToken: string;
}
