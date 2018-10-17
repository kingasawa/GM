const ORDERHIVE_ACCOUNT = 13978;
const ORDERHIVE_TOKEN = 'hhmEvCurCFBmcGwvrexBbbtyGr';
import request from 'superagent';

let tokenData = {
  "tokenId": ORDERHIVE_TOKEN,
  "tenantId": ORDERHIVE_ACCOUNT
}
module.exports = {
  itemView: async(itemId = 14603989) => {
    let postData = {
      method: "item_view",
      itemId,
      ...tokenData
    }
    let url = 'https://app.orderhive.com/orderhivews/index/V2';

    let data = await request
      .post(url)
      .send(postData)
      .set('Content-Type', 'application/json')
      .then((res) => {
        if(res.status === 200){
          try {
            return JSON.parse(res.text)
          } catch(e) {
            return false
          }
        }
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
  createProduct: async(productData) => {
    let {
      name, sku, qty, article_no,
      barcode, brand, description, buy_price, wholesale_price, retail_price
    } = productData;

    let postData = {
      "method": "create_simple_item",
      "name": name,
      "sku": sku,
      "qty": parseInt(qty, 10),
      "article_no": article_no || '',
      "barcode": barcode || '',
      "brand": brand || '',
      "description": description || '',
      "buy_price": parseFloat(buy_price),
      "wholesale_price": parseFloat(wholesale_price),
      "retail_price": parseFloat(retail_price),
      ...tokenData
    }
    let url = 'https://app.orderhive.com/orderhivews/index/V4';

    let data = await request
      .post(url)
      .send(postData)
      .set('Content-Type', 'application/json')
      .then((res) => {
        if(res.status === 200){
          try {
            return JSON.parse(res.text)
          } catch(e) {
            return false
          }
        }
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
};
