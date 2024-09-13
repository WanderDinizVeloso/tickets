import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsMongoId, IsNotEmpty, ValidateNested } from 'class-validator';

import { IsPositiveDecimal } from '../../class-validator-custom/is-positive-decimal.validator';

export class ProductDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  readonly id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsPositiveDecimal({ decimal_digits: '3', force_decimal: true })
  readonly quantity: string;
}

export class CreateOrderDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductDto)
  readonly products: ProductDto[];
}
