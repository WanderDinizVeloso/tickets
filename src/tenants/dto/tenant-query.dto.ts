import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

import { booleanArrayTransform, stringArrayTransform } from '../../common/functions.util';
import { TenantsQueryDTOSwagger } from '../swagger/tenants-dto.swagger';

export class TenantQueryDto {
  @ApiProperty(TenantsQueryDTOSwagger.id.apiProperty)
  @IsOptional()
  @Transform(stringArrayTransform)
  id?: string[];

  @ApiProperty(TenantsQueryDTOSwagger.document.apiProperty)
  @IsOptional()
  @Transform(stringArrayTransform)
  document?: string[];

  @ApiProperty(TenantsQueryDTOSwagger.active.apiProperty)
  @IsOptional()
  @Transform(booleanArrayTransform)
  active: boolean[] = [true];
}
