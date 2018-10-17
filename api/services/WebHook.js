const ENABLE_AUTO_PAY = false;
const REVALIDATE = true;

// Define default data
const DEFAULT_SIZE_PRICE = 8;
const DEFAULT_SHIPPING_WEIGHT = 0;

const { apiKey, apiSecret } = sails.config.shopify;

const DEFAULT_ITEM_SHIPPING_FEE = {
  us: {
    item_fee: 3.99,
    extra_fee: 1.5
  },
  international: {
    item_fee: 7.5,
    extra_fee: 5.95
  }
}
module.exports = {

  /**
   * Send a customized welcome email to the specified email address.
   *
   * @required {String} emailAddress
   *   The email address of the recipient.
   * @required {String} firstName
   *   The first name of the recipient.
   */
  Order: async (job, context, done) => {
    const { type, data } = job;
    const { params } = data;

    let syncOrder = 0;

    // infomation from shopify order
    const shippingCountryCode = _.get(params, 'shipping_address.country_code', '');
    let shippingCountryCodeLower = shippingCountryCode.toLowerCase();

    if (shippingCountryCode.toLowerCase() != 'us') {
      shippingCountryCodeLower = 'international';
    }

    // JOB QUEUE: shopifyordercreate, shopifyorderupdate
    sails.log.debug('WebHook:Order:run:type', type);
    sails.log.debug('WebHook:Order:run', params);

    Shop.findOne({
      name: params.shop
    }).populate('shopifytoken').exec(async (err, foundOwner) => {
      let owner = _.get(foundOwner, 'owner', null);
      let shopToken = _.get(foundOwner, 'shopifytoken[0].accessToken', null);

      let Shopify = new ShopifyApi({
        shop: params.shop,
        shopify_api_key: apiKey,
        access_token: shopToken,
      });


      const productDataKeyById = await Product.getProductKey();

      if (!owner) {
        sails.log.warn("Webhook:Shop.findOne:ownerNotFound", owner);
        return done();
      }

      // let findSync = 0;
      let items = [];

      for (let item of params.line_items) {


        let gearmentSKU = Report.getGearmentSKU(item.sku, item.vendor);

        sails.log.debug('WebHook:Order:gearmentSKU', gearmentSKU);
        if (gearmentSKU) {
          let {
            skuType, // new, old, veryOld
            campaignId, variantColor, variantSize, variantNameType, materialId, designId, mockupId, sizeId, frontSide, //New Sku with Vendor
            productId, data
          } = gearmentSKU;

          let itemBaseCost = DEFAULT_SIZE_PRICE;
          let materialData;
          let itemAddedInfo = {};

          if (skuType === 'unexpected') {
            sails.log.warn(`WebHook:Order:for:params:item skuType: ${skuType} - FILTERED`, data);
            continue;
          } else {
            sails.log.debug(`WebHook:Order:for:params:item skuType: ${skuType} - PASSED`);
          }

          // Update order has Gearment item
          syncOrder = 1;

          let stringDesignId;
          if (designId) { // NEW SKU
            let design = await Design.findOne({
              select: ['id'],
              where: { design_id: designId }
            });
            stringDesignId = _.get(design, 'id', null);
          } else {
            // @TODO *** old style will be removed ***
            let design = await Campaign.findOne({
              select: ['designID'],
              where: { id: campaignId }
            });
            stringDesignId = _.get(design, 'designID', null);
            // @TODO *** end old style will be removed ***
          }

          if (productId) { // NEW SKU
            let productData = _.get(productDataKeyById, productId, null);
            console.log('productData', productData);
            if (!productData) {
              sails.log.error(`Webhook:Order !productData, productId: ${productId}`);
              continue;
            }
            /* all product info here */
            let {
              material, brandCode, displayName, type, color, size, shippingWeight, base_price,
              tradegecko_id
            } = productData;

            shippingWeight = shippingWeight || DEFAULT_SHIPPING_WEIGHT;
            item.shippingWeight = shippingWeight;
            // Added info to line item
            itemAddedInfo = {
              tradegecko_id,
              color,
              size, // shippingWeight,
              // type,
              // brandCode,
            }

            materialData =
              await Material.findOne({ id: material }).populate('size').populate('shipfee');
            itemBaseCost = base_price || DEFAULT_SIZE_PRICE;
          } else {
            // Old SKU style
            // @TODO *** old style will be removed ***
            if (materialId) { // maybe wont go here materialId only support new SKU
              materialData =
                await Material.findOne({ id: materialId }).populate('size').populate('shipfee');
            } else {
              if (variantNameType) {
                materialData = await Material.findOne({
                  or: [
                    { type: variantNameType }, { oldType: variantNameType }
                  ]
                }).populate('size').populate('shipfee');
              } else {
                // Fallback for variantNameType
                let materialName = item.variant_title.split(' / ')[0];
                materialData = await Material.findOne({ name: materialName })
                                             .populate('size')
                                             .populate('shipfee');
              }
            }
            let sizeArray = _.get(materialData, 'size[0].size', []);
            let findSize;
            if (sizeId) { // New SKU
              findSize = await Option.findOne({ id: sizeId });
              findSize = findSize.value;
            } else { // old SKU
              findSize = item.variant_title.split(' / ')[2];
            }
            let sizeData = await sizeArray.find(a => a.size === findSize);
            itemBaseCost = _.get(sizeData, 'price', itemBaseCost);
            // @TODO *** end old style will be removed ***
          }

          // Add more infomation to item & update to gearment db
          item.design = `img.gearment.com/unsafe/${stringDesignId}`;
          item.item_fee =
            _.get(materialData,
              `shipfee[0].${shippingCountryCodeLower}_shipping`,
              DEFAULT_ITEM_SHIPPING_FEE[shippingCountryCodeLower]['item_fee']);
          item.extra_fee =
            _.get(materialData,
              `shipfee[0].${shippingCountryCodeLower}_extra`,
              DEFAULT_ITEM_SHIPPING_FEE[shippingCountryCodeLower]['extra_fee']);
          item.brand = materialData.brand;
          item.basecost = itemBaseCost;

          // merge with item added info, new SKU support

          let newItem = {
            ...item, ...itemAddedInfo
          }

          // Push item to line_items
          items.push(newItem)
        }
      }

      if(params.sync == 2){
        syncOrder = 2
      }
      sails.log.debug("items", items);

      if (syncOrder === 0) {
        let msg = "Skip order not sync, we could update info to other db";
        sails.log.debug(`WebHook:Order ${msg}`);
        return done(null, { msg });
      }

      let createOrder = {
        orderid: params.id,
        order_name: params.name,
        note: params.note,
        email: params.email,
        token: params.token,
        total_price: params.total_price,
        subtotal_price: params.subtotal_price,
        total_tax: params.total_tax,
        total_discounts: params.total_discounts,
        currency: params.currency,
        financial_status: params.financial_status,
        confirmed: params.confirmed,
        name: params.billing_address.name,
        referring_site: params.referring_site,
        customer: params.customer,
        shop: params.shop,
        owner: foundOwner.owner,
        line_items: items,
        billing_address: params.billing_address,
        shipping_address: params.shipping_address,
        sync: syncOrder
      };

      const foundOrder = await Order.findOne({ orderid: params.id });

      if (foundOrder) {

        let updateData = {};

        if(params.financial_status !== null){
          console.log('is not null');
          updateData.financial_status = params.financial_status;
        }

        console.log('check params',params );

        sails.log.debug("Webhook:Order updateData", JSON.stringify(updateData));
        if (params.financial_status == 'refunded' || params.financial_status == 'voided' || params.cancelled_at !== null) { // customer refund 1 order
          if (foundOrder.tracking !== 'Fulfilled'){
            updateData.tracking = 'Cancelled';
          }

        } else if (params.financial_status == 'partially_refunded' && params.refunds.length > 0) {
          // updateData.note = 'refund item';
          let itemsRefund = [];
          _.each(params.refunds, (itemRefund) => {
            _.each(itemRefund.refund_line_items, (item) => {
              let itemData = {
                variantID: item.line_item.variant_id,
                quantity: item.quantity
              };
              itemsRefund.push(itemData);
            })
          });

          //Nếu Order chưa fulfill thì mới đc refund
          //@TODO : trừ lại tiền đã tính trước đó .

          if (foundOrder.tracking !== 'Fulfilled' || foundOrder.tracking !== 'In-Production' ) {
            _.each(items, (item) => {
              _.each(itemsRefund, (item_refund) => {
                if (item.variant_id == item_refund.variantID) {
                  item.quantity = item.quantity - item_refund.quantity
                }
                // if(item.quantity = 0){
                //   delete item;
                // }
              })
            })
          }
        }

        updateData.line_items = items;

        Order.update({ orderid: params.id }, updateData)
             .exec(async function(err, resultUpdateOrder) {
               if (err) {
                 sails.log.error('WebHook:Order:Order.updated:error', err);
                 done(err);
               } else {
                 let response = {
                   event: 'update/order',
                   data: resultUpdateOrder[0]
                 };
                 let { orderid } = response.data;
                 const orderAnalyze = Report.Order({
                   orderid,
                   export_report: false,
                   REVALIDATE
                 });


                 if(!params.importorder){
                   let updateItem = [];
                   console.log('resultCreateOrder', resultUpdateOrder[0]);
                   await Promise.all(resultUpdateOrder[0].line_items.map(async (item) => {
                     await Shopify.get(`/admin/variants/${item.variant_id}.json`, async(variantErr, data) => {
                       let { variant: { image_id, product_id } } = data;
                       await Shopify.get(`/admin/products/${product_id}/images/${image_id}.json`,async (imageErr, imageData) => {
                         const { image: { src } } = imageData;
                         item.variant_img = src;

                         updateItem.push(item)
                       });
                     });

                   }));

                     setTimeout(() => {
                       if(updateItem.length > 0){
                         console.log('updateItem', updateItem);

                         Order.update({ orderid: params.id },{line_items:updateItem}).exec((err,resultUpdate)=>{
                           if(err) {
                             console.log('update order error', err);
                           }
                           console.log('params.id', params.id);
                           console.log('resultUpdate', resultUpdate);
                         })
                       }

                     },10000)


                 }


                 sails.log.debug('WebHook:Order:Order.update:success', response);
                 sails.log.debug('WebHook:Order:Order.update:success:orderAnalyze', orderAnalyze);
                 done(null, response);
               }
             })
      } else { //Create
        // Validate type
        const NO_VALIDATE_QUEUE_TYPE = true

        sails.log.debug('Webhook order start to create order', type);

        if (type === 'shopifyordercreate' || NO_VALIDATE_QUEUE_TYPE) {
          Order.create(createOrder).exec(async function(err, resultCreateOrder) {
            if (err) {
              sails.log.error('WebHook:Order:Order.create:error', err);
              done();
            } else {
              let response = {
                event: 'create/order',
                data: resultCreateOrder
              };
              let { orderid } = response.data;
              const orderAnalyze = Report.Order({
                orderid,
                export_report: false,
                REVALIDATE
              });

              // /* Auto pay start */
              // const UserData = await User.findOne(owner);
              //
              // if (!UserData) {
              //   sails.log.error('WebHook:Order:Order.updated:notfound:user_not_found');
              //   return done(null, { msg: 'user not found' });
              // }
              //
              // sails.log.debug("WebHook:Order:Order.updated:UserData", UserData);
              //
              // let { auto_pay } = UserData;
              //
              // if (ENABLE_AUTO_PAY && auto_pay === 1) {
              //   const orderData = await Order.findOne({ orderid });
              //
              //   let balance = _.get(UserData, 'balance', 0) | 0;
              //
              //   if (!orderData) {
              //     sails.log.error('WebHook:Order:Order.updated:notfound:orderid_not_found');
              //     return done(null, { msg: 'orderid not found' });
              //   }
              //
              //   let total_item_basecost = _.get(orderData, 'total_item_basecost', 0) | 0;
              //   let shipping_fee = _.get(orderData, 'shipping_fee', 0) | 0;
              //   let totalSellerPay = total_item_basecost + shipping_fee;
              //
              //   sails.log.debug('WebHook:Order:Order.update:orderData', orderData);
              //
              //   //@TODO create charge function in Model
              //   if (balance >= totalSellerPay) {
              //     sails.log.debug('WebHook:Order:Order.update:charge:totalSellerPay',
              //       totalSellerPay);
              //
              //     let remainingBalance = balance - totalSellerPay;
              //     // Charge money
              //     await User.update(owner, { balance: remainingBalance });
              //     // Change order status
              //     await Order.update({ orderid }, { tracking: 'In-Production' })
              //   } else {
              //     sails.log.warn(`WebHook:Order Not enough balance userid: ${owner}`);
              //   }
              // }
              // /* Auto pay end */
              if(!params.importorder){
                let updateItem = [];
                console.log('resultCreateOrder', resultCreateOrder);
                await Promise.all(resultCreateOrder.line_items.map(async (item) => {
                  await Shopify.get(`/admin/variants/${item.variant_id}.json`, async(variantErr, data) => {
                    let { variant: { image_id, product_id } } = data;
                    await Shopify.get(`/admin/products/${product_id}/images/${image_id}.json`,async (imageErr, imageData) => {
                      const { image: { src } } = imageData;
                      item.variant_img = src;

                      updateItem.push(item)
                    });
                  });

                }));

                setTimeout(() => {
                  if(updateItem.length > 0){
                    console.log('updateItem', updateItem);
                    Order.update({ orderid: params.id },{line_items:updateItem}).exec((err,resultUpdate)=>{
                      if(err) {
                        console.log('update order error', err);
                      }
                      console.log('params.id', params.id);
                      console.log('resultUpdate', resultUpdate);
                    })
                  }

                },10000)

              }



              sails.log.debug('WebHook:Order:Order.create:success', response);
              sails.log.debug('WebHook:Order:Order.create:success:orderAnalyze', orderAnalyze);
              done(null, response);
            }
          });
        } else {
          sails.log.error(
            'WebHook:Order Wrong type can not create order with type !shopifyordercreate');
          done();
        }
      }
    });
  },
  /**
   *
   * Push order to queue like NotificationController
   *
   * @param params
   * @returns {Promise.<void>}
   */
  pushOrder: async (params) => {
    sails.log.debug("WebHook pushOrder", {
      controller: 'WebHook',
      params
    });

    const publisher = sails.hooks.kue_publisher;

    let PRIORITY = 'critical';
    let QUEUE = 'shopifyordercreate';
    let TITLE_SUFFIX = 'Create';

    const JOB_TIMEOUT = 10*1000; // 30s // Timeout fail to update
    const TTL = 60*1000; // 60s failed -> mark as ttl failed
    const job = publisher.create(QUEUE, {
      title: `Shopify Order ${TITLE_SUFFIX}`,
      params
    })
                         .priority(PRIORITY)
                         .attempts(5) //why 2? Because this is update to DB
                         .backoff({
                           delay: JOB_TIMEOUT,
                           type: 'fixed'
                         })
                         .on('complete', function(result) {
                           if (result) {
                             const { event, data } = result;
                             sails.log.debug({
                               controller: 'WebHook',
                               msg: `order:completed:result`,
                               result
                             });
                             // sails.sockets.blast(event, { data });
                           } else {
                             sails.log.error({
                               controller: 'WebHook',
                               msg: `order:completed:Some thing wrong please check!!!`,
                             });
                           }
                         })
                         .on('failed attempt', function(errorMessage, doneAttempts) {
                           sails.log.error({
                             controller: 'WebHook',
                             msg: `order:failed_attempt`,
                             error: errorMessage
                           });
                         })
                         .on('failed', function(errorMessage) {
                           sails.log.debug({
                             controller: 'WebHook',
                             msg: `order:failed`,
                             error: errorMessage
                           });
                         })
                         .ttl(TTL)
                         .removeOnComplete(true)
                         .save();
  }
};
