/**
 * CheckController
 *
 * @description :: Server-side logic for managing aboutuses
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const _ = require('lodash');
import uuidv4 from 'uuid/v4';
import bluebird from 'bluebird';
import concat from 'lodash.concat';
import sum from 'lodash.sum';
import moment from 'moment';
const request = require('request');
const { apiKey, apiSecret } = sails.config.shopify;

const easypostapi = 'VOlV03Gkzwt03ENcMBnbDQ';
const EasyPost = require('node-easypost');

const api = new EasyPost(easypostapi);

module.exports = {
  import: async (req,res)=>{
    let { id } = req.user;
    let { sid } = req.allParams();
    let validDataArray = [];
    let foundShop = await Promise.resolve(ManualShop.findOne({owner:id}))
    if(id,sid){

          let getData = await ImportCache.findOne({sid});
          let groupData = _.groupBy(getData.file_data,(data) => data.orderid);

          _.each(groupData, async (dataItem)=>{

            let itemSubTotal = 0;
            let itemQuantity = 0;
            let pushItem = {
              orderid: dataItem[0].orderid,
              name: dataItem[0].name,
              address1: dataItem[0].address1,
              address2: dataItem[0].address2,
              city: dataItem[0].city,
              state: dataItem[0].state,
              zipcode: dataItem[0].zipcode,
              country: dataItem[0].country
            };

            //@TODO khúc này sẽ tính sau khi bấm vào button validate data, ko tính ở đây
            // dataItem.map(async (item) => {
            //   itemQuantity += parseInt(item.quantity);
            //   let materialData = await Promise.resolve(Material.findOne({name:item.style}));
            //   let findProduct = { material:materialData.id,color:item.color,size:item.size }
            //   let productData = await Promise.resolve(Product.findOne(findProduct));
            //   // let basecost = parseFloat(productData.base_price);
            //   console.log('parseFloat(productData.base_price)', parseFloat(productData));
            //   // pushItem.subtotal += basecost;
            //   pushItem.quantity = itemQuantity
            // })
            validDataArray.push(pushItem);
          });


      console.log('validDataArray length', validDataArray.length);
      // return res.json(groupData)
    };

    // return res.json(getData);
    return res.view('scp/order/import_csv',{validDataArray,sid,foundShop});

  },

  upload: async (req, res) => {
    let { id } = req.user;
    let file_data = [];
    let sid = uuidv4();
    let number = 0;
    req.file('files').upload({
      adapter: require('skipper-csv'),
      csvOptions: {delimiter: ',', columns: true},
      rowHandler: function(row, fd){
        // console.log(fd, row);
        number = number+1;
        row.number = number;
        file_data.push(row);
        // sails.sockets.broadcast(session_id,'order/import_done',row);
      }
    }, async (err, files) => {
      if (err) return res.serverError(err);

      let createData = {
        sid,
        file_name: files[0].filename,
        file_size: files[0].size,
        file_data,
        owner: id
      }
      console.log('createData', createData);
      let createResult = await Promise.resolve(ImportCache.create(createData));
      console.log('createResult', createResult);
      return res.redirect(`/order/import?sid=${sid}`);

    });
  },
  getDataCsv: async(req,res) => {
    let session_id = req.signedCookies['sails.sid'];
    let { sid } = req.allParams();


    let findData = await ImportCache.findOne({sid});
    let groupData = _.groupBy(findData.file_data,(data) => data.orderid);

    _.each(groupData,(async (data)=>{
      let pushItem = {
        orderid:data[0].orderid,
        sid
      }
      pushItem.shipping = 0;

      let { address1, address2, city, state, zipcode, country, phone, number } = data[0];
      sails.sockets.broadcast(session_id,'check/csv_data',{sid,id:pushItem.orderid});
      pushItem.subtotal = 0;
      pushItem.quantity = 0;
      const verifiableAddress = new api.Address({
        verify: ['delivery'],
        street1: address1,
        street2: address2,
        city: city,
        state: state,
        zip: zipcode,
        country: country,
        phone: phone,
      });

      let checkAddress = await Promise.resolve(verifiableAddress.save());
      console.log('checkAddress.verifications.delivery.success', checkAddress.verifications.delivery.success);

      // console.log('checkAddress', checkAddress);

      // console.log('checkAddress', checkAddress.verifications);
      if(checkAddress.verifications.delivery.success === false) {
        pushItem.success = 'false';
        pushItem.msg = 'Address not found';
        pushItem.error = '101';
        pushItem.number = number;
        sails.sockets.broadcast(session_id,'send/csv_data',pushItem);
      }

      let shippingPrice = [];
      let shippingExtra = [];
        await Promise.all(data.map(async (item) => {

          pushItem.number = item.number;
          let materialData = await Promise.resolve(Material.findOne({name:item.style}));
          if(!materialData) {
            pushItem.success = 'false';
            pushItem.msg = `${item.style} not found`;
            pushItem.error = '201';
          } else {
            let findProduct = {material:materialData.id,color:item.color,size:item.size}
            let productData = await Promise.resolve(Product.findOne(findProduct));
            if(!productData) {
              pushItem.success = 'false';
              let findColor = await Promise.resolve(Product.findOne({material:materialData.id,color:item.color}));
              let findSize = await Promise.resolve(Product.findOne({material:materialData.id,size:item.size}));
              if(!findColor && findSize) {
                pushItem.error = '202';
                pushItem.msg = `Can not find ${item.style} with color ${item.color}`
              } else if (findColor && !findSize) {
                pushItem.error = '203';
                pushItem.msg = `Can not find ${item.style} with size ${item.size}`
              } else {
                pushItem.error = '204';
                pushItem.msg = `Can not find ${item.style} with size ${item.size} and color ${item.color}`
              }

            } else {
              console.log('country', country);
              let findShippingPrice = await MaterialShip.findOne({material:materialData.id});
              let quantity = parseInt(item.quantity);
              for (let i=0; i<quantity; i++){
                if(country == 'US' || country == 'United States'){
                  shippingPrice.push(findShippingPrice.us_shipping);
                  shippingExtra.push(findShippingPrice.us_extra);
                } else {
                  shippingPrice.push(findShippingPrice.international_ship);
                  shippingExtra.push(findShippingPrice.international_extra);
                }
              }

              let subtotal = productData.base_price*quantity;
              pushItem.success = 'true';
              pushItem.subtotal += subtotal;
              pushItem.quantity += quantity;
            }
          }

          let maxPrice = _.max(shippingPrice);
          let maxExtra = _.max(shippingExtra);
          let calculateShip = maxPrice - maxExtra;
          if(pushItem.quantity > 1){
            pushItem.shipping = sum(shippingExtra) + calculateShip;
          } else {
            pushItem.shipping = sum(shippingPrice)
          }

          pushItem.data = {
            style: item.style,
            color: item.color,
            size: item.size
          }
          sails.sockets.broadcast(session_id,'send/csv_data',pushItem);
          console.log('pushItem', pushItem);
          console.log('maxPrice', maxPrice);
          console.log('maxExtra', maxExtra);
          console.log('calculateShip', calculateShip);
        }));

      // sails.sockets.broadcast(session_id,'send/csv_data',pushItem);


    }))

    res.send(200);
  },
  getAddressCache: async(req,res) => {
    let {sid,orderid} = req.allParams();
    let findData = await ImportCache.findOne({sid});
    // let groupData = _.groupBy(findData.file_data,(data) => data.orderid);
    console.log('groupData', findData.file_data);

    let findAddress = _.find(findData.file_data, { 'orderid': orderid});
    console.log('findAddress', findAddress);
    return res.json(findAddress);
  },

  getProductCache: async(req,res) => {
    let params = req.allParams();
    let {sid,orderid,error,style,color,size} = params;
    console.log('params', params);
    let gotProduct;
    let findData = await ImportCache.findOne({sid});

    let getMaterial = await Material.find({select: ['name']});
    // let groupData = _.groupBy(findData.file_data,(data) => data.orderid);
    // console.log('groupData', findData.file_data);

    if(error == 201){
      gotProduct = _.find(findData.file_data,{'orderid':`${orderid}`,'style':style}); // orderid trong ngoac ""
      gotProduct.material = getMaterial;
      gotProduct.code = '201';
      return res.json(gotProduct);
    } else {
      return res.json({msg:'false'})
    }
  },

  import_orders: async(req,res) => {
    let {sid} = req.allParams();
    let {id} = req.user;
    let session_id = req.signedCookies['sails.sid'];
    let dateString = moment().format('YYYYMMDDhmmss');
    dateString = parseInt(dateString);

    let findData = await ImportCache.findOne({sid});
    let groupData = _.groupBy(findData.file_data,(data) => data.orderid);

    _.each(groupData,(async (data)=>{

      let { orderid, name, address1, address2, city, state, zipcode, country, phone, number, email } = data[0];
      let address = {
        "address1": address1,
        "address2": address2,
        "phone": phone,
        "city": city,
        "zip": zipcode,
        "province": state,
        "country": country,
        "company": null,
        "name": name,
        "country_code": "US",
        "province_code": null
      }
      let items = [];
      await Promise.all(data.map(async (item) => {
        let materialdata = await Material.findOne({name:item.style})
        let productData = await Product.findOne({material:materialdata.id,color:item.color,size:item.size})
        let itemSide = 2;
        let colorData = await Option.findOne({name:item.color});
        console.log('colorData', colorData);
        let itemColor = colorData.value.split('#')[1];
        let itemConfig;
        let materialImageData = await MaterialImage.findOne({material:materialdata.id});
        // console.log('materialImageData', materialImageData);

        console.log('itemColor', itemColor);
        let materialImage = '';
        if(item.side == 'Back' || item.side == 'back'){
          itemSide = 0;
          itemConfig = await MaterialBackConfig.findOne({material:materialdata.id});
          materialImage = materialImageData.image.backimg.match(/([A-Z0-9])\w+/)[0];
        }
        if(item.side == 'Front' || item.side == 'front'){
          itemSide = 1;
          itemConfig = await MaterialConfig.findOne({material:materialdata.id});
          materialImage = materialImageData.image.frontimg.match(/([A-Z0-9])\w+/)[0];
        }

        let designData;
        let imgId = item.design_url.match(/([A-Z0-9])\w+/)[0];
        let url = `https://drive.google.com/uc?export=download&id=${imgId}`

        request(url)
          .pipe(request.post('http://img.gearment.com/image')).on('response', async(response) => {
          console.log('response',response);
          if (response.headers.location) {
            const locationParsedArray = response.headers.location.split('/');
            const smartPath = locationParsedArray[2];

            let createImageData = {
              id: smartPath,
              name: item.design_name,
              type: '1',
              owner: req.user.id
            };

            let createDesignData = {
              id: smartPath,
              thumbUrl : `http://img.gearment.com/load/${smartPath}/320x320`,
              owner: req.user.id
            };

            console.log('materialImage', materialImage);
            // console.log('createImageData', createImageData.id);
            await Promise.resolve(Image.create(createImageData));
            Design.create(createDesignData).exec((err,designData)=>{
              let line = {
                "id": item.number,
                "variant_id": item.number,
                "title": item.design_name,
                "quantity": item.quantity,
                // "price": "24.99",
                "grams": 0,
                "sku": `${productData.id}-${designData.design_id}-${itemSide}`,
                "variant_title": `${item.style} / ${item.color} / ${item.size}`,
                "vendor": "Gearment",
                // "fulfillment_service": "manual",
                "product_id": productData.id,
                "requires_shipping": true,
                "taxable": true,
                // "gift_card": false,
                "name": `${item.design_name} - ${item.style} / ${item.color} / ${item.size}`,
                "variant_img": `https://beta.gearment.com/uploader/product?totalLogo=1&logoWidth=${itemConfig.width}&logoHeight=${itemConfig.height}&topY=${itemConfig.top}&leftX=${itemConfig.left}&logo=${smartPath}&material=${materialImage}&color=${itemColor}`
                // "variant_inventory_management": null,
                // "properties": [],
                // "product_exists": true,
                // "fulfillable_quantity": 1,
                // "total_discount": "0.00",
                // "fulfillment_status": null,
                // "tax_lines": [],

              };
              items.push(line);

              dateString = dateString+number;
              console.log('number', number);
              console.log('dateString', dateString);
              console.log('-------');

              let postDataOrder = {
                "act": "create",
                "shop": "CSV_2",
                "id": dateString,
                "email": email,
                "number": number,
                "note": "from csv",
                "gateway": "stripe",
                "test": false,
                "total_price": "0",
                "subtotal_price": "0",
                "total_weight": 0,
                "total_tax": "0.00",
                "taxes_included": false,
                "currency": "USD",
                "financial_status": "paid",
                "confirmed": true,
                "total_discounts": "0.00",
                "total_line_items_price": "0",
                "cancelled_at": null,
                "name": `#${number}`,
                "total_price_usd": "0",
                "checkout_token": "",
                "reference": "https://gearment.com",
                "order_number": number,
                "line_items": items,
                "billing_address": address,
                "shipping_address": address,
                "importorder": true
              };
              sails.sockets.broadcast(session_id,'notification/order',postDataOrder)
            })
          } else {

          }
        })

      }))

    }));


    res.send(200)
  },


  dhl_shipment: async(req,res) => {
    bluebird.promisifyAll(Fulfillment);
    let query = `select o.id, tracking_company as services, shipment_id, service_rate from fulfillment as f
    left join public.order o on f.order_id = o.orderid
    where ("tracking_company" = 'DHLGlobalMail' OR "tracking_company" = 'DHLGlobalmailInternational')
    and "batch_id" is null
    order by tracking_company, o.id`;

    let resultQuery = await Fulfillment.queryAsync(query);
    let result = resultQuery.rows;
    // res.json(result);
    res.view('acp/order/dhl', {result})
  },

  scan_form: async(req,res) => {
      let foundScanForm = await ScanForm.find();
      res.view('acp/scanform',{foundScanForm});
  },
  manifest: async(req,res) => {
      let foundManifest = await Manifesting.find();
    res.view('acp/manifest',{foundManifest});

  },
  create_scan_form: async(req,res) => {
    bluebird.promisifyAll(Fulfillment);
    console.log('params', req.allParams());

    let { type } = req.allParams();
    if(!type){
      return res.send(400);
    }
    let queryCondition;

    switch(type) {
      case 'GroundDomestic':
        queryCondition = `WHERE ("service_rate" = 'ParcelsGroundDomestic' OR "service_rate" = 'ParcelPlusGroundDomestic' OR "service_rate" = 'ParcelPlusExpeditedDomestic' OR "service_rate" = 'ParcelsExpeditedDomestic')
                          AND "tracking_company" = 'DHLGlobalMail' AND "batch_id" is null`;
        break;

      case 'PacketInternational':
        queryCondition = `WHERE ("service_rate" = 'DHLPacketInternationalStandard' OR "service_rate" = 'DHLPacketInternationalPriority' OR "service_rate" = 'DHLPacketISAL' OR "service_rate" = 'DHLParcelInternationalStandard' OR "service_rate" = 'DHLParcelInternationalPriority' OR "service_rate" = 'DHLParcelDirectInternationalPriority' OR "service_rate" = 'DHLPacketPlusInternational') 
                          AND "tracking_company" = 'DHLGlobalmailInternational' AND "batch_id" is null`;
        break;

      case 'DDU':
        queryCondition = `WHERE "service_rate" = 'parcelConnectPriorityDDU' 
                          AND "tracking_company" = 'DHLGlobalmailInternational' AND "batch_id" is null`;
        break;
    }
    // ParcelsGroundDomestic,
    // ParcelPlusGroundDomestic,
    // ParcelsExpeditedDomestic
    // ParcelPlusExpeditedDomestic
    // where ("service_rate" = 'ParcelsGroundDomestic' OR "service_rate" = 'ParcelPlusGroundDomestic')
    // and "tracking_company" = 'DHLGlobalMail'

    // parcelConnectPriorityDDU,
    // where "service_rate" = 'parcelConnectPriorityDDU'
    // and "tracking_company" = 'DHLGlobalmailInternational'

    // DHLPacketInternationalStandard,
    // DHLPacketInternationalPriority,
    // DHLPacketISAL
    // DHLParcelInternationalPriority,
    // DHLParcelDirectInternationalPriority,
    // where ("service_rate" = 'DHLPacketInternationalStandard' OR "service_rate" = 'DHLPacketInternationalPriority')
    // and "tracking_company" = 'DHLGlobalmailInternational'


    let query = `SELECT shipment_id, o.id ,f.order_id
      FROM fulfillment f
      LEFT JOIN public.order o ON f.order_id = o.orderid 
      ${queryCondition}`;

    // console.log('query', query);

    let getShipment = await Fulfillment.queryAsync(query);
    let shipments = getShipment.rows;
    if(shipments.length < 1) {
      res.json({msg:'error'})
      return false
    };

    let shipmentArr = _.map(shipments, 'shipment_id');
    let orderIdArr = _.map(shipments, 'order_id');
    let orderArr = _.map(shipments, 'id');

    let shipmentJoin = "'" + shipmentArr.join("','") + "'";

    const scanForm = new api.ScanForm({
      shipments: shipmentArr
    });

    scanForm.save().then(sf => {
      let createData = {
        shipments: sf.shipments,
        scan_form_id: sf.id,
        orders:orderArr,
        tracking_codes: sf.tracking_codes,
        status: sf.status,
        form_url: sf.form_url,
        form_type: type,
        batch_id: sf.batch_id
      };
      console.log('createData', createData);
      ScanForm.create(createData).exec(async (err,done) => {
        if(err) console.log('err', err);
        let queryUpdate = `update fulfillment set batch_id = '${sf.batch_id}'
                          where "shipment_id" in (${shipmentJoin})`;
        let resultUpdate = await Fulfillment.queryAsync(queryUpdate);
        return res.json({msg:'done'});
      })
    }).catch(err => {
      res.json({msg:'error'})
      console.log('err', err);
    });
  },

  batch_label: async(req,res) => {
    let { id } = req.allParams();
    const batch = api.Batch.retrieve(id).then(b => {
      res.json(b);
      // b.generateLabel('pdf').then(result=>{
      //   res.json(result);
      // });
    });
  },
  remove_shipment: async(req,res) => {
    // batch_e2adf33701584be7a5ce4b7867f46884

    const batch = api.Batch.retrieve('batch_e2adf33701584be7a5ce4b7867f46884');

    /* Batch will return whether or not the batch operation was
     * created - not the shipments itself. You will need to
     * listen to a webhook event to confirm once the shipments
     * are associated. */
    batch.removeShipments(['shp_8cd132b75fee4f52a37249108aaed09e'])
         .then(console.log);

  },
  get_sf: async(req,res) => {
      let { id } = req.allParams();
    api.ScanForm.retrieve(id).then(console.log);

  },

  easypost_manifest: async(req,res) => {
    let { id } = req.allParams();
    api.Batch.retrieve(id).then(b => {
      /* Once createScanForm is complete, a webhook will be
       * fired to indicate that the scan form was created. */
      b.createScanForm().then(result => {
        // res.json(result)
        // {
        //   "id": "batch_...",
        //   "label_url": null,
        //   "mode": "test",
        //   "num_shipments": 2,
        //   "object": "Batch",
        //   "reference": null,
        //   "scan_form": null,
        //   "shipments": [
        //   ....
        // ],
        //   "state": "creating",
        //   "status": {
        //   "created": 2,
        //     "queued_for_purchase": 0,
        //     "creation_failed": 0,
        //     "postage_purchased": 0,
        //     "postage_purchase_failed": 0
        // },
        //   "label_url": null,
        //   "created_at": "2014-07-22T07:34:39Z",
        //   "updated_at": "2014-07-22T07:34:39Z"
        // }
        let createData = {
          batch_id: result.id,
          label_url: result.label_url,
          num_shipments: result.num_shipments,
          shipments: result.shipments,
          state: result.state,
          status: result.status
        };
        Manifesting.create(createData).exec(async (err,createDone)=>{
          if(err) res.send(400)
          console.log('createDone', createDone);
          await Promise.resolve(ScanForm.update({batch_id:id},{status:'created_manifest'}));
          return res.json(createDone)
        })
      }).catch(err=> {
        return res.json({error:'error',data:err})
      });
    });
  },

  ParcelsGroundDomestic: async(req,res) => {
    bluebird.promisifyAll(Fulfillment);
    let query = `select o.id, tracking_company as services, shipment_id from fulfillment as f
    left join public.order o on f.order_id = o.orderid
    where ("tracking_company" = 'DHLGlobalMail' OR "tracking_company" = 'DHLGlobalmailInternational')
    and "batch_id" is null
    order by tracking_company, o.id`;

    let resultQuery = await Fulfillment.queryAsync(query);
    let result = resultQuery.rows;
    // res.json(result);
    res.view('acp/order/dhl', {result})

  },

  DHLPacketInternational: async(req,res) => {
    bluebird.promisifyAll(Fulfillment);
    let query = `select o.id, tracking_company as services, shipment_id from fulfillment as f
    left join public.order o on f.order_id = o.orderid
    where ("service_rate" = 'DHLPacketInternationalStandard' OR "service_rate" = 'DHLPacketInternationalPriority')
      and "batch_id" is null
    order by tracking_company, o.id`;

    let resultQuery = await Fulfillment.queryAsync(query);
    let result = resultQuery.rows;
    // res.json(result);
    res.view('acp/order/dhl', {result})

  },

  cancel: async(req,res) => {
    let {id} = req.allParams();
    if(id){
      Order.update({id},{tracking:'Cancelled'}).exec((err,data)=>{
        console.log('data', data);
      })
    }

  },


};

