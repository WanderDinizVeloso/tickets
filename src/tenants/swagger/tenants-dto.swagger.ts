export const CreateTenantsDTOSwagger = {
  name: {
    apiProperty: {
      description: 'Tenant name. Characteristics: string, unique, not empty.',
      example: 'Pizzaria Boa Pizza Ltda.',
    },
  },
  document: {
    apiProperty: {
      description: 'Tenant document. Characteristics: string, unique, not empty.',
      example: '11224345000146',
    },
  },
};

export const TenantsQueryDTOSwagger = {
  id: {
    apiProperty: {
      description: `List with one or more ids to filter. For more than one 'id' you must group them with comma separation without spaces. Examples: '66ed5b2b7afb4666ea0eb0b5' or '66ed5b2b7afb4666ea0eb0b5,66ed5b2b7afb4666ea0eb0b6,66ed5b2b7afb4666ea0eb0b7'`,
      required: false,
      type: String,
    },
  },
  document: {
    apiProperty: {
      description: `List with one or more documents to filter. For more than one 'document' you must group them with comma separation without spaces. Examples: '11224345000146' or '11224345000146,11224345000147,11224345000148'`,
      required: false,
      type: String,
    },
  },
  active: {
    apiProperty: {
      description: 'Returns active (true) or disabled (false) tenants',
      enum: ['true', 'false'],
      required: false,
      default: 'true',
      type: String,
    },
  },
};
