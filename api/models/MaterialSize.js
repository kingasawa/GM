module.exports = {
  attributes: {
    material: {
      model: 'material',
      required: true,
      unique: true,
    },
    size: {
      type: 'json',
      notNull: true,
      required: true
    },
  }
};

