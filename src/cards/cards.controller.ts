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
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CardsService } from './cards.service';
import {
  CARD_DELETED_SUCCESSFULLY_RESPONSE,
  CARDS_CREATED_SUCCESSFULLY_RESPONSE,
} from '../common/constants.util';
import { IResponse } from '../common/interfaces/common.interface';
import { CardQueryDto } from './dto/card-query.dto';
import { CreateCardDto } from './dto/create-card.dto';
import { ICardsCreateResponse } from './interfaces/cards.interface';
import { CardDocument } from './schema/card.schema';
import { CardsControllerSwagger } from './swagger/cards-controller.swagger';

@ApiTags('Cards')
@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation(CardsControllerSwagger.post.apiOperation)
  @ApiCreatedResponse(CardsControllerSwagger.post.apiCreatedResponse)
  @ApiBadRequestResponse(CardsControllerSwagger.post.apiBadRequestResponse)
  @ApiUnauthorizedResponse(CardsControllerSwagger.post.apiUnauthorizedResponse)
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
  @ApiUnauthorizedResponse(CardsControllerSwagger.get.apiUnauthorizedResponse)
  async findAll(@Query() query?: CardQueryDto): Promise<CardDocument[]> {
    return this.cardsService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation(CardsControllerSwagger.getId.apiOperation)
  @ApiOkResponse(CardsControllerSwagger.getId.apiOkResponse)
  @ApiBadRequestResponse(CardsControllerSwagger.getId.apiBadRequestResponse)
  @ApiUnauthorizedResponse(CardsControllerSwagger.getId.apiUnauthorizedResponse)
  async findOne(@Param('id') id: string): Promise<CardDocument> {
    return this.cardsService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation(CardsControllerSwagger.delete.apiOperation)
  @ApiOkResponse(CardsControllerSwagger.delete.apiOkResponse)
  @ApiBadRequestResponse(CardsControllerSwagger.delete.apiBadRequestResponse)
  @ApiUnauthorizedResponse(CardsControllerSwagger.delete.apiUnauthorizedResponse)
  async remove(@Param('id') id: string): Promise<IResponse> {
    await this.cardsService.remove(id);

    return {
      id,
      message: CARD_DELETED_SUCCESSFULLY_RESPONSE,
      statusCode: HttpStatus.OK,
    };
  }
}
