export const ChangePasswordDTOSwagger = {
  newPassword: {
    apiProperty: {
      description:
        'User password. Characteristics: string, unique, not empty, must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number, 01 (one) of the following special characters: #?!@$%^&*-.',
      example: 'Example!',
    },
  },

  OldPassword: {
    apiProperty: {
      description:
        'User password. Characteristics: string, unique, not empty, must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number, 01 (one) of the following special characters: #?!@$%^&*-.',
      example: 'Example!',
    },
  },
};

export const LoginDTOSwagger = {
  email: {
    apiProperty: {
      description: 'User email. Characteristics: string, unique, not empty.',
      example: 'john.smith@example.com',
    },
  },
  password: {
    apiProperty: {
      description:
        'User email. Characteristics: string, unique, not empty, must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-.',
      example: 'Example!',
    },
  },
};

export const SignUpDTOSwagger = {
  name: {
    apiProperty: {
      description: 'User name. Characteristics: string, not empty.',
      example: 'John Smith',
    },
  },
  email: {
    apiProperty: {
      description: 'User email. Characteristics: string, unique, not empty.',
      example: 'john.smith@example.com',
    },
  },
  password: {
    apiProperty: {
      description:
        'User password. Characteristics: string, unique, not empty, must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number, 01 (one) of the following special characters: #?!@$%^&*-.',
      example: 'Example!',
    },
  },
};

export const RefreshTokenDTOSwagger = {
  refreshToken: {
    apiProperty: {
      description: 'User Refresh Token. Characteristics: string, UUID valid, not empty.',
      example: 'f0b36913-bef9-4b8d-931c-d44eaff30227',
    },
  },
};

export const ResetTokenDTOSwagger = {
  resetToken: {
    apiProperty: {
      description: 'User Reset Token. Characteristics: string, UUID valid, not empty.',
      example: 'f0b36913-bef9-4b8d-931c-d44eaff30227',
    },
  },
};
