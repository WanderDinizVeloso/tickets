import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { CreateTenantsDTOSwagger } from '../swagger/tenants-dto.swagger';

export class CreateTenantDto {
  @ApiProperty(CreateTenantsDTOSwagger.name.apiProperty)
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @ApiProperty(CreateTenantsDTOSwagger.document.apiProperty)
  @IsNotEmpty()
  @IsString()
  readonly document: string;
}
