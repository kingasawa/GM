module.exports = {
  attributes: {
    material: {
      model: 'material',
      required: true,
      unique: true,
    },
    us_shipping: {
      type: 'float'
    },
    us_extra: {
      type: 'float'
    },
    international_ship: {
      type: 'float'
    },
    international_extra: {
      type: 'float'
    }
  }
};

