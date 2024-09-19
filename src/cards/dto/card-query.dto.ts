import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

import { ICardsTransformExecParam } from '../interfaces/cards.interface';

const stringArrayTransform = ({ value }: ICardsTransformExecParam): string[] => value?.split(',');

const booleanArrayTransform = ({ value }: ICardsTransformExecParam): boolean[] => [
  ['true', 'TRUE', '1'].includes(value) ? true : false,
];

export class CardQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(stringArrayTransform)
  id?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(stringArrayTransform)
  orderId?: string[];

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @Transform(booleanArrayTransform)
  active: boolean[] = [true];
}
