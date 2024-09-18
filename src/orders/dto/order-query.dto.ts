import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

import { IOrdersTransformExecParam } from '../interfaces/orders.interface';

const stringArrayTransform = ({ value }: IOrdersTransformExecParam): string[] => value?.split(',');

const booleanArrayTransform = ({ value }: IOrdersTransformExecParam): boolean[] => [
  ['true', 'TRUE', '1'].includes(value) ? true : false,
];

export class OrderQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(stringArrayTransform)
  id?: string[];

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @Transform(booleanArrayTransform)
  active: boolean[] = [true];
}
