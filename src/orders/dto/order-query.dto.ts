import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

import { booleanArrayTransform, stringArrayTransform } from '../../common/functions.util';
import { OrderQueryDTOSwagger } from '../swagger/orders-dto.swagger';

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
