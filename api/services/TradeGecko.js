const ACCESS_TOKEN = '85664e1046f6570b067830fc02f97bfdeb56c6e5d95e75d939b0a5cf1eaffd26';
import request from 'superagent';
import moment from 'moment';

let tokenData = {
  "access_token": ACCESS_TOKEN
}
module.exports = {
  getProduct: async (id) => {
    let data = {
      id, ...tokenData
    }
    let url = `https://api.tradegecko.com/products/${id || ''}`;

    let result = await request
      .get(url)
      .send(data)
      .set('Content-Type', 'application/json')
      .then((res) => {
        // console.log('getProduct res.status', res.status);
        // console.log('getProduct res.body', res.body);
        if (res.status === 200) {
          return res.body.product
        }
        return res.body
        // Calling the end function will send the request
      }).catch(err => {
        console.log('err', err);
        return false;
      });

    return result

  },
  createProduct: async (productData) => {
    let {
      name, brand, description, product_type, supplier, barcode, status,
    } = productData;

    let postData = {
      "name": name,
      "opt1": "Color",
      "opt2": "Size",
      "brand": brand,
      "description": description,
      "product_type": product_type,
      "supplier": supplier,
      "barcode": barcode || "",
      "status": status || "active", ...tokenData
    }
    let url = 'https://api.tradegecko.com/products';

    let data = await request
      .post(url)
      .send(postData)
      .set('Content-Type', 'application/json')
      .then((res) => {
        // console.log('createProduct res.status', res.status);
        // console.log('createProduct res.body', res.body);
        if (res.status === 201) {
          return res.body.product
        }
        return res.body
        // Calling the end function will send the request
      }).catch(err => {
        console.log('err', err);
        return false;
      });
    return data
  },
  updateProduct: async (id, productData) => {
    let {
      name, brand, description, product_type, supplier, barcode, status,
    } = productData;

    let postData = {
      "name": name,
      "opt1": "Color",
      "opt2": "Size",
      "brand": brand,
      "description": description,
      "product_type": product_type,
      "supplier": supplier,
      "barcode": barcode || "",
      "status": status || "active", ...tokenData
    }
    let url = `https://api.tradegecko.com/products/${id}`;

    let data = await request
      .put(url)
      .send(postData)
      .set('Content-Type', 'application/json')
      .then((res) => {
        // console.log('updateProduct res.status', res.status);
        // console.log('updateProduct res.body', res.body);
        if (res.status === 204) {
          return true
        }
        return false; // can not update
        // Calling the end function will send the request
      }).catch(err => {
        console.log('err', err);
        return false;
      });
    //   .buffer(false).parse((e)=>{
    //   console.log('e', e);
    //   return e
    // })

    // console.log('data', data);
    return data

  },
  deleteProduct: async (id) => {
    let url = `https://api.tradegecko.com/products/${id}`;
    let postData = {
      ...tokenData
    }
    let data = await request
      .del(url)
      .send(postData)
      .set('Content-Type', 'application/json')
      .then((res) => {
        console.log('deleteProduct res.status', res.status);
        console.log('deleteProduct res.body', res.body);
        if (res.status === 204) {
          return true
        }
        return false; // can not update
        // Calling the end function will send the request
      }).catch(err => {
        console.log('err', err);
        return false;
      });
    //   .buffer(false).parse((e)=>{
    //   console.log('e', e);
    //   return e
    // })

    // console.log('data', data);
    return data

  },
  getVariant: async (id) => {
    let data = {
      id, ...tokenData
    }
    let url = `https://api.tradegecko.com/variants/${id || ''}`;

    let result = await request
      .get(url)
      .send(data)
      .set('Content-Type', 'application/json')
      .then((res) => {
        // console.log('getVariant res.status', res.status);
        // console.log('getVariant res.body', res.body);
        if (res.status === 200) {
          return res.body.variant
        }
        return res.body
        // Calling the end function will send the request
      }).catch(err => {
        console.log('err', err);
        return false;
      });

    return result
  },
  createVariant: async (product_id, productData) => {
    let {
      name, opt1, opt2, sku, weight_value, weight_unit, keep_selling, buy_price, retail_price, wholesale_price
    } = productData;

    let postData = {
      "variant": {
        "product_id": product_id,
        "name": name,
        "opt1": opt1 || '',
        "opt2": opt2 || '',
        "sku": sku || '',
        "keep_selling": keep_selling || true,
        "weight_value": weight_value,
        "weight_unit": weight_unit || 'oz',
        "variant_prices": [
          {
            "price_list_id": "buy",
            "value": buy_price || ""
          }, {
            "price_list_id": "retail",
            "value": retail_price || ""
          }, {
            "price_list_id": "wholesale",
            "value": wholesale_price || ""
          }
        ], // "locations": [
        //   {
        //     "location_id": 111723,
        //     "stock_on_hand": 9.0,
        //     "committed_stock": 10,
        //     "bin_location": "A2-F3-E1",
        //     "reorder_point": 1000
        //   }
        // ]
      }, ...tokenData
    }
    let url = 'https://api.tradegecko.com/variants';

    let data = await request
      .post(url)
      .send(postData)
      .set('Content-Type', 'application/json')
      .then((res) => {
        // console.log('createVariant res.status', res.status);
        // console.log('createVariant res.body', res.body);
        if (res.status === 201) {
          return res.body.variant
        }
        return res.body
        // Calling the end function will send the request
      }).catch(err => {
        console.log('err', err);
        return false;
      });
    return data
  },
  updateVariant: async (id, productData) => {
    let {
      name, opt1, opt2, sku, weight_value, weight_unit, keep_selling, buy_price, retail_price, wholesale_price
    } = productData;

    let postData = {
      "name": name,
      "opt1": opt1 || '',
      "opt2": opt2 || '',
      "sku": sku || '',
      "keep_selling": keep_selling,
      "weight_value": weight_value,
      "weight_unit": weight_unit || 'oz',
      "variant_prices": [
        {
          "price_list_id": "buy",
          "value": buy_price || ""
        }, {
          "price_list_id": "retail",
          "value": retail_price || ""
        }, {
          "price_list_id": "wholesale",
          "value": wholesale_price || ""
        }
      ], // "locations": [
      //   {
      //     "location_id": 111723,
      //     "stock_on_hand": 9.0,
      //     "committed_stock": 10,
      //     "bin_location": "A2-F3-E1",
      //     "reorder_point": 1000
      //   }
      // ]

      ...tokenData
    }
    let url = `https://api.tradegecko.com/variants/${id}`;

    let data = await request
      .put(url)
      .send(postData)
      .set('Content-Type', 'application/json')
      .then((res) => {
        // console.log('updateVariant res.status', res.status);
        // console.log('updateVariant res.body', res.body);
        if (res.status === 204) {
          return true
        }
        return false; // can not update
        // Calling the end function will send the request
      }).catch(err => {
        console.log('err', err);
        return false;
      });
    return data
  },
  deleteVariant: async (id) => {

    let postData = {
      ...tokenData
    }
    let url = `https://api.tradegecko.com/variants/${id}`;

    let data = await request
      .put(url)
      .send(postData)
      .set('Content-Type', 'application/json')
      .then((res) => {
        // console.log('deleteVariant res.status', res.status);
        // console.log('deleteVariant res.body', res.body);
        if (res.status === 204) {
          return true
        }
        return false; // can not update
        // Calling the end function will send the request
      }).catch(err => {
        console.log('err', err);
        return false;
      });
    return data
  },
  getOrder: async (productData) => {
    let data = {
      id, ...tokenData
    }
    let url = `https://api.tradegecko.com/orders/${id || ''}`;

    let result = await request
      .get(url)
      .send(data)
      .set('Content-Type', 'application/json')
      .then((res) => {
        // console.log('getOrder res.status', res.status);
        // console.log('getOrder res.body', res.body);
        if (res.status === 200) {
          return res.body.order
        }
        return res.body
        // Calling the end function will send the request
      }).catch(err => {
        console.log('err', err);
        return false;
      });

    return result
  },
  createOrder: async (orderData) => {
    let {
      company_id, issued_at, billing_address_id,
      shipping_address_id, order_line_items
    } = orderData;

    // [
    //   {
    //     "variant_id": 32512669,
    //     "quantity": 2
    //   },
    //   {
    //     "variant_id": 32512781,
    //     "quantity": 5
    //   }
    // ]
    let postData = {
      "order": {
        "company_id": company_id || 15890479, //Gearment company proxy
        "issued_at": issued_at || moment().format('DD-MM-YYYY'), //fallback to current date
        "billing_address_id": billing_address_id || 19294849, //Gearment company proxy
        "shipping_address_id": shipping_address_id || 19294849, //Gearment company proxy
        "status": "active",
        "order_line_items": order_line_items
      },
      ...tokenData
    }
    let url = 'https://api.tradegecko.com/orders';

    let data = await request
      .post(url)
      .send(postData)
      .set('Content-Type', 'application/json')
      .then((res) => {
        // console.log('createOrder res.status', res.status);
        // console.log('createOrder res.body', res.body);
        if (res.status === 201) {
          return res.body.order
        }
        return res.body
        // Calling the end function will send the request
      }).catch(err => {
        console.log('err', err);
        return false;
      });
    return data
  },
  // Can not update line item here, update new function to update order line item later
  updateOrder: async (id, orderData) => {
    let {
      company_id, issued_at, billing_address_id,
      shipping_address_id, payment_status
    } = orderData;

    // [
    //   {
    //     "variant_id": 32512669,
    //     "quantity": 2
    //   },
    //   {
    //     "variant_id": 32512781,
    //     "quantity": 5
    //   }
    // ]
    let postData = {
      "order": {
        "company_id": company_id || 15890479, //Gearment company proxy
        "issued_at": issued_at || moment().format('DD-MM-YYYY'), //fallback to current date
        "billing_address_id": billing_address_id || 19294849, //Gearment company proxy
        "shipping_address_id": shipping_address_id || 19294849, //Gearment company proxy
        "status": "active",
      },
      ...tokenData
    }

    if(payment_status){
      postData.payment_status = payment_status;
    }
    let url = `https://api.tradegecko.com/orders/${id}`;

    let data = await request
      .put(url)
      .send(postData)
      .set('Content-Type', 'application/json')
      .then((res) => {
        // console.log('updateOrder res.status', res.status);
        // console.log('updateOrder res.body', res.body);
        if (res.status === 204) {
          return true
        }
        return false; // can not update
        // Calling the end function will send the request
      }).catch(err => {
        console.log('err', err);
        return false;
      });
    return data
  },
};
