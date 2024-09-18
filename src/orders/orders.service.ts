import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { MonetaryDataService } from '../monetary-data/monetary-data.service';
import { IOrderPayloadAcc, IOrderPayload, IProduct } from './interfaces/orders.interface';
import { ProductsService } from '../products/products.service';
import { ProductDocument } from '../products/schema/product.schema';
import { Order, OrderDocument } from './schema/order.schema';

const ONE = 1;
const ORDER_NOT_EXIST_RESPONSE = 'The order does not exist.';
const PRODUCTS_NOT_REGISTERED_RESPONSE = 'There are products not registered in the order list.';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly monetaryDataService: MonetaryDataService,
    private readonly productsService: ProductsService,
  ) {}
  async create(createOrderDto: CreateOrderDto): Promise<string> {
    const orderProducts = await this.findProductsDatabase(createOrderDto);

    const response = await this.orderModel.create(
      this.getOrderPayload(createOrderDto, orderProducts),
    );

    if (response?._id) {
      return response._id.toString();
    }
  }

  async findAll(query?: OrderQueryDto): Promise<OrderDocument[]> {
    return await this.orderModel.find(this.getFilterQuery(query));
  }

  findUnregisteredProductIds(
    createOrderDto: CreateOrderDto,
    productsDatabase: ProductDocument[],
  ): string[] {
    const registeredProductIds = productsDatabase.map(({ _id }) => String(_id));

    return createOrderDto.products.reduce((acc: string[], { id }): string[] => {
      if (!registeredProductIds.includes(id)) {
        acc.push(id);
      }

      return acc;
    }, []);
  }

  async findOne(_id: string): Promise<OrderDocument> {
    const response = await this.orderModel.findOne({ _id, active: true });

    if (!response) {
      throw new BadRequestException(ORDER_NOT_EXIST_RESPONSE);
    }

    return response;
  }

  findOrderTotalPrice(products: IProduct[]): string {
    return products.reduce((acc: string, { total }) => {
      acc = this.monetaryDataService.add([acc, total]);

      return acc;
    }, '0.00');
  }

  async findProductsDatabase(createOrderDto: CreateOrderDto): Promise<ProductDocument[]> {
    const products = await this.productsService.findAll({
      id: createOrderDto.products.map(({ id }) => id),
      active: [true],
    });

    if (products.length !== createOrderDto.products.length) {
      const UnregisteredProductIds = this.findUnregisteredProductIds(createOrderDto, products);

      throw new BadRequestException(
        `${PRODUCTS_NOT_REGISTERED_RESPONSE} id(s): ${UnregisteredProductIds.join(', ')}`,
      );
    }

    return products;
  }

  getFilterQuery(query: OrderQueryDto): Record<string, unknown> {
    return Object.entries(query).reduce((acc: Record<string, unknown>, [key, values]) => {
      const reduceKey = key === 'id' ? '_id' : key;

      if (values) {
        acc[reduceKey] = { $in: values };
      }

      return acc;
    }, {});
  }

  getOrderPayload(
    createOrderDto: CreateOrderDto,
    productsDatabase: ProductDocument[],
  ): IOrderPayload {
    const { payload } = productsDatabase.reduce(
      (acc: IOrderPayloadAcc, { _id, name, price }, index) => {
        const IT_IS_THE_LAST_INDEX = index === productsDatabase.length - ONE;

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

        if (IT_IS_THE_LAST_INDEX) {
          const productsPayload = Object.values(acc.products);

          acc.payload.total = this.findOrderTotalPrice(productsPayload);

          acc.payload.products = productsPayload;
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

    return payload;
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
