import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MonetaryDataModule } from './monetary-data/monetary-data.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://mongodb:27017/tickets'),
    MonetaryDataModule,
    OrdersModule,
    ProductsModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
