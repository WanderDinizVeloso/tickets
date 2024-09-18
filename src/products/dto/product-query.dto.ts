import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

import { IProductsTransformExecParam } from '../interfaces/products.interface';

const stringArrayTransform = ({ value }: IProductsTransformExecParam): string[] =>
  value?.split(',');

const booleanArrayTransform = ({ value }: IProductsTransformExecParam): boolean[] => [
  ['true', 'TRUE', '1'].includes(value) ? true : false,
];

export class ProductQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(stringArrayTransform)
  id: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @Transform(booleanArrayTransform)
  active: boolean = true;
}
