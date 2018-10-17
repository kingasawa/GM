module.exports = {

  attributes: {
    token: {
      type: 'string',
      index: true
    },
    owner: {
      type: 'integer',
      model: 'user',
      unique: true,
    }

  }
};

