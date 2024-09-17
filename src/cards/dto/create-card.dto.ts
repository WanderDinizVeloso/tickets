import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CreateCardDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  readonly orderId: string;
}
