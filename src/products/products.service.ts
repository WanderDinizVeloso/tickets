import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { MonetaryDataService } from '../monetary-data/monetary-data.service';
import { Product, ProductDocument } from './schema/product.schema';
import { PRODUCT_NOT_EXIST_RESPONSE } from './utils/products-string-literals.util';

@Injectable()
export class ProductsService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    private readonly monetaryDataService: MonetaryDataService,
  ) {}
  async create(createProductDto: CreateProductDto): Promise<string> {
    await this.connection.syncIndexes();

    const response = await this.productModel.create({
      ...createProductDto,
      price: this.monetaryDataService.setToPrecision34Digits(createProductDto.price),
    });

    return response?._id?.toString();
  }

  async findAll(query?: ProductQueryDto): Promise<ProductDocument[]> {
    return this.productModel.find(this.getFilterQuery(query));
  }

  async findOne(_id: string): Promise<ProductDocument> {
    const response = await this.productModel.findOne({ _id, active: true });

    if (!response) {
      throw new BadRequestException(PRODUCT_NOT_EXIST_RESPONSE);
    }

    return response;
  }

  getFilterQuery(query: ProductQueryDto): Record<string, unknown> {
    return Object.entries(query).reduce((acc: Record<string, unknown>, [key, values]) => {
      const reduceKey = key === 'id' ? '_id' : key;

      if (values) {
        acc[reduceKey] = { $in: values };
      }

      return acc;
    }, {});
  }

  async update(_id: string, updateProductDto: UpdateProductDto): Promise<void> {
    await this.connection.syncIndexes();

    const UpdatePayload = updateProductDto.price
      ? {
          ...updateProductDto,
          price: this.monetaryDataService.setToPrecision34Digits(updateProductDto.price),
        }
      : updateProductDto;

    const response = await this.productModel.findOneAndUpdate({ _id, active: true }, UpdatePayload);

    if (!response) {
      throw new BadRequestException(PRODUCT_NOT_EXIST_RESPONSE);
    }
  }

  async remove(_id: string): Promise<void> {
    const response = await this.productModel.findOneAndUpdate(
      { _id, active: true },
      { active: false },
    );

    if (!response) {
      throw new BadRequestException(PRODUCT_NOT_EXIST_RESPONSE);
    }
  }
}
