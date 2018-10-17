module.exports = {
  // autoCreatedAt: false,
  // autoUpdatedAt: false,
  attributes: {
    // autoPK: false,
    id: {
      type: 'string',
      primaryKey: true
    },
    name: {
      type: 'string',
      index: true
    },
    type: {
      type: 'integer',
      defaultsTo: 1,
      index: true,
      enum: [1, 2, 3, 4, 5, 6, 7, 8, 9], // 1: design
    },
    owner: {
      model: 'user',
      required: true,
      index: true,
      integer: true
    }
  },
  // beforeCreate: async (values, next) => {
  //   const { owner } = values;
  //   console.log('values', values, owner);
  //   let foundUser = await User.findOne({id: owner});
  //
  //   if(foundUser === undefined) {
  //     return next(`User ID ${owner} not found`);
  //   }
  //
  //   console.log('foundUser', foundUser);
  //   sails.log.verbose('Order.beforeCreate', values);
  //   next();
  // },
};

