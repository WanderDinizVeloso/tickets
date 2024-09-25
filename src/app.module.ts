import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CardsModule } from './cards/cards.module';
import { MonetaryDataModule } from './monetary-data/monetary-data.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { TenantsModule } from './tenants/tenants.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://mongodb:27017/tickets'),
    CardsModule,
    MonetaryDataModule,
    OrdersModule,
    ProductsModule,
    TenantsModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
