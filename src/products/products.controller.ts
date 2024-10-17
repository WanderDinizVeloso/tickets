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
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import {
  PRODUCT_CREATED_SUCCESSFULLY_RESPONSE,
  PRODUCT_DELETED_SUCCESSFULLY_RESPONSE,
  PRODUCT_EDITED_SUCCESSFULLY_RESPONSE,
} from '../constants.util';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { IProductsResponse } from './interfaces/products.interface';
import { ProductsService } from './products.service';
import { Product, ProductDocument } from './schema/product.schema';
import { ProductsControllerSwagger } from './swagger/products-controller.swagger';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation(ProductsControllerSwagger.post.apiOperation)
  @ApiCreatedResponse(ProductsControllerSwagger.post.apiOkResponse)
  @ApiBadRequestResponse(ProductsControllerSwagger.post.apiBadRequestResponse)
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
  @ApiOperation(ProductsControllerSwagger.get.apiOperation)
  @ApiOkResponse(ProductsControllerSwagger.get.apiOkResponse)
  async findAll(@Query() query?: ProductQueryDto): Promise<Product[]> {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation(ProductsControllerSwagger.getId.apiOperation)
  @ApiOkResponse(ProductsControllerSwagger.getId.apiOkResponse)
  @ApiBadRequestResponse(ProductsControllerSwagger.getId.apiBadRequestResponse)
  async findOne(@Param('id') id: string): Promise<ProductDocument> {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation(ProductsControllerSwagger.patch.apiOperation)
  @ApiOkResponse(ProductsControllerSwagger.patch.apiOkResponse)
  @ApiBadRequestResponse(ProductsControllerSwagger.patch.apiBadRequestResponse)
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
  @ApiOperation(ProductsControllerSwagger.delete.apiOperation)
  @ApiOkResponse(ProductsControllerSwagger.delete.apiOkResponse)
  @ApiBadRequestResponse(ProductsControllerSwagger.delete.apiBadRequestResponse)
  async remove(@Param('id') id: string): Promise<IProductsResponse> {
    await this.productsService.remove(id);

    return {
      id,
      message: PRODUCT_DELETED_SUCCESSFULLY_RESPONSE,
      statusCode: HttpStatus.OK,
    };
  }
}
