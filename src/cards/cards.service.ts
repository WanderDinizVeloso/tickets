import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CardQueryDto } from './dto/card-query.dto';
import { CreateCardDto } from './dto/create-card.dto';
import { ICardPayload } from './interfaces/cards.interface';
import { MonetaryDataService } from '../monetary-data/monetary-data.service';
import { IProduct } from '../orders/interfaces/orders.interface';
import { OrdersService } from '../orders/orders.service';
import { Card, CardDocument } from './schema/card.schema';
import { ZERO } from './utils/magic-numbers.util';
import { CARD_NOT_EXIST_RESPONSE, CARDS_REGISTERED_RESPONSE } from './utils/string-literals.util';

@Injectable()
export class CardsService {
  constructor(
    @InjectModel(Card.name) private readonly cardModel: Model<CardDocument>,
    private readonly monetaryDataService: MonetaryDataService,
    private readonly ordersService: OrdersService,
  ) {}

  async create(createCardDto: CreateCardDto): Promise<string[]> {
    await this.validateRegisteredCards(createCardDto);

    const { products } = await this.ordersService.findOne(createCardDto.orderId);

    const cards = await this.cardModel.insertMany(
      this.getCardsPayload(createCardDto.orderId, products),
    );

    return cards.map(({ _id }) => String(_id));
  }

  async findAll(query?: CardQueryDto): Promise<CardDocument[]> {
    return await this.cardModel.find(this.getFilterQuery(query));
  }

  async findOne(_id: string): Promise<CardDocument> {
    const response = await this.cardModel.findOne({ _id, active: true });

    if (!response) {
      throw new BadRequestException(CARD_NOT_EXIST_RESPONSE);
    }

    return response;
  }

  getCardsPayload(orderId: string, products: IProduct[]): ICardPayload[] {
    return products.reduce((acc: ICardPayload[], { id, name, price, quantity }) => {
      const [integer, decimal] = quantity.split('.');

      if (Number(integer) > ZERO) {
        const cardQuantity = this.monetaryDataService.setToPrecision34Digits('1.000');

        const cardPrice = this.monetaryDataService.multiply([cardQuantity, price]);

        Array.from({ length: Number(integer) }, () =>
          acc.push({ productId: id, orderId, name, price: cardPrice, quantity: cardQuantity }),
        );
      }

      if (Number(decimal) > ZERO) {
        const cardQuantity = this.monetaryDataService.setToPrecision34Digits(`0.${decimal}`);

        const cardPrice = this.monetaryDataService.multiply([cardQuantity, price]);

        acc.push({ productId: id, orderId, name, price: cardPrice, quantity: cardQuantity });
      }

      return acc;
    }, []);
  }

  getFilterQuery(query: CardQueryDto): Record<string, unknown> {
    return Object.entries(query).reduce((acc: Record<string, unknown>, [key, values]) => {
      const reduceKey = key === 'id' ? '_id' : key;

      if (values) {
        acc[reduceKey] = { $in: values };
      }

      return acc;
    }, {});
  }

  async remove(_id: string): Promise<void> {
    const response = await this.cardModel.findOneAndUpdate(
      { _id, active: true },
      { active: false },
    );

    if (!response) {
      throw new BadRequestException(CARD_NOT_EXIST_RESPONSE);
    }
  }

  async validateRegisteredCards(createCardDto: CreateCardDto): Promise<void> {
    const cards = await this.findAll({ orderId: [createCardDto.orderId], active: [true] });

    if (cards.length) {
      throw new BadRequestException(CARDS_REGISTERED_RESPONSE);
    }
  }
}
