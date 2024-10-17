import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

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
      delete response.password;

      return response;
    },
  },
})
export class User {
  @Prop()
  name: string;

  @Prop({ index: true, unique: true })
  email: string;

  @Prop()
  password: string;

  @Prop({ default: true, index: true })
  active: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User).index(
  { _id: 1, active: 1 },
  { unique: true },
);
