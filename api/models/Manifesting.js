module.exports = {

  attributes: {
    batch_id: {
      type: 'string'
    },
    label_url: {
      type: 'string'
    },
    num_shipments: {
      type: 'integer'
    },
    shipments: {
      type: 'json'
    },
    state: {
      type: 'string'
    },
    status: {
      type: 'json'
    }

  }
};

