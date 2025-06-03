import { createProductSchema } from '../../../src/services/pre_register/baseSchema.js';

const productid = '522050915453';
createProductSchema(productid)
  .then(result => console.log(JSON.stringify(result, null, 2)))
  .catch(error => console.error(error));

