import { ApiProperty } from '@nestjs/swagger';

import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';
import { INVALID_PASSWORD_RESPONSE } from '../../constants.util';

export class SignUpDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Matches(/(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}/, {
    message: INVALID_PASSWORD_RESPONSE,
  })
  readonly password: string;
}
