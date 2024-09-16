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

type CardDocument = Card & Document;

@Schema({
  timestamps: true,
  versionKey: false,
  toJSON: {
    getters: true,
    transform: (Document, response) => {
      delete response._id;
      delete response.productId;
      delete response.orderId;
      delete response.createdAt;
      delete response.updatedAt;
      delete response.active;

      return response;
    },
  },
})
class Card extends Document {
  @Prop({ index: true })
  orderId: string;

  @Prop({ index: true })
  productId: string;

  @Prop()
  name: string;

  @Prop({ get: getMoneyTwoDigits })
  price: string;

  @Prop({ get: getMoneyThreeDigits })
  quantity: string;

  @Prop({ default: true, index: true })
  active: boolean;
}

const CardSchema = SchemaFactory.createForClass(Card).index(
  { _id: 1, active: 1 },
  { unique: true },
);

export { CardDocument, Card, CardSchema };