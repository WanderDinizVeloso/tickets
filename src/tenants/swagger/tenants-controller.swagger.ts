import { HttpStatus } from '@nestjs/common';

import {
  TENANT_CREATED_SUCCESSFULLY_RESPONSE,
  TENANT_DELETED_SUCCESSFULLY_RESPONSE,
  TENANT_EDITED_SUCCESSFULLY_RESPONSE,
} from '../../constants.util';

const tenantExample = {
  id: '66ed5b2b7afb4666ea0eb0b5',
  name: 'Pizzaria Boa Pizza Ltda.',
  document: '11224345000146',
};

export const TenantsControllerSwagger = {
  post: {
    apiOperation: { summary: 'Create a tenant' },
    apiOkResponse: {
      example: {
        id: tenantExample.id,
        message: TENANT_CREATED_SUCCESSFULLY_RESPONSE,
        statusCode: HttpStatus.CREATED,
      },
    },
    apiBadRequestResponse: {
      example: {
        EXAMPLE_ONE: {
          message: [
            'name must be a string',
            'name should not be empty',
            'document must be a string',
            'document should not be empty',
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
          message: 'document attribute(s) must be unique.',
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        },
      },
    },
  },
  get: {
    apiOperation: { summary: 'Search a tenants list' },
    apiOkResponse: {
      example: [tenantExample],
    },
  },
  getId: {
    apiOperation: { summary: 'Search a tenant' },
    apiOkResponse: {
      example: tenantExample,
    },
    apiBadRequestResponse: {
      example: {
        EXAMPLE_ONE: {
          error: 'Bad Request',
          message: 'tenant does not exist.',
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
    apiOperation: { summary: 'Edit a tenant' },
    apiOkResponse: {
      example: {
        id: tenantExample.id,
        message: TENANT_EDITED_SUCCESSFULLY_RESPONSE,
        statusCode: HttpStatus.OK,
      },
    },
    apiBadRequestResponse: {
      example: {
        EXAMPLE_ONE: {
          message: [
            'name must be a string',
            'name should not be empty',
            'document must be a string',
            'document should not be empty',
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
          message: 'name attribute(s) must be unique.',
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        EXAMPLE_FOUR: {
          error: 'Bad Request',
          message: 'tenant does not exist.',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        EXAMPLE_FIVE: {
          error: 'Bad Request',
          message: 'id attribute is invalid.',
          statusCode: HttpStatus.BAD_REQUEST,
        },
      },
    },
  },
  delete: {
    apiOperation: { summary: 'Remove a tenant' },
    apiOkResponse: {
      example: {
        id: tenantExample.id,
        message: TENANT_DELETED_SUCCESSFULLY_RESPONSE,
        statusCode: HttpStatus.OK,
      },
    },
    apiBadRequestResponse: {
      example: {
        EXAMPLE_ONE: {
          error: 'Bad Request',
          message: 'tenant does not exist.',
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
