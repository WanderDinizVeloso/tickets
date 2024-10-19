import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

import { booleanArrayTransform, stringArrayTransform } from '../../common/functions.util';
import { ProductQueryDTOSwagger } from '../swagger/products-dto.swagger';

export class ProductQueryDto {
  @ApiProperty(ProductQueryDTOSwagger.id.apiProperty)
  @IsOptional()
  @Transform(stringArrayTransform)
  id?: string[];

  @ApiProperty(ProductQueryDTOSwagger.active.apiProperty)
  @IsOptional()
  @Transform(booleanArrayTransform)
  active: boolean[] = [true];
}
