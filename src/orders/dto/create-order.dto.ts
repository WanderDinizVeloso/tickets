import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsMongoId, IsNotEmpty, ValidateNested } from 'class-validator';

import { IsPositiveDecimal } from '../../class-validator-custom/is-positive-decimal.validator';

export class OrderProductDto {
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
  @ApiProperty({ isArray: true, type: OrderProductDto })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderProductDto)
  readonly products: OrderProductDto[];
}
