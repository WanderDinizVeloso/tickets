import { HttpStatus } from '@nestjs/common';

import {
  CARD_DELETED_SUCCESSFULLY_RESPONSE,
  CARDS_CREATED_SUCCESSFULLY_RESPONSE,
} from '../../constants.util';

const cardExample = {
  id: '66ed5b2b7afb4666ea0eb0b6',
  name: 'Coca-Cola 200ml',
  price: '1.65',
  quantity: '1.000',
};

export const CardsControllerSwagger = {
  post: {
    apiOperation: { summary: 'Create a cards by orderId' },
    apiOkResponse: {
      example: {
        ids: ['66ed5b2b7afb4666ea0eb0b6', '66ed5b2b7afb4666ea0eb0b7'],
        message: CARDS_CREATED_SUCCESSFULLY_RESPONSE,
        statusCode: HttpStatus.CREATED,
      },
    },
    apiBadRequestResponse: {
      example: {
        EXAMPLE_ONE: {
          message: ['orderId attribute is invalid.', 'orderId should not be empty'],
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        EXAMPLE_TWO: {
          message: 'order does not exist.',
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        EXAMPLE_THREE: {
          message: 'cards have already been created for the specified orderId.',
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        },
      },
    },
  },
  get: {
    apiOperation: { summary: 'Search a cards list' },
    apiOkResponse: {
      example: [cardExample],
    },
  },
  getId: {
    apiOperation: { summary: 'Search a card' },
    apiOkResponse: {
      example: cardExample,
    },
    apiBadRequestResponse: {
      example: {
        EXAMPLE_ONE: {
          error: 'Bad Request',
          message: 'card does not exist.',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        EXAMPLE_TWO: {
          error: 'Bad Request',
          message: 'id attribute is invalid.',
          statusCode: HttpStatus.BAD_REQUEST,
        },
      },
    },
  },
  delete: {
    apiOperation: { summary: 'Remove a cards' },
    apiOkResponse: {
      example: {
        id: cardExample.id,
        message: CARD_DELETED_SUCCESSFULLY_RESPONSE,
        statusCode: HttpStatus.OK,
      },
    },
    apiBadRequestResponse: {
      example: {
        EXAMPLE_ONE: {
          error: 'Bad Request',
          message: 'card does not exist.',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        EXAMPLE_TWO: {
          error: 'Bad Request',
          message: 'id attribute is invalid.',
          statusCode: HttpStatus.BAD_REQUEST,
        },
      },
    },
  },
};
