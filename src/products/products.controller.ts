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
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';
import { Product, ProductDocument } from './schema/product.schema';

interface IProductsResponse {
  id: string;
  message: string;
  statusCode: number;
}

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
      message: 'The product created successfully.',
      statusCode: HttpStatus.CREATED,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<Product[]> {
    return this.productsService.findAll();
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
      message: 'The product edited successfully.',
      statusCode: HttpStatus.OK,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<IProductsResponse> {
    await this.productsService.remove(id);

    return {
      id,
      message: 'The product deleted successfully.',
      statusCode: HttpStatus.OK,
    };
  }
}
