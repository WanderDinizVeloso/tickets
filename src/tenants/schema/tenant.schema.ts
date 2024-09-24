import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

type TenantDocument = Tenant & Document;

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
class Tenant extends Document {
  @Prop({ index: true, unique: true })
  name: string;

  @Prop({ index: true, unique: true })
  document: string;

  @Prop({ default: true, index: true })
  active: boolean;
}

const TenantSchema = SchemaFactory.createForClass(Tenant).index(
  { _id: 1, active: 1 },
  { unique: true },
);

export { TenantDocument, Tenant, TenantSchema };
