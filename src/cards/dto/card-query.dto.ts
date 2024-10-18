import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

import { ICardsTransformExecParam } from '../interfaces/cards.interface';
import { CardQueryDTOSwagger } from '../swagger/cards-dto.swagger';

const stringArrayTransform = ({ value }: ICardsTransformExecParam): string[] => value?.split(',');

const booleanArrayTransform = ({ value }: ICardsTransformExecParam): boolean[] => [
  !!['true', 'TRUE', '1'].includes(value),
];

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
