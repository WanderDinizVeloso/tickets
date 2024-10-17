import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsMongoId, IsNotEmpty, ValidateNested } from 'class-validator';

import { IsPositiveDecimal } from '../../class-validator-custom/is-positive-decimal.validator';
import { INVALID_ID_RESPONSE } from '../../constants.util';
import { CreateOrdersDTOSwagger } from '../swagger/orders-dto.swagger';

export class OrderProductDto {
  @ApiProperty(CreateOrdersDTOSwagger['product.id'].apiProperty)
  @IsNotEmpty()
  @IsMongoId({ message: INVALID_ID_RESPONSE })
  readonly id: string;

  @ApiProperty(CreateOrdersDTOSwagger['product.quantity'].apiProperty)
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
