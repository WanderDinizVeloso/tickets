import { ApiProperty } from '@nestjs/swagger';

import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';
import { INVALID_PASSWORD_RESPONSE } from '../../constants.util';
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
  @Matches(/(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}/, {
    message: INVALID_PASSWORD_RESPONSE,
  })
  readonly password: string;
}
