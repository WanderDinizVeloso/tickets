import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString, Matches } from 'class-validator';
import {
  PASSWORD_REGEX_MATCH,
  INVALID_NEW_PASSWORD_RESPONSE,
  INVALID_OLD_PASSWORD_RESPONSE,
} from '../../common/constants.util';
import { ChangePasswordDTOSwagger } from '../swagger/auth-dto.swagger';

export class ChangePasswordDto {
  @ApiProperty(ChangePasswordDTOSwagger.newPassword.apiProperty)
  @IsNotEmpty()
  @IsString()
  @Matches(PASSWORD_REGEX_MATCH, { message: INVALID_NEW_PASSWORD_RESPONSE })
  readonly newPassword: string;

  @ApiProperty(ChangePasswordDTOSwagger.OldPassword.apiProperty)
  @IsNotEmpty()
  @IsString()
  @Matches(PASSWORD_REGEX_MATCH, { message: INVALID_OLD_PASSWORD_RESPONSE })
  readonly oldPassword: string;
}
