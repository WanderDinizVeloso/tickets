import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

import { IProductsTransformExecParam } from '../interfaces/products.interface';
import { ProductQueryDTOSwagger } from '../swagger/products-dto.swagger';

const stringArrayTransform = ({ value }: IProductsTransformExecParam): string[] =>
  value?.split(',');

const booleanArrayTransform = ({ value }: IProductsTransformExecParam): boolean[] => [
  ['true', 'TRUE', '1'].includes(value) ? true : false,
];

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
