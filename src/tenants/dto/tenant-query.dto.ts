import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

import { ITenantsTransformExecParam } from '../interfaces/tenants.interface';

const stringArrayTransform = ({ value }: ITenantsTransformExecParam): string[] => value?.split(',');

const booleanArrayTransform = ({ value }: ITenantsTransformExecParam): boolean[] => [
  ['true', 'TRUE', '1'].includes(value) ? true : false,
];

export class TenantQueryDto {
  @ApiProperty()
  @IsOptional()
  @Transform(stringArrayTransform)
  id?: string[];

  @ApiProperty()
  @IsOptional()
  @Transform(stringArrayTransform)
  document?: string[];

  @ApiProperty()
  @IsOptional()
  @Transform(booleanArrayTransform)
  active: boolean[] = [true];
}
