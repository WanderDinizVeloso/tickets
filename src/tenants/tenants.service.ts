import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';

import { TENANT_NOT_EXIST_RESPONSE } from '../constants.util';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantQueryDto } from './dto/tenant-query.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { Tenant, TenantDocument } from './schema/tenant.schema';

@Injectable()
export class TenantsService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Tenant.name) private readonly TenantModel: Model<TenantDocument>,
  ) {}
  async create(createTenantDto: CreateTenantDto): Promise<string> {
    await this.connection.syncIndexes();

    const response = await this.TenantModel.create(createTenantDto);

    return response?._id?.toString();
  }

  async findAll(query?: TenantQueryDto): Promise<TenantDocument[]> {
    return this.TenantModel.find(this.getFilterQuery(query));
  }

  async findOne(_id: string): Promise<TenantDocument> {
    const response = await this.TenantModel.findOne({ _id, active: true });

    if (!response) {
      throw new BadRequestException(TENANT_NOT_EXIST_RESPONSE);
    }

    return response;
  }

  getFilterQuery(query: TenantQueryDto): Record<string, unknown> {
    return Object.entries(query).reduce((acc: Record<string, unknown>, [key, values]) => {
      const reduceKey = key === 'id' ? '_id' : key;

      if (values) {
        acc[reduceKey] = { $in: values };
      }

      return acc;
    }, {});
  }

  async update(_id: string, updateTenantDto: UpdateTenantDto): Promise<void> {
    await this.connection.syncIndexes();

    const response = await this.TenantModel.findOneAndUpdate(
      { _id, active: true },
      updateTenantDto,
    );

    if (!response) {
      throw new BadRequestException(TENANT_NOT_EXIST_RESPONSE);
    }
  }

  async remove(_id: string): Promise<void> {
    const response = await this.TenantModel.findOneAndUpdate(
      { _id, active: true },
      { active: false },
    );

    if (!response) {
      throw new BadRequestException(TENANT_NOT_EXIST_RESPONSE);
    }
  }
}
