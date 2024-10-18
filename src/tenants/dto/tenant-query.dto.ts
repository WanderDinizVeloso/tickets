import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

import { ITenantsTransformExecParam } from '../interfaces/tenants.interface';
import { TenantsQueryDTOSwagger } from '../swagger/tenants-dto.swagger';

const stringArrayTransform = ({ value }: ITenantsTransformExecParam): string[] => value?.split(',');

const booleanArrayTransform = ({ value }: ITenantsTransformExecParam): boolean[] => [
  !!['true', 'TRUE', '1'].includes(value),
];

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
