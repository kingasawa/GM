module.exports = {
  attributes: {
    material: {
      model: 'material',
      required: true,
      unique: true,
    },
    minPay: {
      type:'float'
    },
    cost: {
      type: 'float',
      notNull: true,
      required: true
    },
  }
};

