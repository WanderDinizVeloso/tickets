import {
  Controller,
  Get,
  Post,
  Body,
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
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import {
  ORDER_CREATED_SUCCESSFULLY_RESPONSE,
  ORDER_DELETED_SUCCESSFULLY_RESPONSE,
} from '../constants.util';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { IOrdersResponse } from './interfaces/orders.interface';
import { OrdersService } from './orders.service';
import { OrderDocument } from './schema/order.schema';
import { OrdersControllerSwagger } from './swagger/orders-controller.swagger';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation(OrdersControllerSwagger.post.apiOperation)
  @ApiCreatedResponse(OrdersControllerSwagger.post.apiOkResponse)
  @ApiBadRequestResponse(OrdersControllerSwagger.post.apiBadRequestResponse)
  @ApiUnauthorizedResponse(OrdersControllerSwagger.post.apiUnauthorizedResponse)
  async create(@Body() createOrderDto: CreateOrderDto): Promise<IOrdersResponse> {
    const id = await this.ordersService.create(createOrderDto);

    return {
      id,
      message: ORDER_CREATED_SUCCESSFULLY_RESPONSE,
      statusCode: HttpStatus.CREATED,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation(OrdersControllerSwagger.get.apiOperation)
  @ApiOkResponse(OrdersControllerSwagger.get.apiOkResponse)
  @ApiUnauthorizedResponse(OrdersControllerSwagger.get.apiUnauthorizedResponse)
  async findAll(@Query() query?: OrderQueryDto): Promise<OrderDocument[]> {
    return this.ordersService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation(OrdersControllerSwagger.getId.apiOperation)
  @ApiOkResponse(OrdersControllerSwagger.getId.apiOkResponse)
  @ApiBadRequestResponse(OrdersControllerSwagger.getId.apiBadRequestResponse)
  @ApiUnauthorizedResponse(OrdersControllerSwagger.getId.apiUnauthorizedResponse)
  async findOne(@Param('id') id: string): Promise<OrderDocument> {
    return this.ordersService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation(OrdersControllerSwagger.delete.apiOperation)
  @ApiOkResponse(OrdersControllerSwagger.delete.apiOkResponse)
  @ApiBadRequestResponse(OrdersControllerSwagger.delete.apiBadRequestResponse)
  @ApiUnauthorizedResponse(OrdersControllerSwagger.delete.apiUnauthorizedResponse)
  async remove(@Param('id') id: string): Promise<IOrdersResponse> {
    await this.ordersService.remove(id);

    return {
      id,
      message: ORDER_DELETED_SUCCESSFULLY_RESPONSE,
      statusCode: HttpStatus.OK,
    };
  }
}
