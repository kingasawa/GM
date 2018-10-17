import moment from 'moment';
import bluebird from 'bluebird';
// import Passport from 'passport';
const request = require('request');

const { apiKey, apiSecret } = sails.config.shopify;
const { shopifyVendor } = sails.config.shopify;
moment.tz.setDefault('Asia/Ho_Chi_Minh');

const knex = require('knex')({ client: 'pg' });

module.exports = {
  index: (req, res) => res.json({
    message: "Please dont route index",
    config: sails.config
  }),
  uploader: (req, res) => res.view('demo/uploader.ejs'),
  design: (req, res) => {

    //@TODO query from Model
    let data = {
      logo: ['0be9ce4cb37d4998996a04a15d982574', 'ae50a97854994d7284ef4076f156673f'], //user uploaded logo
      material: ['3b70c726a2b14e1380d385de8078a9e7', 'a96b0dd4ab0e4c4fb78b7da76f0905c9'],
    };
    res.view('demo/design', data)
  },
  publisher: (req, res) => {
    const publisher = sails.hooks.kue_publisher;
    const JOB_TIMEOUT = 3*1000; // 3s
    const job = publisher.create('test', {
      title: 'welcome msg',
      data: {
        university: 'fpt',
        hometown: 'sai gon',
        private_token: 'hello2017'
      },
      msg: 'Welcome Tam Du fpt',
      age: 30
    })
                         // .searchKeys( ['title', 'data'] )
                         .priority('high')
                         .attempts(10)
                         .backoff({
                           delay: JOB_TIMEOUT,
                           type: 'fixed'
                         })
                         .on('complete', function(result) {
                           sails.log.debug('Test:completed', result);
                         })
                         .on('failed attempt', function(errorMessage, doneAttempts) {
                           sails.log.debug('Test:failed attempt', errorMessage, doneAttempts);
                         }).on('failed', function(errorMessage) {
        sails.log.debug('Test:failed', errorMessage);
      })
                         .ttl(120000)
                         .removeOnComplete(true)
                         .save();

    sails.log.info('DemoController:publisher');

    res.json({
      message: "published",
    });
  },
  locales: (req, res) => {

    sails.log.debug('req.session', req.session);
    req.getLocale();

    res.json({
      message: res.i18n('Welcome'),
      session: req.session
    });
  },
  cache: async (req, res) => {
    Cache.set("name", "tam");
    Cache.set("zero", 0);
    Cache.expire("name", 120);
    let donthave = await Cache.getAsync("donthave"); //get with Async bluebird
    let zero = await Cache.getAsync("zero"); //get with Async bluebird
    let name = await Cache.getAsync("name"); //get with Async bluebird
    // Cache.getAsync("name").then(res => sails.log.debug('name res', res)); //get with Async bluebird

    sails.log.debug('donthave', donthave);
    res.json({
      donthave,
      zero,
      name
    });
  },
  getSize: async (req, res) => {
    let { id = 1, size = 's' } = req.allParams;
    let { size: sizes } = await Promise.resolve(MaterialSize.findOne({ id }));
    let result = sizes.find(item => item.size.toLowerCase() === size);
    let { price } = result;

    res.json(price);
    //tu xuc di khoan đã còn nữa nè :D
  },
  blast: async (req, res) => {
    for (let i = 0; i <= 500; i++) {
      sails.sockets.blast('demo/blast', { msg: 'this is blast all' });
    }
    res.json({ msg: 'blast 50' })
  },
  lodash: (req, res) => {
    const user = {
      tam: {
        name: 'du tam'
      },
    };

    // lodash se giup ong bao toan du lieu
    const khanhName = _.get(user, 'khanh.name', 'unnamed');
    res.json({
      ok: true,
      khanhName
    })
  },
  print: (req, res) => {
    res.view('demo/print')
  },
  rxjs: (req, res) => {

  },
  download: (req, res) => {
    Download.url(
      'https://easypost-files.s3-us-west-2.amazonaws.com/files/postage_label/20170415/f90b286338134f77b535a242ebd81feb.pdf')
    res.ok();
  }, // send email demo
  mailer: (req, res) => {
    let params = req.allParams();
    console.log('mailer', params);
    let user = {
      name: 'Khanh Tran',
      email: 'kingasawa@gmail.com'
    }
    Mailer.sendWelcomeMail(user);
    res.json({})
  }, // Analyze all report
  feedback: async(req,res) => {
    let params = req.allParams();
    let { fullname, email, order, question } = params;
    console.log('mailer', params);
    let feedback = {
      fullname, email, order, question
    }
    Mailer.sendFeedBack(feedback);
    res.json({msg:'done'})
  },
  report: async (req, res) => {
    let params = req.allParams();
    let { export_report = false, REVALIDATE = false } = params;
    console.time('analyze-report');
    const allReport = await Report.Order({
      export_report,
      REVALIDATE
    });

    console.timeEnd('analyze-report');
    // const allReport = await Report.Order({orderid: '5484266701', export_report: false});
    res.json(allReport);
  },
  dashboard: async (req, res) => {
    // let params = req.allParams();
    // let { export_report = false, REVALIDATE = false } = params;
    // let dashboard = await Report.Dashboard({from:'04/01/2017', to : '04/30/2017'});
    let dashboard = await Report.orderDashboard({});
    res.json(dashboard);
  }, // hmac validate
  hmac: async (req, res) => {
    const isAuthentic = await ShopifyPrime.Auth.isAuthenticRequest(req.allParams(), apiSecret);

    res.json({
      isAuthentic,
      pr: req.allParams(),
    });
  }, //Authen using shopname - no hmac validate
  passport: async (req, res) => {
    // let data = sails.services.passport.authenticate('local');
    //
    // sails.log.debug("data", data);
    // res.json(data);

    let shopData = await Shop.findOne({ name: 'superbowltee.myshopify.com' });
    let user = await User.findOne(shopData.owner);

    sails.log.debug("shopData", shopData);
    sails.log.debug("user", user);
    // let user = {};
    req.login(user, function(err) {
      if (err) {
        sails.log.warn(err);
        return res.send(403, err);
      }

      req.session.user = user;
      req.session.authenticated = true;

      // Support socket
      if (req.isSocket) {
        return res.json({
          user,
          location
        });
      }

      // Upon successful login, optionally redirect the user if there is a
      // `next` query param
      if (req.query.next) {
        let url = sails.services.authservice.buildCallbackNextUrl(req);
        res.status(302).set('Location', url);
      }

      sails.log.info('user', user, 'authenticated successfully');
      return res.json(user);
    });

  },

  calculateDesign: async (req, res) => {
    let { saveId = 11, material = 3 } = req.allParams();
    let owner = req.user.id;

    let result = {};
    // result = await ProductDesign.calculateDesign({ owner, saveId });
    result = await ProductDesign.calculateDesign({
      material,
      owner,
      saveId
    });
    res.json(result);
  },
  test_order: async (req, res) => {
    let data = req.allParams();
    // let { orderid = '5027401426' } = req.allParams();
    // const foundOrder = await Order.findOne({ orderid });
    //
    // if(foundOrder){
    //   console.log('foundOrder', foundOrder);
    // }else{
    //   console.log('not foundOrder', foundOrder);
    // }

    let orderCreated = await Order.create(data);

    console.log('orderCreated', orderCreated);
    res.json({});
  },
  options: async (req, res) => {
    let result = await Option.getData();
    // console.log('data', result.data.length);
    // console.log('data', result);
    // let data = keyBy(result.data, 'type');
    // console.log('data result.data', result.data);
    // console.log('data result.data', JSON.stringify(result));
    // console.log('data keyby type', keyBy(result, 'type'));

    // result.size = keyBy(result.size, 'value')
    // result.color = keyBy(result.color, 'name')
    res.json(result);
  },
  getSku: async (req, res) => {
    let veryOldSku = 'unit-144-White-M';
    let oldSku = 'unit-245-ultra_cotton_short_sleeve_tee-navy-L';
    let { sku } = req.allParams();

    //test
    sku = sku || `${veryOldSku}`;

    let result = Report.getGearmentSKU(sku, 'Gearment');
    res.json(result);
  },
  updateSKU: async (req, res) => {
    console.log('begin updateSKU update');
    let findVariant = await Promise.resolve(Variant.find());

    // console.log(findVariant);
    _.each(findVariant, async (variant, index) => {
      let sku = variant.sku.split('-');
      let shop = variant.shop;
      let campaignID = sku[1];
      let frontSide = 2;
      // let materialID = sku[3];

      // OLD SKU
      let colorName = sku[3];
      colorName = colorName.replace('_', ' ');
      colorName = colorName.charAt(0).toUpperCase() + colorName.slice(1);

      let material = await Promise.resolve(Material.findOne({
        select: ['id'],
        type: sku[2]
      }));
      let color = await Promise.resolve(Option.findOne({
        select: ['id'],
        name: colorName
      }));
      let size = await Promise.resolve(Option.findOne({
        select: ['id'],
        value: sku[4]
      }));
      let design = await Promise.resolve(Campaign.findOne({
        select: ['numbericDesignId'],
        id: sku[1]
      }));

      // CURRENT SKU
      // let material = await Promise.resolve(Material.findOne({select:['id'],name:variant.item}));
      // let newSKU = `unit-${sku[1]}-${sku[2]}-${material.id}-${sku[4]}-${sku[5]}-${sku[6]}`
      let newSKU = `unit-${campaignID}-${frontSide}-${material.id}-${color.id}-${size.id}-${design.numbericDesignId}`;

      //
      let findToken = await Promise.resolve(Shop.findOne({ name: shop }).populate('shopifytoken'));

      let Shopify = new ShopifyApi({
        shop: shop,
        shopify_api_key: apiKey,
        access_token: findToken.shopifytoken[0].accessToken,
      });

      let putData = {
        "variant": {
          "sku": newSKU,
          "vendor": shopifyVendor,
        }
      }

      let putUrl = `/admin/variants/${variant.variantID}.json`;

      Shopify.put(putUrl, putData, (err, result) => {
        if (err) return console.log(err);
        console.log(result)
      })

      // console.log(newSKU);
      Variant.update({ id: variant.id }, { sku: newSKU }).exec((err, data) => {
        if (err) return console.log(err)
        console.log('Variant.update data', data);
        const Shopify = new ShopifyApi(shopifyAuth);
      })

      if (index === findVariant.length - 1) {
        res.json({ msg: `update done ${findVariant.length} variant(s)` });
      }
    })

  },
  getProductID: (req, res) => {
    let params = req.allParams();
    let findToken = Shop.findOne({ name: params.shop }).populate('shopifytoken');

    let Shopify = new ShopifyApi({
      shop: params.shop,
      shopify_api_key: apiKey,
      access_token: findToken.shopifytoken[0].accessToken,
    });

    Shopify.get(`/admin/products/${params.id}.json`, (err, data) => {
      res.json(data)
    })
  },
  materialKeyBy: async (req, res) => {
    let materialData = await Material.keyBy();
    res.json(materialData);
  },
  productKeyBy: async (req, res) => {
    let productData = await Product.getProductKey();
    res.json(productData);
  },
  log: async (req, res) => {
    let user = {
      name: "teo",
      age: "33"
    }
    sails.log.debug("DEBUG", req.user);
    sails.log.info("INFO");
    sails.log.warn("WARN");
    sails.log.error("ERROR");
    let type = 'ultra_cotton_short_sleeve_tee';
    let materialData = await Material.findOne({ or: [{ type }, { oldType: type }] })
                                     .populate('size')
                                     .populate('shipfee');
    console.log('materialData', materialData);
    res.json({});
  },
  logout: async (req, res) => {

    // sails.services.passport.deserializeUser(function(id, done) {
    //   console.log('id', id);
    //   done(err, user);
    // });
    // console.log('req.session.passport', req.session.passport);
    res.json({});
  },
  groupBy: async (req, res) => {

    let variants = [
      {
        "id": 38308937170,
        "product_id": 9950109330,
        "title": "Ultra Cotton Short Sleeve Tee / Black / S",
        "price": "24.99",
        "sku": "49-3-1",
        "position": 1,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Ultra Cotton Short Sleeve Tee",
        "option2": "Black",
        "option3": "S",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-ultra_cotton_short_sleeve_tee-Black",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308937234,
        "product_id": 9950109330,
        "title": "Ultra Cotton Short Sleeve Tee / Black / M",
        "price": "24.99",
        "sku": "50-3-1",
        "position": 2,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Ultra Cotton Short Sleeve Tee",
        "option2": "Black",
        "option3": "M",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-ultra_cotton_short_sleeve_tee-Black",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308937298,
        "product_id": 9950109330,
        "title": "Ultra Cotton Short Sleeve Tee / Black / L",
        "price": "24.99",
        "sku": "51-3-1",
        "position": 3,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Ultra Cotton Short Sleeve Tee",
        "option2": "Black",
        "option3": "L",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-ultra_cotton_short_sleeve_tee-Black",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308937362,
        "product_id": 9950109330,
        "title": "Ultra Cotton Short Sleeve Tee / Black / XL",
        "price": "24.99",
        "sku": "52-3-1",
        "position": 4,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Ultra Cotton Short Sleeve Tee",
        "option2": "Black",
        "option3": "XL",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-ultra_cotton_short_sleeve_tee-Black",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308937426,
        "product_id": 9950109330,
        "title": "Ultra Cotton Short Sleeve Tee / Black / 2XL",
        "price": "26.99",
        "sku": "53-3-1",
        "position": 5,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Ultra Cotton Short Sleeve Tee",
        "option2": "Black",
        "option3": "2XL",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-ultra_cotton_short_sleeve_tee-Black",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308937490,
        "product_id": 9950109330,
        "title": "Ultra Cotton Short Sleeve Tee / Black / 3XL",
        "price": "27.99",
        "sku": "54-3-1",
        "position": 6,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Ultra Cotton Short Sleeve Tee",
        "option2": "Black",
        "option3": "3XL",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-ultra_cotton_short_sleeve_tee-Black",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308937554,
        "product_id": 9950109330,
        "title": "Ultra Cotton Short Sleeve Tee / Black / 4XL",
        "price": "28.99",
        "sku": "55-3-1",
        "position": 7,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Ultra Cotton Short Sleeve Tee",
        "option2": "Black",
        "option3": "4XL",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-ultra_cotton_short_sleeve_tee-Black",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308937618,
        "product_id": 9950109330,
        "title": "Ultra Cotton Short Sleeve Tee / Black / 5XL",
        "price": "29.99",
        "sku": "56-3-1",
        "position": 8,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Ultra Cotton Short Sleeve Tee",
        "option2": "Black",
        "option3": "5XL",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-ultra_cotton_short_sleeve_tee-Black",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308937682,
        "product_id": 9950109330,
        "title": "Ultra Cotton Short Sleeve Tee / White / S",
        "price": "24.99",
        "sku": "9-3-1",
        "position": 9,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Ultra Cotton Short Sleeve Tee",
        "option2": "White",
        "option3": "S",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-ultra_cotton_short_sleeve_tee-White",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308937746,
        "product_id": 9950109330,
        "title": "Ultra Cotton Short Sleeve Tee / White / M",
        "price": "24.99",
        "sku": "10-3-1",
        "position": 10,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Ultra Cotton Short Sleeve Tee",
        "option2": "White",
        "option3": "M",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-ultra_cotton_short_sleeve_tee-White",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308937810,
        "product_id": 9950109330,
        "title": "Ultra Cotton Short Sleeve Tee / White / L",
        "price": "24.99",
        "sku": "11-3-1",
        "position": 11,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Ultra Cotton Short Sleeve Tee",
        "option2": "White",
        "option3": "L",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-ultra_cotton_short_sleeve_tee-White",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308937874,
        "product_id": 9950109330,
        "title": "Ultra Cotton Short Sleeve Tee / White / XL",
        "price": "24.99",
        "sku": "12-3-1",
        "position": 12,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Ultra Cotton Short Sleeve Tee",
        "option2": "White",
        "option3": "XL",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-ultra_cotton_short_sleeve_tee-White",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308937938,
        "product_id": 9950109330,
        "title": "Ultra Cotton Short Sleeve Tee / White / 2XL",
        "price": "26.99",
        "sku": "13-3-1",
        "position": 13,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Ultra Cotton Short Sleeve Tee",
        "option2": "White",
        "option3": "2XL",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-ultra_cotton_short_sleeve_tee-White",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308938002,
        "product_id": 9950109330,
        "title": "Ultra Cotton Short Sleeve Tee / White / 3XL",
        "price": "27.99",
        "sku": "14-3-1",
        "position": 14,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Ultra Cotton Short Sleeve Tee",
        "option2": "White",
        "option3": "3XL",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-ultra_cotton_short_sleeve_tee-White",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308938066,
        "product_id": 9950109330,
        "title": "Ultra Cotton Short Sleeve Tee / White / 4XL",
        "price": "28.99",
        "sku": "15-3-1",
        "position": 15,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Ultra Cotton Short Sleeve Tee",
        "option2": "White",
        "option3": "4XL",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-ultra_cotton_short_sleeve_tee-White",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308938130,
        "product_id": 9950109330,
        "title": "Ultra Cotton Short Sleeve Tee / White / 5XL",
        "price": "29.99",
        "sku": "16-3-1",
        "position": 16,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Ultra Cotton Short Sleeve Tee",
        "option2": "White",
        "option3": "5XL",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-ultra_cotton_short_sleeve_tee-White",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308938194,
        "product_id": 9950109330,
        "title": "Ultra Cotton Short Sleeve Tee / Navy / S",
        "price": "24.99",
        "sku": "1-3-1",
        "position": 17,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Ultra Cotton Short Sleeve Tee",
        "option2": "Navy",
        "option3": "S",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-ultra_cotton_short_sleeve_tee-Navy",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308938258,
        "product_id": 9950109330,
        "title": "Ultra Cotton Short Sleeve Tee / Navy / M",
        "price": "24.99",
        "sku": "2-3-1",
        "position": 18,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Ultra Cotton Short Sleeve Tee",
        "option2": "Navy",
        "option3": "M",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-ultra_cotton_short_sleeve_tee-Navy",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308938322,
        "product_id": 9950109330,
        "title": "Ultra Cotton Short Sleeve Tee / Navy / L",
        "price": "24.99",
        "sku": "3-3-1",
        "position": 19,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Ultra Cotton Short Sleeve Tee",
        "option2": "Navy",
        "option3": "L",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-ultra_cotton_short_sleeve_tee-Navy",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308938386,
        "product_id": 9950109330,
        "title": "Ultra Cotton Short Sleeve Tee / Navy / XL",
        "price": "24.99",
        "sku": "4-3-1",
        "position": 20,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Ultra Cotton Short Sleeve Tee",
        "option2": "Navy",
        "option3": "XL",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-ultra_cotton_short_sleeve_tee-Navy",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308938450,
        "product_id": 9950109330,
        "title": "Ultra Cotton Short Sleeve Tee / Navy / 2XL",
        "price": "26.99",
        "sku": "5-3-1",
        "position": 21,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Ultra Cotton Short Sleeve Tee",
        "option2": "Navy",
        "option3": "2XL",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-ultra_cotton_short_sleeve_tee-Navy",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308938514,
        "product_id": 9950109330,
        "title": "Ultra Cotton Short Sleeve Tee / Navy / 3XL",
        "price": "27.99",
        "sku": "6-3-1",
        "position": 22,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Ultra Cotton Short Sleeve Tee",
        "option2": "Navy",
        "option3": "3XL",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-ultra_cotton_short_sleeve_tee-Navy",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308938578,
        "product_id": 9950109330,
        "title": "Ultra Cotton Short Sleeve Tee / Navy / 4XL",
        "price": "28.99",
        "sku": "7-3-1",
        "position": 23,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Ultra Cotton Short Sleeve Tee",
        "option2": "Navy",
        "option3": "4XL",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-ultra_cotton_short_sleeve_tee-Navy",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308938642,
        "product_id": 9950109330,
        "title": "Ultra Cotton Short Sleeve Tee / Navy / 5XL",
        "price": "29.99",
        "sku": "8-3-1",
        "position": 24,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Ultra Cotton Short Sleeve Tee",
        "option2": "Navy",
        "option3": "5XL",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-ultra_cotton_short_sleeve_tee-Navy",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308938706,
        "product_id": 9950109330,
        "title": "Heavy Blend Hoodie 8oz. / Navy / S",
        "price": "39.99",
        "sku": "99-3-1",
        "position": 25,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Heavy Blend Hoodie 8oz.",
        "option2": "Navy",
        "option3": "S",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-heavy_blend_hoodie_8_oz-Navy",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308938770,
        "product_id": 9950109330,
        "title": "Heavy Blend Hoodie 8oz. / Navy / M",
        "price": "39.99",
        "sku": "100-3-1",
        "position": 26,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Heavy Blend Hoodie 8oz.",
        "option2": "Navy",
        "option3": "M",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-heavy_blend_hoodie_8_oz-Navy",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308938834,
        "product_id": 9950109330,
        "title": "Heavy Blend Hoodie 8oz. / Navy / L",
        "price": "39.99",
        "sku": "101-3-1",
        "position": 27,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Heavy Blend Hoodie 8oz.",
        "option2": "Navy",
        "option3": "L",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-heavy_blend_hoodie_8_oz-Navy",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308938898,
        "product_id": 9950109330,
        "title": "Heavy Blend Hoodie 8oz. / Navy / XL",
        "price": "39.99",
        "sku": "102-3-1",
        "position": 28,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Heavy Blend Hoodie 8oz.",
        "option2": "Navy",
        "option3": "XL",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-heavy_blend_hoodie_8_oz-Navy",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308938962,
        "product_id": 9950109330,
        "title": "Heavy Blend Hoodie 8oz. / Navy / 2XL",
        "price": "41.99",
        "sku": "103-3-1",
        "position": 29,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Heavy Blend Hoodie 8oz.",
        "option2": "Navy",
        "option3": "2XL",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-heavy_blend_hoodie_8_oz-Navy",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308939026,
        "product_id": 9950109330,
        "title": "Heavy Blend Hoodie 8oz. / Navy / 3XL",
        "price": "42.99",
        "sku": "104-3-1",
        "position": 30,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Heavy Blend Hoodie 8oz.",
        "option2": "Navy",
        "option3": "3XL",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-heavy_blend_hoodie_8_oz-Navy",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308939154,
        "product_id": 9950109330,
        "title": "Heavy Blend Hoodie 8oz. / Navy / 4XL",
        "price": "43.99",
        "sku": "105-3-1",
        "position": 31,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Heavy Blend Hoodie 8oz.",
        "option2": "Navy",
        "option3": "4XL",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-heavy_blend_hoodie_8_oz-Navy",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308939346,
        "product_id": 9950109330,
        "title": "Heavy Blend Hoodie 8oz. / Navy / 5XL",
        "price": "44.99",
        "sku": "106-3-1",
        "position": 32,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Heavy Blend Hoodie 8oz.",
        "option2": "Navy",
        "option3": "5XL",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-heavy_blend_hoodie_8_oz-Navy",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308939474,
        "product_id": 9950109330,
        "title": "Heavy Blend Hoodie 8oz. / White / S",
        "price": "39.99",
        "sku": "107-3-1",
        "position": 33,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Heavy Blend Hoodie 8oz.",
        "option2": "White",
        "option3": "S",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-heavy_blend_hoodie_8_oz-White",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308939602,
        "product_id": 9950109330,
        "title": "Heavy Blend Hoodie 8oz. / White / M",
        "price": "39.99",
        "sku": "108-3-1",
        "position": 34,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Heavy Blend Hoodie 8oz.",
        "option2": "White",
        "option3": "M",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-heavy_blend_hoodie_8_oz-White",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308939730,
        "product_id": 9950109330,
        "title": "Heavy Blend Hoodie 8oz. / White / L",
        "price": "39.99",
        "sku": "109-3-1",
        "position": 35,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Heavy Blend Hoodie 8oz.",
        "option2": "White",
        "option3": "L",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-heavy_blend_hoodie_8_oz-White",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308939858,
        "product_id": 9950109330,
        "title": "Heavy Blend Hoodie 8oz. / White / XL",
        "price": "39.99",
        "sku": "110-3-1",
        "position": 36,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Heavy Blend Hoodie 8oz.",
        "option2": "White",
        "option3": "XL",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-heavy_blend_hoodie_8_oz-White",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308940050,
        "product_id": 9950109330,
        "title": "Heavy Blend Hoodie 8oz. / White / 2XL",
        "price": "41.99",
        "sku": "111-3-1",
        "position": 37,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Heavy Blend Hoodie 8oz.",
        "option2": "White",
        "option3": "2XL",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-heavy_blend_hoodie_8_oz-White",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308940178,
        "product_id": 9950109330,
        "title": "Heavy Blend Hoodie 8oz. / White / 3XL",
        "price": "42.99",
        "sku": "112-3-1",
        "position": 38,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Heavy Blend Hoodie 8oz.",
        "option2": "White",
        "option3": "3XL",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-heavy_blend_hoodie_8_oz-White",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308940306,
        "product_id": 9950109330,
        "title": "Heavy Blend Hoodie 8oz. / White / 4XL",
        "price": "43.99",
        "sku": "113-3-1",
        "position": 39,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Heavy Blend Hoodie 8oz.",
        "option2": "White",
        "option3": "4XL",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-heavy_blend_hoodie_8_oz-White",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308940434,
        "product_id": 9950109330,
        "title": "Heavy Blend Hoodie 8oz. / White / 5XL",
        "price": "44.99",
        "sku": "114-3-1",
        "position": 40,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Heavy Blend Hoodie 8oz.",
        "option2": "White",
        "option3": "5XL",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-heavy_blend_hoodie_8_oz-White",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308940626,
        "product_id": 9950109330,
        "title": "Heavy Blend Crewneck Sweatshirt / Navy / XS",
        "price": "35.99",
        "sku": "261-3-1",
        "position": 41,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Heavy Blend Crewneck Sweatshirt",
        "option2": "Navy",
        "option3": "XS",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-heavy_blend_crewneck_sweatshirt-Navy",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308940754,
        "product_id": 9950109330,
        "title": "Heavy Blend Crewneck Sweatshirt / Navy / S",
        "price": "35.99",
        "sku": "262-3-1",
        "position": 42,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Heavy Blend Crewneck Sweatshirt",
        "option2": "Navy",
        "option3": "S",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-heavy_blend_crewneck_sweatshirt-Navy",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308940882,
        "product_id": 9950109330,
        "title": "Heavy Blend Crewneck Sweatshirt / Navy / M",
        "price": "35.99",
        "sku": "263-3-1",
        "position": 43,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Heavy Blend Crewneck Sweatshirt",
        "option2": "Navy",
        "option3": "M",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-heavy_blend_crewneck_sweatshirt-Navy",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308941010,
        "product_id": 9950109330,
        "title": "Heavy Blend Crewneck Sweatshirt / Navy / L",
        "price": "35.99",
        "sku": "264-3-1",
        "position": 44,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Heavy Blend Crewneck Sweatshirt",
        "option2": "Navy",
        "option3": "L",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-heavy_blend_crewneck_sweatshirt-Navy",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308941138,
        "product_id": 9950109330,
        "title": "Heavy Blend Crewneck Sweatshirt / Navy / XL",
        "price": "35.99",
        "sku": "265-3-1",
        "position": 45,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Heavy Blend Crewneck Sweatshirt",
        "option2": "Navy",
        "option3": "XL",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-heavy_blend_crewneck_sweatshirt-Navy",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308941266,
        "product_id": 9950109330,
        "title": "Heavy Blend Crewneck Sweatshirt / Navy / 2XL",
        "price": "37.99",
        "sku": "266-3-1",
        "position": 46,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Heavy Blend Crewneck Sweatshirt",
        "option2": "Navy",
        "option3": "2XL",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-heavy_blend_crewneck_sweatshirt-Navy",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308941458,
        "product_id": 9950109330,
        "title": "Heavy Blend Crewneck Sweatshirt / Navy / 3XL",
        "price": "38.99",
        "sku": "267-3-1",
        "position": 47,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Heavy Blend Crewneck Sweatshirt",
        "option2": "Navy",
        "option3": "3XL",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-heavy_blend_crewneck_sweatshirt-Navy",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308941586,
        "product_id": 9950109330,
        "title": "Heavy Blend Crewneck Sweatshirt / Navy / 4XL",
        "price": "39.99",
        "sku": "268-3-1",
        "position": 48,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Heavy Blend Crewneck Sweatshirt",
        "option2": "Navy",
        "option3": "4XL",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-heavy_blend_crewneck_sweatshirt-Navy",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308941714,
        "product_id": 9950109330,
        "title": "Heavy Blend Crewneck Sweatshirt / Navy / 5XL",
        "price": "40.99",
        "sku": "269-3-1",
        "position": 49,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Heavy Blend Crewneck Sweatshirt",
        "option2": "Navy",
        "option3": "5XL",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-heavy_blend_crewneck_sweatshirt-Navy",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308941778,
        "product_id": 9950109330,
        "title": "Unisex Ultra Cotton Tank Top / Carolina Blue / S",
        "price": "25.99",
        "sku": "360-3-1",
        "position": 50,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Unisex Ultra Cotton Tank Top",
        "option2": "Carolina Blue",
        "option3": "S",
        "created_at": "2017-07-10T03:09:11-07:00",
        "updated_at": "2017-07-10T03:09:11-07:00",
        "taxable": true,
        "barcode": "gearment-854-unisex_ultra_cotton_tank_top-Carolina Blue",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308942098,
        "product_id": 9950109330,
        "title": "Unisex Ultra Cotton Tank Top / Carolina Blue / M",
        "price": "25.99",
        "sku": "361-3-1",
        "position": 51,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Unisex Ultra Cotton Tank Top",
        "option2": "Carolina Blue",
        "option3": "M",
        "created_at": "2017-07-10T03:09:12-07:00",
        "updated_at": "2017-07-10T03:09:12-07:00",
        "taxable": true,
        "barcode": "gearment-854-unisex_ultra_cotton_tank_top-Carolina Blue",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308942290,
        "product_id": 9950109330,
        "title": "Unisex Ultra Cotton Tank Top / Carolina Blue / L",
        "price": "25.99",
        "sku": "362-3-1",
        "position": 52,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Unisex Ultra Cotton Tank Top",
        "option2": "Carolina Blue",
        "option3": "L",
        "created_at": "2017-07-10T03:09:12-07:00",
        "updated_at": "2017-07-10T03:09:12-07:00",
        "taxable": true,
        "barcode": "gearment-854-unisex_ultra_cotton_tank_top-Carolina Blue",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308942418,
        "product_id": 9950109330,
        "title": "Unisex Ultra Cotton Tank Top / Carolina Blue / XL",
        "price": "25.99",
        "sku": "363-3-1",
        "position": 53,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Unisex Ultra Cotton Tank Top",
        "option2": "Carolina Blue",
        "option3": "XL",
        "created_at": "2017-07-10T03:09:12-07:00",
        "updated_at": "2017-07-10T03:09:12-07:00",
        "taxable": true,
        "barcode": "gearment-854-unisex_ultra_cotton_tank_top-Carolina Blue",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308942546,
        "product_id": 9950109330,
        "title": "Unisex Ultra Cotton Tank Top / Carolina Blue / 2XL",
        "price": "27.99",
        "sku": "364-3-1",
        "position": 54,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Unisex Ultra Cotton Tank Top",
        "option2": "Carolina Blue",
        "option3": "2XL",
        "created_at": "2017-07-10T03:09:12-07:00",
        "updated_at": "2017-07-10T03:09:12-07:00",
        "taxable": true,
        "barcode": "gearment-854-unisex_ultra_cotton_tank_top-Carolina Blue",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308942610,
        "product_id": 9950109330,
        "title": "Unisex Ultra Cotton Tank Top / Carolina Blue / 3XL",
        "price": "28.99",
        "sku": "365-3-1",
        "position": 55,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Unisex Ultra Cotton Tank Top",
        "option2": "Carolina Blue",
        "option3": "3XL",
        "created_at": "2017-07-10T03:09:12-07:00",
        "updated_at": "2017-07-10T03:09:12-07:00",
        "taxable": true,
        "barcode": "gearment-854-unisex_ultra_cotton_tank_top-Carolina Blue",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308942738,
        "product_id": 9950109330,
        "title": "Unisex Ultra Cotton Tank Top / Navy / S",
        "price": "25.99",
        "sku": "366-3-1",
        "position": 56,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Unisex Ultra Cotton Tank Top",
        "option2": "Navy",
        "option3": "S",
        "created_at": "2017-07-10T03:09:12-07:00",
        "updated_at": "2017-07-10T03:09:12-07:00",
        "taxable": true,
        "barcode": "gearment-854-unisex_ultra_cotton_tank_top-Navy",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308942866,
        "product_id": 9950109330,
        "title": "Unisex Ultra Cotton Tank Top / Navy / M",
        "price": "25.99",
        "sku": "367-3-1",
        "position": 57,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Unisex Ultra Cotton Tank Top",
        "option2": "Navy",
        "option3": "M",
        "created_at": "2017-07-10T03:09:12-07:00",
        "updated_at": "2017-07-10T03:09:12-07:00",
        "taxable": true,
        "barcode": "gearment-854-unisex_ultra_cotton_tank_top-Navy",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308942930,
        "product_id": 9950109330,
        "title": "Unisex Ultra Cotton Tank Top / Navy / L",
        "price": "25.99",
        "sku": "368-3-1",
        "position": 58,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Unisex Ultra Cotton Tank Top",
        "option2": "Navy",
        "option3": "L",
        "created_at": "2017-07-10T03:09:12-07:00",
        "updated_at": "2017-07-10T03:09:12-07:00",
        "taxable": true,
        "barcode": "gearment-854-unisex_ultra_cotton_tank_top-Navy",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308943058,
        "product_id": 9950109330,
        "title": "Unisex Ultra Cotton Tank Top / Navy / XL",
        "price": "25.99",
        "sku": "369-3-1",
        "position": 59,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Unisex Ultra Cotton Tank Top",
        "option2": "Navy",
        "option3": "XL",
        "created_at": "2017-07-10T03:09:12-07:00",
        "updated_at": "2017-07-10T03:09:12-07:00",
        "taxable": true,
        "barcode": "gearment-854-unisex_ultra_cotton_tank_top-Navy",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308943186,
        "product_id": 9950109330,
        "title": "Unisex Ultra Cotton Tank Top / Navy / 2XL",
        "price": "27.99",
        "sku": "370-3-1",
        "position": 60,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Unisex Ultra Cotton Tank Top",
        "option2": "Navy",
        "option3": "2XL",
        "created_at": "2017-07-10T03:09:12-07:00",
        "updated_at": "2017-07-10T03:09:12-07:00",
        "taxable": true,
        "barcode": "gearment-854-unisex_ultra_cotton_tank_top-Navy",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308943250,
        "product_id": 9950109330,
        "title": "Unisex Ultra Cotton Tank Top / Navy / 3XL",
        "price": "28.99",
        "sku": "371-3-1",
        "position": 61,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Unisex Ultra Cotton Tank Top",
        "option2": "Navy",
        "option3": "3XL",
        "created_at": "2017-07-10T03:09:12-07:00",
        "updated_at": "2017-07-10T03:09:12-07:00",
        "taxable": true,
        "barcode": "gearment-854-unisex_ultra_cotton_tank_top-Navy",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308943378,
        "product_id": 9950109330,
        "title": "Unisex Ultra Cotton Tank Top / Orange / S",
        "price": "25.99",
        "sku": "372-3-1",
        "position": 62,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Unisex Ultra Cotton Tank Top",
        "option2": "Orange",
        "option3": "S",
        "created_at": "2017-07-10T03:09:12-07:00",
        "updated_at": "2017-07-10T03:09:12-07:00",
        "taxable": true,
        "barcode": "gearment-854-unisex_ultra_cotton_tank_top-Orange",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308943506,
        "product_id": 9950109330,
        "title": "Unisex Ultra Cotton Tank Top / Orange / M",
        "price": "25.99",
        "sku": "373-3-1",
        "position": 63,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Unisex Ultra Cotton Tank Top",
        "option2": "Orange",
        "option3": "M",
        "created_at": "2017-07-10T03:09:12-07:00",
        "updated_at": "2017-07-10T03:09:12-07:00",
        "taxable": true,
        "barcode": "gearment-854-unisex_ultra_cotton_tank_top-Orange",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308943634,
        "product_id": 9950109330,
        "title": "Unisex Ultra Cotton Tank Top / Orange / L",
        "price": "25.99",
        "sku": "374-3-1",
        "position": 64,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Unisex Ultra Cotton Tank Top",
        "option2": "Orange",
        "option3": "L",
        "created_at": "2017-07-10T03:09:12-07:00",
        "updated_at": "2017-07-10T03:09:12-07:00",
        "taxable": true,
        "barcode": "gearment-854-unisex_ultra_cotton_tank_top-Orange",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308943762,
        "product_id": 9950109330,
        "title": "Unisex Ultra Cotton Tank Top / Orange / XL",
        "price": "25.99",
        "sku": "375-3-1",
        "position": 65,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Unisex Ultra Cotton Tank Top",
        "option2": "Orange",
        "option3": "XL",
        "created_at": "2017-07-10T03:09:12-07:00",
        "updated_at": "2017-07-10T03:09:12-07:00",
        "taxable": true,
        "barcode": "gearment-854-unisex_ultra_cotton_tank_top-Orange",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308943890,
        "product_id": 9950109330,
        "title": "Unisex Ultra Cotton Tank Top / Orange / 2XL",
        "price": "27.99",
        "sku": "376-3-1",
        "position": 66,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Unisex Ultra Cotton Tank Top",
        "option2": "Orange",
        "option3": "2XL",
        "created_at": "2017-07-10T03:09:12-07:00",
        "updated_at": "2017-07-10T03:09:12-07:00",
        "taxable": true,
        "barcode": "gearment-854-unisex_ultra_cotton_tank_top-Orange",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }, {
        "id": 38308944018,
        "product_id": 9950109330,
        "title": "Unisex Ultra Cotton Tank Top / Orange / 3XL",
        "price": "28.99",
        "sku": "377-3-1",
        "position": 67,
        "grams": 0,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Unisex Ultra Cotton Tank Top",
        "option2": "Orange",
        "option3": "3XL",
        "created_at": "2017-07-10T03:09:12-07:00",
        "updated_at": "2017-07-10T03:09:12-07:00",
        "taxable": true,
        "barcode": "gearment-854-unisex_ultra_cotton_tank_top-Orange",
        "image_id": null,
        "inventory_quantity": 1,
        "weight": 0,
        "weight_unit": "lb",
        "old_inventory_quantity": 1,
        "requires_shipping": true
      }
    ];
    let groupedBarcodeVariants = _.groupBy(variants, (e) => `${e.barcode}`);
    let groupedSkuVariants = _.groupBy(variants, (e) => `${e.sku}`);
    let groupedTestVariants = _.groupBy(variants,
      (e) => `${_.snakeCase(e.option1)}-${_.snakeCase(e.option2)}`);

    res.json({
      groupedTestVariants,
      groupedBarcodeVariants,
      groupedSkuVariants
    });
  },
  addProduct: async (req, res) => {
    Product.addProduct({});
    res.json({});
  },
  variantWarning: async (req, res) => {
    let warningData = await Product.count({
      id: 4,
      where: { base_price: 0 }
    });
    res.json(warningData);
  },
  updateLastLogin: async (req, res) => {
    let lastLogin = (new Date()).toString();
    let warningData = await User.update(2, { last_login: lastLogin });

    console.log(moment(warningData[0].last_login).format())
    res.json(warningData);
  },
  knex: async (req, res) => {
    // SELECT distinct(o.owner), u.username, o.id, o."createdAt" FROM public.order o
    // left join public.user u on o.owner = u.id
    // where o.sync=1
    // and o."createdAt" >= '05/04/2017' and date '05/20/2017' + interval '1 day' - interval '1 second'
    let query = knex.select('*').from('books').toString();
    console.log('query', query);
    res.json({ test: query });
  },
  time: async (req, res) => {
    // SELECT distinct(o.owner), u.username, o.id, o."createdAt" FROM public.order o
    // left join public.user u on o.owner = u.id
    // where o.sync=1
    // and o."createdAt" >= '05/04/2017' and date '05/20/2017' + interval '1 day' - interval '1 second'
    let data = await Product.findOne(1).limit(1);
    console.log('data', data);
    res.json({ data });
  },
  bluebird: async (req, res) => {
    bluebird.promisifyAll(Order);

    let data = await Order.queryAsync(`select *, "createdAt" AT TIME ZONE '+7' from public.order limit 2`);

    console.log('data', data.rows[0]);

    res.json(data.rows[0]);
  },

  orderhiveitemview: async (req, res) => {
    let data = await Orderhive.itemView();

    console.log('orderhive data', data);
    res.json(data)
  },
  orderhivecreateproduct: async (req, res) => {
    let productData = {
      name: 'iphonefromapi',
      sku: 'iphone-1-1',
      qty: 1,
      brand: 'apple',
      description: 'apple iphone is zzzz',
      buy_price: 800
    };

    let data = await Orderhive.createProduct(productData);

    res.json(data)
  },
  lzw: async (req, res) => {
    let { s = 'test' } = req.allParams()

    let compressedData = Lzw.compress(s);
    let decompressedData = Lzw.decompress(compressedData);

    res.json({
      compressedData,
      decompressedData,
      passed: decompressedData === s
    })
  },
  tradegecko: async (req, res) => {
    let params = 19737178;

    let createProduct = await TradeGecko.createProduct({
      "name": "sat p3 test new product",
      "opt1": "Color",
      "opt2": "Size",
      "brand": "Gildan2000",
      "barcode": "",
      "description": "this is description",
      "product_type": "T-shirt",
      "supplier": "SSACTIVE"
    });
    let updateProduct = await TradeGecko.updateProduct(createProduct.id, {
      "name": "sat t3-edited test new product", // "opt1": "Color",
      // "opt2": "Size",
      // "brand": "Gildan2000",
      // "barcode": "",
      // "description": "this is description",
      // "product_type": "T-shirt",
      // "supplier": "SSACTIVE"
    });

    let getProduct = await TradeGecko.getProduct(createProduct.id);
    let createVariant = await TradeGecko.createVariant(createProduct.id, {
      "name": "test-p3-v1",
      "opt1": "Black",
      "opt2": "5XL",
      "sku": "VAR-BLK-5XL",
      "keep_selling": true,
      "weight_value": "3.0",
      "weight_unit": "oz",
      "buy_price": "25.0",
      "retail_price": "20.0",
      "wholesale_price": "15.0",
    });
    // let updateVariant = await TradeGecko.updateVariant(createVariant.id, {
    //   "name": "test-p3-v1-edited",
    //   "opt1": "Black-edited",
    //   "opt2": "5XL",
    //   "sku": "VAR-BLK-5XL",
    //   "keep_selling": true,
    //   "weight_value": "3.0",
    //   "weight_unit": "oz",
    //   "buy_price": "25.0",
    //   "retail_price": "20.0",
    //   "wholesale_price": "15.0",
    // });
    let getVariant = await TradeGecko.getVariant(createVariant.id);
    let createOrder = await TradeGecko.createOrder({

      "issued_at": "24-08-2017",
      "status": "active",
      "order_line_items": [
        {
          "variant_id": createVariant.id,
          "quantity": 20
        },
        // {
        //   "variant_id": 32512781,
        //   "quantity": 50
        // }
      ]
      // "company_id": 15890479,
      // "billing_address_id": 19294849,
      // "shipping_address_id": 19294849,
    });
    let updateOrder = await TradeGecko.updateOrder(createOrder.id, {
      "issued_at": "26-08-2017",
      "status": "active",
      // "company_id": 15890479,
      // "billing_address_id": 19294849,
      // "shipping_address_id": 19294849,
    });

    let deleteProduct = await TradeGecko.deleteProduct(createProduct.id);

    res.json({
      createProduct,
      updateProduct,
      getProduct,
      createVariant,
      getVariant,
      createOrder,
      updateOrder,
    })
  },
  syncTradeGecko: async (req, res) => {
    let result = await Product.syncTradeGecko({})

    res.json({
      result
    })
  },
  getOrderDate: async (req, res) => {
    let result = await Order.find().limit(1);
    let date = result[0].createdAt

    console.log('date', moment(date).format('DDMMYYYY'));

    res.json({
      result
    })
  },
  task: async function() {
    // Order.update({tracking:'pending',sync:1},{tracking:'Awaiting-Fulfillment'}).exec((err,result)=>{
    //   console.log('update ok',result)
    // })
    let queryOrder = `SELECT id FROM public.order where id=5560`;

    let query = `UPDATE public.order SET "tracking" = 'In-Production', 
                  "payment_status" = 'pending' 
                WHERE id in (${queryOrder})`;

    Order.query(query, (err, result) => {
      if(err) return sails.log.error('Task:Update:Order update tracking error',err)
      // sails.log.debug('Task:Update:Order Update tracking every hour',result)
    })

    let queryAllOrderData = `SELECT * FROM public.order where id=5560`;

    Order.query(queryAllOrderData, async (err, orderDataResult) => {
      let orderData = orderDataResult.rows;
      if(err) return sails.log.error('Task:Update:Order sync TradeGecko error', err )
      if(!orderData){
        sails.log.debug('Task:Update:Order Sync TradeGecko every hour null orderData')
      }
      // sails.log.debug('Task:Update:Order Sync TradeGecko every hour orderData', orderData)


      if(orderData){
        orderData.map(async order => {
          // console.log('order', order);
          let { id, createdAt, line_items } = order;
          let issued_at = moment(createdAt).format('DD-MM-YYYY');
          let order_line_items = []

          if(line_items){

            await Promise.all(line_items.map(item => {
              let { quantity, tradegecko_id: variant_id  } = item;
              order_line_items.push({
                variant_id,
                quantity
              });
            }))


            let createOrderData = {
              issued_at,
              "status": "active",
              // payment_status: "paid", // must have order line items price
              order_line_items,
              "company_id": 15890479,
              "billing_address_id": 19294849,
              "shipping_address_id": 19294849,
            }

            console.log('createOrderData', createOrderData);

            let createOrder = await TradeGecko.createOrder(createOrderData);

            if(createOrder && createOrder.id){
              await Order.update({ id }, { tradegecko_id: createOrder.id })
              console.log('Sync TradeGecko Order done', id, createOrder.id );
            }
          }

        })
      }
    })

    // 1. create order "payment_status": "paid"
  },

  scanner: async(req,res) => {
      res.view('test/scanner');
  },

  zipcode: async(req,res) => {
    console.log('params', req.allParams());
      let { city,state } = req.allParams();
      let apikey = 'UfUH5TMl2BigYz4qaI7TCIMC6QYapsdjI70N0M83orkn0oOa7V4JDQlJHkU6N7pv';


      if(city && state){
        await request(`https://www.zipcodeapi.com/rest/${apikey}/city-zips.json/${city}/${state}`, function (error, response, body) {
          const result = JSON.parse(body);
          return res.json(result)
        });
      }

      else {
        res.view('test/zipcode')
      }


  },
};

