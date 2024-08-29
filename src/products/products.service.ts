import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductDocument } from './schema/product.schema';

const PRODUCT_NOT_EXIST_RESPONSE = 'The product does not exist.';

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private readonly productModel: Model<ProductDocument>) {}
  async create(createProductDto: CreateProductDto): Promise<string> {
    const response = await this.productModel.create(createProductDto);

    if (response?._id) {
      return response._id.toString();
    }
  }

  async findAll(): Promise<ProductDocument[]> {
    return await this.productModel.find(
      { active: true },
      { active: false, createdAt: false, updatedAt: false },
    );
  }

  async findOne(_id: string): Promise<ProductDocument> {
    const response = await this.productModel.findOne(
      { _id, active: true },
      { active: false, createdAt: false, updatedAt: false },
    );

    if (!response) {
      throw new BadRequestException(PRODUCT_NOT_EXIST_RESPONSE);
    }

    return response;
  }

  async update(_id: string, updateProductDto: UpdateProductDto): Promise<void> {
    const response = await this.productModel.findOneAndUpdate(
      { _id, active: true },
      updateProductDto,
    );

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
