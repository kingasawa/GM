/**
 * TransactionController
 *
 * @description :: Server-side logic for managing aboutuses
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
import QueryBuilder from 'node-datatable';
import bluebird from 'bluebird';
import replace from 'lodash.replace';
import uuidv4 from 'uuid/v4';
import sumBy from 'lodash.sumby';
import concat from 'lodash.concat';
import sumby from 'lodash.sumby';

module.exports = {
  database: async(req,res) => {
    bluebird.promisifyAll(Order);

    let query = `SELECT owner,username,shop,sum(total_item_price) as amount, array_agg(order_name) as orders
                  FROM public.order as o
                  LEFT JOIN public.user u on o.owner = u.id
                  WHERE "tracking" = 'Fulfilled'
                  AND "payment_status" is null
                  AND o."createdAt" <= '2017-08-11 13:25:26+00'
                  GROUP BY username,o.owner,shop
                  Order by "owner" asc`;

    let result = await Order.queryAsync(query);
    let credit = result.rows;
    let shopData = _.map(credit, 'shop');
    let totalAmount = sumby(result, 'amount');

    console.log('shopData',shopData );
    return res.view('acp/credit',{credit,shopData,totalAmount})
    // return res.json(credit);

  },

  detail: async(req,res) => {
    bluebird.promisifyAll(Order);
      let { user } = req.allParams();
      let selectQuery = 'owner,order_name, total_item, total_item_basecost, shipping_fee, total_item_price, "createdAt"';
      let dateQuery = '2017-08-11 13:25:26+00';

      let query = `SELECT username,shop,order_name, total_item, total_item_basecost, shipping_fee, total_item_price, o."createdAt"
                    FROM public.order as o
                    LEFT JOIN public.user u on o.owner = u.id
                    WHERE "tracking" = 'Fulfilled'
                    AND "payment_status" is null
                    AND o."createdAt" <= '2017-08-11 13:25:26+00'
                    AND "owner" = '${user}'`

      let result = await Order.queryAsync(query);
      let creditDetail = result.rows;

      let shopData = _.map(creditDetail,'shop');
      shopData = _.uniq(shopData);

      let totalQuantity = sumby(creditDetail, 'total_item');
      let totalBaseCost = sumby(creditDetail, 'total_item_basecost');
      let totalShippingFee = sumby(creditDetail, 'shipping_fee');
      let totalAmount = sumby(creditDetail, 'total_item_price');
      let data = {shopData,totalQuantity,totalBaseCost,totalShippingFee,totalAmount,creditDetail};

      return res.view('acp/detail_credit',{data});
  },

};

