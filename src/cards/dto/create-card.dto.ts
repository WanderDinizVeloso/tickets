import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

import { INVALID_ORDER_ID } from '../../constants.util';
import { CreateCardsDTOSwagger } from '../swagger/cards-dto.swagger';

export class CreateCardDto {
  @ApiProperty(CreateCardsDTOSwagger.orderId.apiProperty)
  @IsNotEmpty()
  @IsMongoId({ message: INVALID_ORDER_ID })
  readonly orderId: string;
}
