/**
 * AboutUsController
 *
 * @description :: Server-side logic for managing aboutuses
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const { apiKey, apiSecret, shopifyVendor } = sails.config.shopify;
// var apiKey = 'ae22432ff4d89ca146649cc782f385f1';
// var apiSecret =  '3573364f9e3da3faa1ee8cb02d1ee017';
const TEST = process.env.TEST || false;

if(TEST){
  sails.log.debug("TEST ENABLED");
}

module.exports = {
  index: (req, res) => {
    return res.send('owner')
  },
  create: async(req,res)=> {
    const session_id = req.signedCookies['sails.sid'];
    let {
      designID, pDefaultImg, pImg, shop, pTitle, pColor,
      pSize, pDesc, pName, pVendor, pTags, pCollection, pHandle,pMetaTitle,pMetaDesc, pPublish = [],
      frontSide, // 1 | 0
      materialId, // 1, 2, 3...
      numbericDesignId
    } = req.allParams();

    // @TODO Local Test
    pImg = pImg.map(item => item.replace('http://localhost:3000', 'https://beta.gearment.com'));

    let params = req.allParams();

    sails.log.debug("CampaignController:create:req.allParams()", JSON.stringify(params));

    let createCampaign = await Promise.resolve(Campaign.create({
      shopname: shop,
      shoptype: 'shopify',
      title: pTitle,
      designID: numbericDesignId,
      numbericDesignId: numbericDesignId,
      materialID: materialId,
      defaultImage: pDefaultImg,
      color: pColor,
      size: pSize,
      image: pImg
    }));

    let optionData = await Option.getData();

    let findToken = await Promise.resolve(Shop.findOne({name:shop}).populate('shopifytoken'));

    let shopifyAuth = {
      shop:shop ,
      shopify_api_key:  apiKey,
      access_token: findToken.shopifytoken[0].accessToken,
    };

    let apiConfig = {
      rate_limit_delay: 10000, // 10 seconds (in ms) => if Shopify returns 429 response code
        backoff: 5, // limit X of 40 API calls => default is 35 of 40 API calls
        backoff_delay: 2000 // 1 second (in ms) => wait 1 second if backoff option is exceeded
    };

    shopifyAuth = Object.assign(apiConfig, shopifyAuth)
    const Shopify = new ShopifyApi(shopifyAuth);

    let pVariants = [];
    let pImage = [];
    let pType;
    for (let c=0; c < pColor.length ; c++) {
      if(pDefaultImg && pImg[c] == pDefaultImg) {
        var position = 1;
      }else{var position = 2}

      let eachImg = {
        "position":position,
        "src": pImg[c],
      };

      pImage.push(eachImg);

      for(let s=0; s < pSize.length; s++ ) {
        let variantSize = pSize[s].name;
        let variantColor = pColor[c].name;
        let variantColorSnakeCase = _.snakeCase(variantColor);
        let variantNameType = _.snakeCase(pName);

        // let colorId = optionData.color[variantColor]['id'];
        // let sizeId = optionData.size[variantSize]['id'];
        let designId = numbericDesignId;

        // current SKU
        // let currentSku = `unit-${createCampaign.id}-${frontSide}-${materialId}-${colorId}-${sizeId}-${designId}`;
        // new sku
        let productData = await Product.findOne({
          select: ['id','type'],
          material: materialId,
          size: variantSize,
          color: variantColor
        });

        let { id: productId } = productData;
        pType = productData.type;

        // newSku
        let sku = `${productId}-${designId}-${frontSide}`

        console.log(`TEST: sku:${sku} with productId: ${productId} | color: ${variantColor} | size: ${variantSize} `);

        let eachVariant = {
          "option1": pName,
          "option2": pColor[c].name,
          "option3": variantSize,
          "price": pSize[s].value,
          "sku": sku,
          // Please dont update barcode here @tamdu
          // has to remove barcode for business issue
          // "barcode": `gearment-${createCampaign.id}-${variantNameType}-${variantColorSnakeCase}`,
        };

        pVariants.push(eachVariant);
      }
    }

    let postData = {
      "product": {
        "title": pTitle,
        "product_type": pType,
        "handle": pHandle,
        "metafields_global_title_tag": pMetaTitle,
        "metafields_global_description_tag": pMetaDesc,
        "body_html": pDesc,
        "vendor": shopifyVendor,
        // "product_type": "Snowboard",
        "published": pPublish,
        "tags": pTags,

        "options": [
          {
            "name": "Style",
          },
          {
            "name": "Color",
          },
          {
            "name": "Size",
          }
        ],
        "variants": pVariants,
        "images": pImage
      }
    };

    if(TEST){
      sails.log.debug("nongroup postData", JSON.stringify(postData, null, 2));
      return false;
    }

    Shopify.post('/admin/products.json',postData,function(err,data){
      if(err) return res.json(err);
      const { product } = data;

      if(Array.isArray(pCollection)){
        for (let index = 0; index < pCollection.length; index++ ) {
          const postCollection = {
            collect: {
              product_id: product.id,
              collection_id: pCollection[index]
            }
          };
          Shopify.post('/admin/collects.json', postCollection, function(err){

          })
        }
      }


      for (let i = 0 ; i < product.images.length ; i++) {
        let optionValue = product.options[1].values[i];
        let variantImg = product.images[i].id;

        for (let variant of product.variants) {
          if (variant.option2 == optionValue) {
            let putImg = {
              "variant": {
                "id": variant.id,
                "image_id": variantImg
              }
            };

            let shopifyPutUrl = `/admin/variants/${variant.id}.json`;
            const publisher = sails.hooks.kue_publisher;
            const publishData = {
              shopifyPutUrl,
              putImg,
              shopifyAuth,
              title: shopifyAuth.shop
            };

            //publish send confirmation email
            publisher.create('pushshopify', publishData)
                     .priority('high')
                     // .searchKeys( ['title', 'putImg'] )
                     .attempts(60)
                     .backoff( { delay: 3 * 1000, type: 'fixed'} )
                     .on('complete', function(result){
                      // console.log('Job completed with data ', result);
                       sails.sockets.broadcast(session_id, 'pushto/shopify', { result })
                     })
                     .removeOnComplete( true )
                     .ttl(3600000) //1h
                     .save();
          }
        }
      }
      // sails.sockets.broadcast(session_id, 'pushto/shopify', { msg:'ok' })
      sails.sockets.broadcast(session_id,'push/success',{msg:'ok'})
    });
  },

  /**
   * This is default function, grouping all product
   * @param req
   * @param res
   * @returns {Promise.<void>}
   */
  group: async(req,res) => {
    const session_id = req.signedCookies['sails.sid'];
    let {
      designID, productImg, chooseShop, productTitle, variantData, productColor, productDescription,
      productVendor, productTags, productCollection, productHandle,productMetaTitle,productMetaDesc, productPublish = [],
      frontSide, // 1 | 0,
      numbericDesignId,
    } = req.allParams();


    let params = req.allParams();

    // sails.log.debug("CampaignController:group:req.allParams()", JSON.stringify(params));

    console.log('CampaignController:group:req.allParams()', JSON.stringify(params));
    // @TODO check bulk
    // res.json({});
    // return;

    //get the first materialId, there is one issue here in multiple material id
    // let materialId = variantData[0].materialId;
    let createCampaign = await Promise.resolve(Campaign.create({
      shopname: chooseShop,
      shoptype: 'shopify',
      title: productTitle,
      designID: designID,
      numbericDesignId: numbericDesignId,
      materialID: variantData[0].materialId,
      defaultImage: productImg[0],
      color: productColor,
      image: productImg
    }));

    let optionData = await Option.getData();

    for(let variant of variantData) {
      let { option1: variantName, option2: variantColor, option3: variantSize } = variant;

      // let colorId = optionData.color[variantColor]['id'];
      // let sizeId = optionData.size[variantSize]['id'];
      let designId = numbericDesignId;
      let materialId = variant.materialId;

      // variantColor = _.snakeCase(variantColor);
      let variantNameType = _.snakeCase(variantName);

      // current sku
      // let sku = `unit-${createCampaign.id}-${frontSide}-${materialId}-${colorId}-${sizeId}-${designId}`;

      // new sku
      let productData = await Product.findOne({
        select: ['id'],
        material: materialId,
        size: variantSize,
        color: variantColor
      });

      let { id: productId } = productData;

      // newSku
      let sku = `${productId}-${designId}-${frontSide}`

      console.log(`TEST: sku:${sku} with productId: ${productId} | color: ${variantColor} | size: ${variantSize} `);

      variant.sku = sku;
      // Please dont update barcode here @tamdu
      // has to remove barcode for business issue
      // variant.barcode = `gearment-${createCampaign.id}-${variantNameType}-${variantColor}`;
    }

    let findToken = await Promise.resolve(Shop.findOne({name:chooseShop}).populate('shopifytoken'));

    let shopifyAuth = {
      shop:chooseShop,
      shopify_api_key: apiKey,
      access_token:findToken.shopifytoken[0].accessToken,
    };

    let apiConfig = {
      rate_limit_delay: 10000, // 10 seconds (in ms) => if Shopify returns 429 response code
      backoff: 5, // limit X of 40 API calls => default is 35 of 40 API calls
      backoff_delay: 2000 // 1 second (in ms) => wait 1 second if backoff option is exceeded
    };

    shopifyAuth = Object.assign(apiConfig, shopifyAuth);
    const Shopify = new ShopifyApi(shopifyAuth);

    let pImg =[];
    for (let img=0; img<productImg.length; img++) {
      let eachImg = {
        // "position":position,
        "src": productImg[img],
      };

      pImg.push(eachImg);
    }

    // @TODO Local Test
    pImg = pImg.map(item => {
      return { src : item.src.replace('http://localhost:3000', 'https://beta.gearment.com') }
    });

    let postData = {
      "product": {
        "title": productTitle,
        "body_html": productDescription,
        "handle": productHandle,
        "product_type": 'Apparel',
        "metafields_global_title_tag": productMetaTitle,
        "metafields_global_description_tag": productMetaDesc,
        "vendor": shopifyVendor,
        "published": productPublish,
        "tags": productTags,

        "options": [
          {
            "name": "Style",
          },
          {
            "name": "Color",
          },
          {
            "name": "Size",
          }
        ],
        "variants": variantData,
        "images": pImg
      }
    };

    if(TEST){
      sails.log.debug("group postData", JSON.stringify(postData, null, 2));
      return false;
    }

    Shopify.post('/admin/products.json',postData,function(err,data) {
      if (err) return res.json(err);

      const {product} = data;

      let groupedVariants = _.groupBy(product.variants, (e) => `${_.snakeCase(e.option1)}-${_.snakeCase(e.option2)}`);

      // console.log("group response product variants", JSON.stringify(product.variants, null, 2));

      if (Array.isArray(productCollection)) {
        for (let index = 0; index < productCollection.length; index++) {
          const postCollection = {
            collect: {
              product_id: product.id,
              collection_id: productCollection[index]
            }
          };
          Shopify.post('/admin/collects.json', postCollection, function (err) {
            if(err) return console.log(err);
          })
        }
      }

      let groupedVariantsKeys = Object.keys(groupedVariants);
      _.each(groupedVariants, (variants, groupByBarCode) => {
        let index = groupedVariantsKeys.indexOf(groupByBarCode);
        let variantImg = product.images[index].id; // each product image

        _.each(variants, (variant) => {
          let { id: variantId } = variant;

          let putImg = {
            "variant": {
              "id": variantId,
              "image_id": variantImg
            }
          };

          let shopifyPutUrl = `/admin/variants/${variant.id}.json`;
          const publisher = sails.hooks.kue_publisher;
          const publishData = {
            shopifyPutUrl,
            putImg,
            shopifyAuth,
            title: shopifyAuth.shop
          };
          sails.log.debug("publishData", variant, publishData);

          //publish send confirmation email
          publisher.create('pushshopify', publishData)
                   .priority('high')
                   // .searchKeys( ['title', 'putImg'] )
                   .attempts(30)
                   .backoff( { delay: 3 * 1000, type: 'fixed'} )
                   .on('complete', function(result){
                     console.log('Pushshopify Job completed with data ', result);
                     sails.sockets.broadcast(session_id, 'pushto/shopify', { result })
                   })
                   .removeOnComplete( true )
                   .ttl(600000)
                   .save();

        })
      })

      sails.sockets.broadcast(session_id,'push/success',{p:product.id,shop:chooseShop})
    });
  },

  success:(req,res) => {
    let params = req.allParams();
    res.view('success',{params})
  }

};
