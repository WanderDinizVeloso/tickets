import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';
import { MonetaryDataModule } from '../monetary-data/monetary-data.module';
import { OrdersModule } from '../orders/orders.module';
import { Card, CardSchema } from './schema/card.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Card.name, schema: CardSchema }]),
    MonetaryDataModule,
    OrdersModule,
  ],
  controllers: [CardsController],
  providers: [CardsService],
  exports: [],
})
export class CardsModule {}
