import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

import { INVALID_ORDER_ID } from '../utils/string-literals.util';

export class CreateCardDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId({ message: INVALID_ORDER_ID })
  readonly orderId: string;
}
