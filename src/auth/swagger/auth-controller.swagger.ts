import { HttpStatus } from '@nestjs/common';

import {
  FORGOT_PASSWORD_RESPONSE,
  USER_CREATED_SUCCESSFULLY_RESPONSE,
  USER_EDITED_SUCCESSFULLY_RESPONSE,
} from '../../common/constants.util';

export const AuthControllerSwagger = {
  postForgotPassword: {
    apiOperation: {
      summary: `Change user password due to forgotten password - step of sending link to user's email.`,
    },
    apiAcceptedResponse: {
      example: {
        message: FORGOT_PASSWORD_RESPONSE,
        statusCode: HttpStatus.ACCEPTED,
      },
    },
    apiBadRequestResponse: {
      example: {
        EXAMPLE_ONE: {
          message: ['email must be an email', 'email should not be empty'],
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        },
      },
    },
  },
  postLogin: {
    apiOperation: { summary: 'User login.' },
    apiOkResponse: {
      example: {
        accessToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzBmOWU5MTgzZDQ0ZTcxYWZkNmEyYjUiLCJpYXQiOjE3MjkyMDMzMjEsImV4cCI6MTcyOTIwMzM4MX0.eUYBET2kpm1R9QzV9J1ocJHljHwRzuv7R8WtgBT92BE',
        refreshToken: 'f0b36913-bef9-4b8d-931c-d44eaff30227',
      },
    },
    apiBadRequestResponse: {
      example: {
        EXAMPLE_ONE: {
          message: [
            'name must be a string',
            'name should not be empty',
            'email must be an email',
            'email should not be empty',
            'password must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
            'password must be a string',
            'password should not be empty',
          ],
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        },
      },
    },
    apiUnauthorizedResponse: {
      example: {
        EXAMPLE_ONE: {
          error: 'Unauthorized',
          message: 'wrong credentials',
          statusCode: HttpStatus.UNAUTHORIZED,
        },
      },
    },
  },
  postRefreshToken: {
    apiOperation: { summary: 'User refresh token.' },
    apiOKResponse: {
      example: {
        accessToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzBmOWU5MTgzZDQ0ZTcxYWZkNmEyYjUiLCJpYXQiOjE3MjkyMDMzMjEsImV4cCI6MTcyOTIwMzM4MX0.eUYBET2kpm1R9QzV9J1ocJHljHwRzuv7R8WtgBT92BE',
        refreshToken: 'f0b36913-bef9-4b8d-931c-d44eaff30227',
      },
    },
    apiBadRequestResponse: {
      example: {
        EXAMPLE_ONE: {
          message: ['refreshToken must be a UUID', 'refreshToken should not be empty'],
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
        EXAMPLE_TWO: {
          error: 'Unauthorized',
          message: 'invalid Refresh Token',
          statusCode: HttpStatus.UNAUTHORIZED,
        },
      },
    },
  },
  postSignUp: {
    apiOperation: { summary: 'Create a user' },
    apiCreatedResponse: {
      example: {
        id: '66ed5b2b7afb4666ea0eb0b6',
        message: USER_CREATED_SUCCESSFULLY_RESPONSE,
        statusCode: HttpStatus.CREATED,
      },
    },
    apiBadRequestResponse: {
      example: {
        EXAMPLE_ONE: {
          message: [
            'name must be a string',
            'name should not be empty',
            'email must be an email',
            'email should not be empty',
            'password must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
            'password must be a string',
            'password should not be empty',
          ],
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        EXAMPLE_TWO: {
          message: 'email attribute(s) must be unique.',
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        },
      },
    },
  },
  patchChangePassword: {
    apiOperation: { summary: 'Change password, when user logged in.' },
    apiOKResponse: {
      example: {
        id: '66ed5b2b7afb4666ea0eb0b6',
        message: USER_EDITED_SUCCESSFULLY_RESPONSE,
        statusCode: HttpStatus.OK,
      },
    },
    apiBadRequestResponse: {
      example: {
        EXAMPLE_ONE: {
          message: [
            'newPassword must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
            'newPassword must be a string',
            'newPassword should not be empty',
            'oldPassword must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
            'oldPassword must be a string',
            'oldPassword should not be empty',
          ],
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
        EXAMPLE_TWO: {
          error: 'Unauthorized',
          message: 'wrong credentials',
          statusCode: HttpStatus.UNAUTHORIZED,
        },
      },
    },
  },
  patchResetPassword: {
    apiOperation: {
      summary: 'Change user password due to forgotten password - receiving new password step.',
    },
    apiOKResponse: {
      example: {
        message: USER_EDITED_SUCCESSFULLY_RESPONSE,
        statusCode: HttpStatus.OK,
      },
    },
    apiBadRequestResponse: {
      example: {
        EXAMPLE_ONE: {
          message: [
            'resetToken must be a UUID',
            'resetToken should not be empty',
            'newPassword must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
            'newPassword must be a string',
            'newPassword should not be empty',
          ],
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        },
      },
    },
    apiUnauthorizedResponse: {
      example: {
        EXAMPLE_ONE: {
          error: 'Unauthorized',
          message: 'invalid password reset link.',
          statusCode: HttpStatus.UNAUTHORIZED,
        },
      },
    },
  },
};
