import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateOrderDto } from './dto/create-order.dto';
import { MonetaryDataService } from '../monetary-data/monetary-data.service';
import { ProductsService } from '../products/products.service';
import { Order, OrderDocument } from './schema/order.schema';
import { IOrderPayloadAcc } from './interfaces/orders.interface';

const ONE = 1;
const ORDER_NOT_EXIST_RESPONSE = 'The order does not exist.';
const PRODUCTS_NOT_REGISTERED_RESPONSE = 'There are products not registered in the order list';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly monetaryDataService: MonetaryDataService,
    private readonly productsService: ProductsService,
  ) {}
  async create(createOrderDto: CreateOrderDto): Promise<string> {
    const orderProducts = await this.productsService.findAllBetweenIds(
      createOrderDto.products.map(({ id }) => id),
    );

    if (orderProducts.length !== createOrderDto.products.length) {
      throw new BadRequestException(PRODUCTS_NOT_REGISTERED_RESPONSE);
    }

    const orderPayload = orderProducts.reduce(
      (acc: IOrderPayloadAcc, { _id, name, price }, index) => {
        const _idString = String(_id);

        const { id, quantity } = createOrderDto.products[index];

        if (!acc.products[_idString]) {
          acc.products[_idString] = {};
        }

        if (!acc.products[id]) {
          acc.products[id] = {};
        }

        acc.products[_idString].name = name;

        acc.products[_idString].price = this.monetaryDataService.setToPrecision34Digits(price);

        acc.products[id].id = id;

        acc.products[id].quantity = this.monetaryDataService.setToPrecision34Digits(quantity);

        if (acc.products[id].price && acc.products[id].quantity) {
          acc.products[id].total = this.monetaryDataService.multiply([
            acc.products[id].price,
            acc.products[id].quantity,
          ]);
        }

        if (acc.products[_idString].price && acc.products[_idString].quantity) {
          acc.products[_idString].total = this.monetaryDataService.multiply([
            acc.products[_idString].price,
            acc.products[_idString].quantity,
          ]);
        }

        if (index === orderProducts.length - ONE) {
          const productsPayload = Object.values(acc.products);

          const payloadTotal = Object.values(acc.products).reduce((acc: string, { total }) => {
            acc = this.monetaryDataService.add([acc, total]);

            return acc;
          }, '0.00');

          acc.payload.products = productsPayload;

          acc.payload.total = payloadTotal;
        }

        return acc;
      },
      {
        payload: {
          products: [],
          total: '0.00',
        },
        products: {},
      },
    );

    const response = await this.orderModel.create(orderPayload.payload);

    if (response?._id) {
      return response._id.toString();
    }
  }

  async findAll(): Promise<OrderDocument[]> {
    return await this.orderModel.find(
      { active: true },
      { active: false, createdAt: false, updatedAt: false },
    );
  }

  async findOne(_id: string): Promise<OrderDocument> {
    const response = await this.orderModel.findOne(
      { _id, active: true },
      { active: false, createdAt: false, updatedAt: false },
    );

    if (!response) {
      throw new BadRequestException(ORDER_NOT_EXIST_RESPONSE);
    }

    return response;
  }

  async remove(_id: string): Promise<void> {
    const response = await this.orderModel.findOneAndUpdate(
      { _id, active: true },
      { active: false },
    );

    if (!response) {
      throw new BadRequestException(ORDER_NOT_EXIST_RESPONSE);
    }
  }
}
