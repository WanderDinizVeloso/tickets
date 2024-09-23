import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { IsPositiveDecimal } from '../../class-validator-custom/is-positive-decimal.validator';
import { CreateProductDTOSwagger } from '../swagger/products-dto.swagger';

export class CreateProductDto {
  @ApiProperty(CreateProductDTOSwagger.name.apiProperty)
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @ApiProperty(CreateProductDTOSwagger.price.apiProperty)
  @IsNotEmpty()
  @IsPositiveDecimal({ decimal_digits: '2', force_decimal: true })
  readonly price: string;
}
