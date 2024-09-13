import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MonetaryDataModule } from '../monetary-data/monetary-data.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product, ProductSchema } from './schema/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    MonetaryDataModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
