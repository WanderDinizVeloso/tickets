import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RefreshTokenDocument = HydratedDocument<RefreshToken>;

@Schema({
  timestamps: true,
  versionKey: false,
  toJSON: {
    getters: true,
    transform: (Document, response) => {
      delete response._id;
      delete response.createdAt;
      delete response.updatedAt;

      return response;
    },
  },
})
export class RefreshToken {
  @Prop()
  token: string;

  @Prop({ index: true })
  userId: string;

  @Prop()
  expiryDate: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken).index(
  { token: 1, userId: 1, expiryDate: 1 },
  { unique: true },
);
