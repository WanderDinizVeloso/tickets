import { HttpStatus } from '@nestjs/common';

import {
  ORDER_CREATED_SUCCESSFULLY_RESPONSE,
  ORDER_DELETED_SUCCESSFULLY_RESPONSE,
} from '../../constants.util';

const orderExample = {
  id: '66ed5b2b7afb4666ea0eb0b5',
  products: [
    {
      id: '66ed5b2b7afb4666ea0eb0b6',
      name: 'Coca-Cola 200ml',
      price: '1.65',
      quantity: '1.000',
      total: '1.65',
    },
    {
      id: '66ed5b2b7afb4666ea0eb0b7',
      name: 'X-Burger',
      price: '2.36',
      quantity: '1.000',
      total: '2.36',
    },
  ],
  total: '4.01',
};

export const OrdersControllerSwagger = {
  post: {
    apiOperation: { summary: 'Create a order' },
    apiCreatedResponse: {
      example: {
        id: orderExample.id,
        message: ORDER_CREATED_SUCCESSFULLY_RESPONSE,
        statusCode: HttpStatus.CREATED,
      },
    },
    apiBadRequestResponse: {
      example: {
        EXAMPLE_ONE: {
          message: [
            'products must be an array',
            'products should not be empty',
            'products.0.id attribute is invalid.',
            'products.0.id should not be empty',
            `products.0.quantity attribute is not a valid positive decimal number. It must be a string, positive and contain a 3 digit decimal separated by a period. ex.: '1.012'.`,
            'products.0.quantity should not be empty',
          ],
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        EXAMPLE_TWO: {
          message: `there are products not registered in the order list. id(s): ${orderExample.id}`,
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        EXAMPLE_THREE: {
          message: `there are repeated productIds in the products list. id(s): ${orderExample.id}`,
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        },
      },
    },
    apiUnauthorizedResponse: {
      example: {
        EXAMPLE_ONE: {
          error: 'Unauthorized',
          message: 'invalid Bearer Token',
          statusCode: HttpStatus.UNAUTHORIZED,
        },
      },
    },
  },
  get: {
    apiOperation: { summary: 'Search a orders list' },
    apiOkResponse: {
      example: [orderExample],
    },
    apiUnauthorizedResponse: {
      example: {
        EXAMPLE_ONE: {
          error: 'Unauthorized',
          message: 'invalid Bearer Token',
          statusCode: HttpStatus.UNAUTHORIZED,
        },
      },
    },
  },
  getId: {
    apiOperation: { summary: 'Search a order' },
    apiOkResponse: {
      example: orderExample,
    },
    apiBadRequestResponse: {
      example: {
        EXAMPLE_ONE: {
          error: 'Bad Request',
          message: 'order does not exist.',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        EXAMPLE_TWO: {
          error: 'Bad Request',
          message: 'id attribute is invalid.',
          statusCode: HttpStatus.BAD_REQUEST,
        },
      },
    },
    apiUnauthorizedResponse: {
      example: {
        EXAMPLE_ONE: {
          error: 'Unauthorized',
          message: 'invalid Bearer Token',
          statusCode: HttpStatus.UNAUTHORIZED,
        },
      },
    },
  },
  delete: {
    apiOperation: { summary: 'Remove a order' },
    apiOkResponse: {
      example: {
        id: orderExample.id,
        message: ORDER_DELETED_SUCCESSFULLY_RESPONSE,
        statusCode: HttpStatus.OK,
      },
    },
    apiBadRequestResponse: {
      example: {
        EXAMPLE_ONE: {
          error: 'Bad Request',
          message: 'order does not exist.',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        EXAMPLE_TWO: {
          error: 'Bad Request',
          message: 'id attribute is invalid.',
          statusCode: HttpStatus.BAD_REQUEST,
        },
      },
    },
    apiUnauthorizedResponse: {
      example: {
        EXAMPLE_ONE: {
          error: 'Unauthorized',
          message: 'invalid Bearer Token',
          statusCode: HttpStatus.UNAUTHORIZED,
        },
      },
    },
  },
};
