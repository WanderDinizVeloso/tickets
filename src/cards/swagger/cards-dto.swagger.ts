export const CreateCardsDTOSwagger = {
  orderId: {
    apiProperty: {
      description: 'Order Id. Characteristics: string, not empty.',
      example: '66ed5b2b7afb4666ea0eb0b5',
    },
  },
};

export const CardQueryDTOSwagger = {
  id: {
    apiProperty: {
      description: `List with one or more ids to filter. For more than one 'id' you must group them with comma separation without spaces. Examples: '66ed5b2b7afb4666ea0eb0b5' or '66ed5b2b7afb4666ea0eb0b5,66ed5b2b7afb4666ea0eb0b6,66ed5b2b7afb4666ea0eb0b7'`,
      required: false,
      type: String,
    },
  },
  active: {
    apiProperty: {
      description: 'Returns active (true) or disabled (false) cards',
      enum: ['true', 'false'],
      required: false,
      default: 'true',
      type: String,
    },
  },
  orderId: {
    apiProperty: {
      description: `List with one or more orderIds to filter. For more than one 'orderId' you must group them with comma separation without spaces. Examples: '66ed5b2b7afb4666ea0eb0b5' or '66ed5b2b7afb4666ea0eb0b5,66ed5b2b7afb4666ea0eb0b6,66ed5b2b7afb4666ea0eb0b7'`,
      required: false,
      type: String,
    },
  },
};
