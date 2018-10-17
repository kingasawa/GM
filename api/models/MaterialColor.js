module.exports = {
  attributes: {
    material: {
      model: 'material',
      required: true,
      unique: true,
    },
    color: {
      type: 'json',
      notNull: true,
      required: true
    },
  }
};

