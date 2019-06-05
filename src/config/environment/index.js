/* eslint-disable */

import path from 'path';
import _ from 'lodash';

// function requiredProcessEnv(name) {
//   if(!process.env[name]) {
//     throw new Error('You must set the ' + name + ' environment variable');
//   }
//   return process.env[name];
// }

// All configurations will extend these options
// ============================================
const all = {

  env: process.env.NODE_ENV || 'development',
  port: process.env.NODE_ENVPORT || 3000

};

// Export the config object based on the NODE_ENV
// ==============================================
export const config = _.merge(
  all,
  require('./shared'),
  require(`./${all.env}.js`) || {},
);

export default { config };
