import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

import { MonetaryDataService } from '../../monetary-data/monetary-data.service';

const TWO_DIGITS = 2;
const THREE_DIGITS = 3;

const monetaryDataService = new MonetaryDataService();

const getMoneyTwoDigits = (value: string): string =>
  monetaryDataService.getToFixedDigits(value, TWO_DIGITS);

const getMoneyThreeDigits = (value: string): string =>
  monetaryDataService.getToFixedDigits(value, THREE_DIGITS);

const getOrderProducts = (products: OrderProduct[]): OrderProduct[] => {
  return products.map((product: OrderProduct) => ({
    ...product,
    price: getMoneyTwoDigits(product.price),
    quantity: getMoneyThreeDigits(product.quantity),
    total: getMoneyTwoDigits(product.total),
  }));
};

type OrderDocument = Order & Document;

export class OrderProduct {
  @Prop()
  id: string;

  @Prop()
  name: string;

  @Prop()
  quantity: string;

  @Prop()
  price: string;

  @Prop()
  total: string;
}

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
class Order extends Document {
  @Prop({ get: getOrderProducts })
  products: OrderProduct[];

  @Prop({ type: () => OrderProduct, get: getMoneyTwoDigits })
  total: string;

  @Prop({ default: true, index: true })
  active: boolean;
}

const OrderSchema = SchemaFactory.createForClass(Order).index(
  { _id: 1, active: 1 },
  { unique: true },
);

export { OrderDocument, Order, OrderSchema };
