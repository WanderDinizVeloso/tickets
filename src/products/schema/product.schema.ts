import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

import { MonetaryDataService } from '../../monetary-data/monetary-data.service';
import { TWO_DIGITS } from '../utils/magic-numbers.util';

const monetaryDataService = new MonetaryDataService();

const getMoneyTwoDigits = (value: string): string =>
  monetaryDataService.getToFixedDigits(value, TWO_DIGITS);

type ProductDocument = Product & Document;

@Schema({
  timestamps: true,
  versionKey: false,
  toJSON: {
    getters: true,
    transform: (Document, response) => {
      delete response._id;
      delete response.createdAt;
      delete response.updatedAt;
      delete response.active;

      return response;
    },
  },
})
class Product extends Document {
  @Prop({ unique: true, index: true })
  name: string;

  @Prop({ get: getMoneyTwoDigits })
  price: string;

  @Prop({ default: true, index: true })
  active: boolean;
}

const ProductSchema = SchemaFactory.createForClass(Product).index(
  { _id: 1, active: 1 },
  { unique: true },
);

export { ProductDocument, Product, ProductSchema };
