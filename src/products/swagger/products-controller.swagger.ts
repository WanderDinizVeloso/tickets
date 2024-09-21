import { HttpStatus } from '@nestjs/common';

import {
  PRODUCT_CREATED_SUCCESSFULLY_RESPONSE,
  PRODUCT_DELETED_SUCCESSFULLY_RESPONSE,
  PRODUCT_EDITED_SUCCESSFULLY_RESPONSE,
} from '../utils/products-string-literals.util';

const productExample = { id: '66ed5b2b7afb4666ea0eb0b5', name: 'Coca-Cola 200ml', price: '1.99' };

export const ProductsControllerSwagger = {
  post: {
    apiOperation: { summary: 'Create a product' },
    apiOkResponse: {
      example: {
        id: productExample.id,
        message: PRODUCT_CREATED_SUCCESSFULLY_RESPONSE,
        statusCode: HttpStatus.CREATED,
      },
    },
    apiBadRequestResponse: {
      example: {
        EXAMPLE_ONE: {
          message: [
            'name must be a string',
            'name should not be empty',
            `price attribute is not a valid positive decimal number. It must be a string, positive and contain a 2 digit decimal separated by a period. ex.: '1.01'.`,
            'price should not be empty',
          ],
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        EXAMPLE_TWO: {
          message: 'name attribute(s) must be unique.',
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        },
      },
    },
  },
  get: {
    apiOperation: { summary: 'Search a products list' },
    apiOkResponse: {
      example: [productExample],
    },
  },
  getId: {
    apiOperation: { summary: 'Search a product' },
    apiOkResponse: {
      example: productExample,
    },
    apiBadRequestResponse: {
      example: {
        EXAMPLE_ONE: {
          error: 'Bad Request',
          message: 'product does not exist.',
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
  patch: {
    apiOperation: { summary: 'Edit a product' },
    apiOkResponse: {
      example: {
        id: productExample.id,
        message: PRODUCT_EDITED_SUCCESSFULLY_RESPONSE,
        statusCode: HttpStatus.OK,
      },
    },
    apiBadRequestResponse: {
      example: {
        EXAMPLE_ONE: {
          message: [
            'name must be a string',
            'name should not be empty',
            `price attribute is not a valid positive decimal number. It must be a string, positive and contain a 2 digit decimal separated by a period. ex.: '1.01'.`,
            'price should not be empty',
          ],
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        EXAMPLE_TWO: {
          message: 'name attribute(s) must be unique.',
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        EXAMPLE_THREE: {
          error: 'Bad Request',
          message: 'product does not exist.',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        EXAMPLE_FOUR: {
          error: 'Bad Request',
          message: 'id attribute is invalid.',
          statusCode: HttpStatus.BAD_REQUEST,
        },
      },
    },
  },
  delete: {
    apiOperation: { summary: 'Remove a product' },
    apiOkResponse: {
      example: {
        id: productExample.id,
        message: PRODUCT_DELETED_SUCCESSFULLY_RESPONSE,
        statusCode: HttpStatus.OK,
      },
    },
    apiBadRequestResponse: {
      example: {
        EXAMPLE_ONE: {
          error: 'Bad Request',
          message: 'product does not exist.',
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
