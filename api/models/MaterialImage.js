import keyBy from 'lodash.keyby';

module.exports = {
  attributes: {
    material: {
      model: 'material',
      required: true,
      unique: true,
    },
    image: {
      type: 'json',
      notNull: true,
      required: true
    },
  },
  keyBy: async (key = 'material') => {
    let data = await MaterialImage.find();
    return keyBy(data, key);
  },
};

