import { Controller, Post, Body, HttpStatus, Get, HttpCode, Param, Delete } from '@nestjs/common';

import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { ICardsCreateResponse, ICardDeleteResponse } from './interfaces/cards.interface';
import { CardDocument } from './schema/card.schema';

const CARDS_CREATED_SUCCESSFULLY_RESPONSE = 'The cards were created successfully.';
const CARD_DELETED_SUCCESSFULLY_RESPONSE = 'The card deleted successfully.';

@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post()
  async create(@Body() createCardDto: CreateCardDto): Promise<ICardsCreateResponse> {
    const ids = await this.cardsService.create(createCardDto);

    return {
      ids,
      message: CARDS_CREATED_SUCCESSFULLY_RESPONSE,
      statusCode: HttpStatus.CREATED,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<CardDocument[]> {
    return this.cardsService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string): Promise<CardDocument> {
    return this.cardsService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<ICardDeleteResponse> {
    await this.cardsService.remove(id);

    return {
      id,
      message: CARD_DELETED_SUCCESSFULLY_RESPONSE,
      statusCode: HttpStatus.OK,
    };
  }
}