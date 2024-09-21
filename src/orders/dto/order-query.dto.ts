import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

import { IOrdersTransformExecParam } from '../interfaces/orders.interface';
import { OrderQueryDTOSwagger } from '../swagger/ordersDTO.swagger';

const stringArrayTransform = ({ value }: IOrdersTransformExecParam): string[] => value?.split(',');

const booleanArrayTransform = ({ value }: IOrdersTransformExecParam): boolean[] => [
  ['true', 'TRUE', '1'].includes(value) ? true : false,
];

export class OrderQueryDto {
  @ApiProperty(OrderQueryDTOSwagger.id.apiProperty)
  @IsOptional()
  @Transform(stringArrayTransform)
  id?: string[];

  @ApiProperty(OrderQueryDTOSwagger.active.apiProperty)
  @IsOptional()
  @Transform(booleanArrayTransform)
  active: boolean[] = [true];
}
