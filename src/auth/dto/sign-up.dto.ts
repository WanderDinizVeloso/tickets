import { ApiProperty } from '@nestjs/swagger';

import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';
import { PASSWORD_REGEX_MATCH, INVALID_PASSWORD_RESPONSE } from '../../constants.util';
import { SignUpDTOSwagger } from '../swagger/auth-dto.swagger';

export class SignUpDto {
  @ApiProperty(SignUpDTOSwagger.name.apiProperty)
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @ApiProperty(SignUpDTOSwagger.email.apiProperty)
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @ApiProperty(SignUpDTOSwagger.password.apiProperty)
  @IsNotEmpty()
  @IsString()
  @Matches(PASSWORD_REGEX_MATCH, { message: INVALID_PASSWORD_RESPONSE })
  readonly password: string;
}
