import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { ChangePasswordDto } from './change-password.dto';

export class ResetPasswordDto extends PickType(ChangePasswordDto, ['newPassword'] as const) {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  readonly resetToken: string;
}
