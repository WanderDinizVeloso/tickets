import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString, Matches } from 'class-validator';
import {
  PASSWORD_REGEX_MATCH,
  INVALID_NEW_PASSWORD_RESPONSE,
  INVALID_OLD_PASSWORD_RESPONSE,
} from '../../common/constants.util';

export class ChangePasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Matches(PASSWORD_REGEX_MATCH, { message: INVALID_NEW_PASSWORD_RESPONSE })
  readonly newPassword: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Matches(PASSWORD_REGEX_MATCH, { message: INVALID_OLD_PASSWORD_RESPONSE })
  readonly oldPassword: string;
}
