import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Decimal128 } from 'mongodb';
import { Types, Document } from 'mongoose';

type ProductDocument = Product & Document;

const getMoney = (value: Types.Decimal128): string => value.toString();

const setMoney = (value: string): Types.Decimal128 => new Decimal128(value);

@Schema({
  timestamps: true,
  versionKey: false,
  toJSON: {
    getters: true,
    transform: (Document, response) => {
      delete response._id;
      return response;
    },
  },
})
class Product extends Document {
  @Prop({ unique: true, index: true })
  name: string;

  @Prop({ set: setMoney, get: getMoney })
  price: Types.Decimal128;

  @Prop({ default: true, index: true })
  active: boolean;
}

const ProductSchema = SchemaFactory.createForClass(Product).index(
  { _id: 1, active: 1 },
  { unique: true },
);

export { ProductDocument, Product, ProductSchema };
