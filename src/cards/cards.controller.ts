import {
  Controller,
  Post,
  Body,
  HttpStatus,
  Get,
  HttpCode,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CardsService } from './cards.service';
import { CardQueryDto } from './dto/card-query.dto';
import { CreateCardDto } from './dto/create-card.dto';
import { ICardsCreateResponse, ICardDeleteResponse } from './interfaces/cards.interface';
import { CardDocument } from './schema/card.schema';
import {
  CARD_DELETED_SUCCESSFULLY_RESPONSE,
  CARDS_CREATED_SUCCESSFULLY_RESPONSE,
} from './utils/string-literals.util';
import { CardsControllerSwagger } from './swagger/cardsController.swagger';

@ApiTags('Cards')
@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation(CardsControllerSwagger.post.apiOperation)
  @ApiCreatedResponse(CardsControllerSwagger.post.apiOkResponse)
  @ApiBadRequestResponse(CardsControllerSwagger.post.apiBadRequestResponse)
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
  @ApiOperation(CardsControllerSwagger.get.apiOperation)
  @ApiOkResponse(CardsControllerSwagger.get.apiOkResponse)
  async findAll(@Query() query?: CardQueryDto): Promise<CardDocument[]> {
    return this.cardsService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation(CardsControllerSwagger.getId.apiOperation)
  @ApiOkResponse(CardsControllerSwagger.getId.apiOkResponse)
  @ApiBadRequestResponse(CardsControllerSwagger.getId.apiBadRequestResponse)
  async findOne(@Param('id') id: string): Promise<CardDocument> {
    return this.cardsService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation(CardsControllerSwagger.delete.apiOperation)
  @ApiOkResponse(CardsControllerSwagger.delete.apiOkResponse)
  @ApiBadRequestResponse(CardsControllerSwagger.delete.apiBadRequestResponse)
  async remove(@Param('id') id: string): Promise<ICardDeleteResponse> {
    await this.cardsService.remove(id);

    return {
      id,
      message: CARD_DELETED_SUCCESSFULLY_RESPONSE,
      statusCode: HttpStatus.OK,
    };
  }
}
