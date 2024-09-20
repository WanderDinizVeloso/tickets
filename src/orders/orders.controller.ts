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
import { ApiTags } from '@nestjs/swagger';

import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { IOrdersResponse } from './interfaces/orders.interface';
import { OrdersService } from './orders.service';
import { OrderDocument } from './schema/order.schema';

const ORDER_CREATED_SUCCESSFULLY_RESPONSE = 'order created successfully.';
const ORDER_DELETED_SUCCESSFULLY_RESPONSE = 'order deleted successfully.';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
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
  async findAll(@Query() query?: OrderQueryDto): Promise<OrderDocument[]> {
    return this.ordersService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string): Promise<OrderDocument> {
    return this.ordersService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<IOrdersResponse> {
    await this.ordersService.remove(id);

    return {
      id,
      message: ORDER_DELETED_SUCCESSFULLY_RESPONSE,
      statusCode: HttpStatus.OK,
    };
  }
}
