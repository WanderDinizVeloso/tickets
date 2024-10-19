import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

import { booleanArrayTransform, stringArrayTransform } from '../../common/functions.util';
import { CardQueryDTOSwagger } from '../swagger/cards-dto.swagger';

export class CardQueryDto {
  @ApiProperty(CardQueryDTOSwagger.id.apiProperty)
  @IsOptional()
  @Transform(stringArrayTransform)
  id?: string[];

  @ApiProperty(CardQueryDTOSwagger.orderId.apiProperty)
  @IsOptional()
  @Transform(stringArrayTransform)
  orderId?: string[];

  @ApiProperty(CardQueryDTOSwagger.active.apiProperty)
  @IsOptional()
  @Transform(booleanArrayTransform)
  active: boolean[] = [true];
}
