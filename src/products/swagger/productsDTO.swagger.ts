export const CreateProductDTOSwagger = {
  name: {
    apiProperty: {
      description: 'Product name. Characteristics: string, unique, not empty.',
      example: 'Coca-Cola 200ml',
    },
  },
  price: {
    apiProperty: {
      description: 'Product price. Characteristics: string, two decimal digits, not empty.',
      example: '2.99',
    },
  },
};

export const ProductQueryDTOSwagger = {
  id: {
    apiProperty: {
      description: `List with one or more ids to filter. For more than one 'id' you must group them with comma separation without spaces.`,
      example: `'66ed5b2b7afb4666ea0eb0b5' or '66ed5b2b7afb4666ea0eb0b5,66ed5b2b7afb4666ea0eb0b6,66ed5b2b7afb4666ea0eb0b7'`,
      required: false,
      type: String,
    },
  },
  active: {
    apiProperty: {
      description: 'Returns active (true) or disabled (false) products',
      enum: ['true', 'false'],
      example: 'true or false',
      required: false,
      default: true,
      type: String,
    },
  },
};
