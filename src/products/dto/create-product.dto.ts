import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { IsPositiveDecimal } from '../../class-validator-custom/is-positive-decimal.validator';

export class CreateProductDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsPositiveDecimal({ decimal_digits: '2', force_decimal: true })
  readonly price: string;
}
