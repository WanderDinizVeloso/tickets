import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TenantDocument = HydratedDocument<Tenant>;

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
export class Tenant {
  @Prop({ index: true, unique: true })
  name: string;

  @Prop({ index: true, unique: true })
  document: string;

  @Prop({ default: true, index: true })
  active: boolean;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant).index(
  { _id: 1, active: 1 },
  { unique: true },
);
