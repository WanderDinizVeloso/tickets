import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { IProductsResponse } from './interfaces/products.interface';
import { ProductsService } from './products.service';
import { Product, ProductDocument } from './schema/product.schema';
import { ProductQueryDto } from './dto/product-query.dto';

const PRODUCT_CREATED_SUCCESSFULLY_RESPONSE = 'The product created successfully.';
const PRODUCT_DELETED_SUCCESSFULLY_RESPONSE = 'The product deleted successfully.';
const PRODUCT_EDITED_SUCCESSFULLY_RESPONSE = 'The product edited successfully.';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createProductDto: CreateProductDto): Promise<IProductsResponse> {
    const id = await this.productsService.create(createProductDto);

    return {
      id,
      message: PRODUCT_CREATED_SUCCESSFULLY_RESPONSE,
      statusCode: HttpStatus.CREATED,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query?: ProductQueryDto): Promise<Product[]> {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string): Promise<ProductDocument> {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<IProductsResponse> {
    await this.productsService.update(id, updateProductDto);

    return {
      id,
      message: PRODUCT_EDITED_SUCCESSFULLY_RESPONSE,
      statusCode: HttpStatus.OK,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<IProductsResponse> {
    await this.productsService.remove(id);

    return {
      id,
      message: PRODUCT_DELETED_SUCCESSFULLY_RESPONSE,
      statusCode: HttpStatus.OK,
    };
  }
}
