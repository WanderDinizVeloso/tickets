export const CreateOrdersDTOSwagger = {
  'product.id': {
    apiProperty: {
      description: 'Product id. Characteristics: string, not empty.',
      example: '66ed5b2b7afb4666ea0eb0b5',
    },
  },
  'product.quantity': {
    apiProperty: {
      description: 'Product quantity. Characteristics: string, three decimal digits, not empty.',
      example: '3.000',
    },
  },
};

export const OrderQueryDTOSwagger = {
  id: {
    apiProperty: {
      description: `List with one or more ids to filter. For more than one 'id' you must group them with comma separation without spaces. Examples: '66ed5b2b7afb4666ea0eb0b5' or '66ed5b2b7afb4666ea0eb0b5,66ed5b2b7afb4666ea0eb0b6,66ed5b2b7afb4666ea0eb0b7'`,
      required: false,
      type: String,
    },
  },
  active: {
    apiProperty: {
      description: 'Returns active (true) or disabled (false) products',
      enum: ['true', 'false'],
      required: false,
      default: 'true',
      type: String,
    },
  },
};
