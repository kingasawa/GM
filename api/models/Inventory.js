// /**
//  * Material.js
//  *
//  * @description :: TODO: You might write a short summary of how this model works and what it represents here.
//  * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
//  */
//
// module.exports = {
//
//   attributes: {
//     name: {
//       type: 'string',
//       unique: true,
//       index: true,
//       notNull: true
//     },
//     brand: {
//       type: 'string',
//       // notNull: true
//     },
//     type: {
//       type: 'string',
//       index: true,
//       notNull: true
//     },
//     orderid: {
//       type: 'integer'
//     },
//     description: {
//       type: 'longtext'
//     },
//     size: {
//       collection: 'materialsize',
//       via: 'material'
//     },
//     color: {
//       collection: 'materialcolor',
//       via: 'material'
//     },
//     image: {
//       collection: 'materialimage',
//       via: 'material'
//     },
//     cost: {
//       collection: 'materialcost',
//       via: 'material'
//     },
//     config: {
//       collection: 'materialconfig',
//       via: 'material'
//     },
//     product: {
//       collection: 'product',
//       via: 'material'
//     }
//   }
// };
//
