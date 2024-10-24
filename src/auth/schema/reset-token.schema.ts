import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ResetTokenDocument = HydratedDocument<ResetToken>;

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
export class ResetToken {
  @Prop()
  resetToken: string;

  @Prop({ index: true })
  userId: string;

  @Prop()
  expiryDate: Date;
}

export const ResetTokenSchema = SchemaFactory.createForClass(ResetToken).index(
  { resetToken: 1, userId: 1, expiryDate: 1 },
  { unique: true },
);
