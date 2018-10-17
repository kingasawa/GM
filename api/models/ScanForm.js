module.exports = {

  attributes: {
    batch_id: {
      type: 'string'
    },
    scan_form_id: {
      type: 'string'
    },
    shipments: {
      type: 'json'
    },
    tracking_codes: {
      type: 'json'
    },
    orders: {
      type: 'json'
    },
    status: {
      type: 'string'
    },
    form_url: {
      type: 'string'
    },
    form_type: {
      type: 'string'
    }

  }
};

