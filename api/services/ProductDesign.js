import Thumbor from 'thumbor';
import request from 'request';
import requestImageSize from 'request-image-size';
import qs from 'qs';
var keyBy = require('lodash.keyby');

const { shopifyVendor } = sails.config.shopify;
module.exports = {
  getImageSize: async ({id, url = ''}) => {
      // let { id, url = '' } = req.allParams();
      let ENABLE_IMAGE_SIZE_CACHE = true;

      let cachePrefix = 'imageSize';

      let cacheData = await Cache.getAsync(`${cachePrefix}:${id}`);

      if(ENABLE_IMAGE_SIZE_CACHE && cacheData){
        sails.log.debug("cacheData", cacheData);
        let [width, height] = cacheData.split('x');
        if(!width || !height) {
          return false;
        }
        let result = {
          width,
          height
        };
        sails.log.debug("cacheData", cacheData);
        sails.log.debug("cacheData result", result);
        return result;
      }

      let quality = 10;
      const thumborService = new Thumbor(sails.config.uploader.imageSecret, sails.config.uploader.imageHost);

      if(!id){
        return false;
      }

      const imageUrl = thumborService.setImagePath(id)
                                     // .fitIn(600, 600)
                                     .filter(`quality(${quality})`)
                                     .buildUrl();
      url = imageUrl;

      let imageSizePromise = new Promise((resolve, reject) => {
        let data = requestImageSize(`${url}`, async function(err, size, downloaded) {

          if (err) {
            console.log('error');
            return reject(err);
          }

          if (!size) {
            Cache.set(`${cachePrefix}:${id}`, `0`, 'EX', 3600);
            console.log('cache set');
            return reject();
          }

          Cache.set(`${cachePrefix}:${id}`, `${size.width}x${size.height}`, 'EX', 86400 * 365);

          console.log('data  0 size', size);
          let result = {
            width: size.width,
            height: size.height,
          };

          resolve(result);

        });
      })

      let result = await Promise.resolve(imageSizePromise);

      return result;

  },
  resizeFit: (srcWidth, srcHeight, maxWidth, maxHeight) => {
        let ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
    return { width: srcWidth*ratio, height: srcHeight*ratio };
  },
  calculateDesign: async ({ material = 3,
                            design = '0493cba06d264d1b851d3141ae4a786c',
                            saveId = null, // if load data with saveId
                            owner = null,
                            // saveColor = null,
                            front = true,
                            data = {}}) => {
    //material: 17 - 9d3814ba1ed84bdd8bac51edc471d5da
    //material: 4 - 3cb069852183472e88b2cbff37f6a406 - ao khoac

    const { baseUrl } = sails.config.globals;

    //Init Data
    data = {
      productPublish: '',
      productHandle: '',
      chooseShop: '',
      productVendor: '',
      productDescription: '',
      productTitle: '',
      productCollection: [],
      productTags: [],
      //overwrite Data
      ...data
    };
    // material: 3
    // get total design size + color
    let designData = await Product.getDesignData({ id: material });

    designData = designData[0];

    let { cost, config, image, color, size, name: materialName, brand: materialBrand, type: materialType } = designData;
    config = config[0];
    image = image[0]['image'];
    color = color[0]['color'];
    size = size[0]['size'];

    let materialCost = parseFloat(cost[0]['cost']);
    let materialMinPay = parseFloat(cost[0]['minPay']);
    let materialProfit = materialMinPay - materialCost;

    sails.log.debug("saveId", saveId);
    sails.log.debug("owner", owner);

    if(saveId && owner){
      let getSave = await SaveCampaign.getCampaign({ id: saveId, owner });
      let saveData = _.get(getSave, `data`, null);

      //Saving items
      let savingItems = keyBy(_.get(getSave, 'savingItems', []), 'itemID');
      let saveColor = _.get(savingItems, `${material}.itemColor`, null);
      let savePrice = _.get(savingItems, `${material}.itemPrice`, null);
      let saveDataTags = _.get(saveData, `tags`, null);

      // Overwrite the default color with saved setting color
      color = saveColor;

      // Set user saved price & auto calculate the price for others
      materialMinPay = parseFloat(savePrice);
      materialProfit = materialMinPay - materialCost;

      // Set the shop to publish
      data.chooseShop = _.get(saveData, 'shop', null)

      data.productCollection = _.get(saveData, 'collection', []).filter(Boolean);

      // Convert the saving tag
      if(saveDataTags){
        data.productTags = saveDataTags.split(',');
      }

      data.productPublish = (_.get(saveData, 'publish', null) === 'on' ) ? true : false;
      data.productHandle = _.get(saveData, 'handle', null)
      data.productVendor = _.get(saveData, 'vendor', shopifyVendor) || shopifyVendor
      data.productDescription = _.get(saveData, 'body_html', null)
      data.productTitle = _.get(saveData, 'title', null)


      console.log('service productdesign getSave', getSave);
      console.log('service productdesign saveDataTags', saveDataTags);
    }

    let { frontimg, backimg } = image;

    let materialId;
    if(front){
      materialId = frontimg.match(/[a-z0-9]{30,}/)[0];
    }else{
      materialId = backimg.match(/[a-z0-9]{30,}/)[0];
    }

    let { width: frameWidth, height: frameHeight, top: frameTop, left: frameLeft } = config;
    // design: 0493cba06d264d1b851d3141ae4a786c
    // get image size

    let imageSize = await ProductDesign.getImageSize({ id: design })

    let { width: imageWidth, height: imageHeight } = imageSize;

    let imageFit = ProductDesign.resizeFit(imageWidth, imageHeight, frameWidth, frameHeight);

    // Position the image to material
    let top = 0;
    let left = 0;

    let imageFitWidth = Math.floor(imageFit.width);
    let imageFitHeight = Math.floor(imageFit.height);
    /* Start auto scale logo to fix design area */
    if (imageFitWidth < frameWidth) {
      // console.log('auto center align');
      left = (frameWidth - imageFitWidth)/2;
    }
    if (imageFitHeight < frameHeight) {
      // console.log('auto middle align');
      top = (frameHeight - imageFitHeight)/2;
    }

    // Add with frame
    top+= frameTop;
    left+= frameLeft;

    // data.position = {
    //   top,
    //   left
    // }
    // End Position the image to material

    // Image url
    //http://localhost:3000/uploader/product/?totalLogo=1&logoWidth=195&logoHeight=276&topY=120&leftX=206&logo=0493cba06d264d1b851d3141ae4a786c&material=8c6126536c084ed28c207aee9fb2ca79&color=rgb(47,%2058,%2076)
    //http://localhost:3000/uploader/product?logoWidth=197&logoHeight=280&topY=0&leftX=0&logo=0493cba06d264d1b851d3141ae4a786c&color=rgb%2847%2C%2058%2C%2076%29"

    //Create productImage
    data.productImg = [];
    data.variantData = [];
    _.each(color, (materialColor) => {
      let { name: materialColorName, value: materialColorValue } = materialColor;
      materialColorValue = materialColorValue.replace('#', '');
      let imageData = {
        material: materialId,
        logoWidth: imageFitWidth,
        logoHeight: imageFitHeight,
        topY: top,
        leftX: left,
        logo: design,
        color: materialColorValue
      };

      let productImg = `${baseUrl}/uploader/product?${qs.stringify(imageData)}`;
      data.productImg.push(productImg);

      _.each(size, (materialSizeData) => {
        let { size: materialSize, price: materialPrice } = materialSizeData;
        // Size to variant
        let option1 = materialName;
        let option2 = materialColorName;
        let option3 = materialSize;

        // This will add with simple material Profit
        let price = parseFloat(materialPrice) + parseFloat(materialProfit);

        let productVariant = {
          option1,
          option2,
          option3,
          price
        }

        data.variantData.push(productVariant);
      })
    })

    // Create product variantData

    // @TODO Local Test
    // pImg = pImg.map(item => {
    //   return { src : item.src.replace('http://localhost:3000', 'https://beta.gearment.com') }
    // });

    // @TODO calculate top left based on material config
    return data;
  },
  generateDesignSize: async ({
                               material = 3,
                               design = '0493cba06d264d1b851d3141ae4a786c',
                               userWidth = 100,
                               userHeight = 100,
                               front = true }) => {
    //material: 17 - 9d3814ba1ed84bdd8bac51edc471d5da
    //material: 4 - 3cb069852183472e88b2cbff37f6a406 - ao khoac

    const { baseUrl } = sails.config.globals;

    let data = {};

    // material: 3
    // get total design size + color
    let designData = await Material.findOne({ id: material }).populate('config').populate('image');

    // console.log('designData', designData);
    // designData = designData[0];

    let { config, image: materialImage } = designData;

    materialImage = materialImage[0];
    config = config[0];

    materialImage = (front) ? materialImage.image.frontimg : materialImage.image.backimg;

    let materialImageId = materialImage.match(/[a-z0-9]{30,}/)[0];
    console.log('materialImageId', materialImageId);

    let { width: frameWidth, height: frameHeight, top: frameTop, left: frameLeft } = config;
    // design: 0493cba06d264d1b851d3141ae4a786c
    // get image size

    let imageWidth, imageHeight;
    // Position the image to material
    let top = 0;
    let left = 0;

    if(userWidth === 0 && userHeight === 0){
      let imageSize = await ProductDesign.getImageSize({ id: design })
      // imageWidth = imageSize.width;
      // imageHeight = imageSize.height;
      let imageFit = ProductDesign.resizeFit(imageSize.width, imageSize.height, frameWidth, frameHeight);

      imageWidth = Math.floor(imageFit.width);
      imageHeight = Math.floor(imageFit.height);

      /* Start auto scale logo to fix design area */
      if (imageWidth < frameWidth) {
        // console.log('auto center align');
        left = (frameWidth - imageWidth)/2;
      }
    }else{
      imageWidth = parseInt(userWidth, 10);
      imageHeight = parseInt(userHeight, 10);

      if (imageWidth > frameWidth || imageHeight > frameHeight) {
        let imageFit = ProductDesign.resizeFit(imageSize.width, imageSize.height, frameWidth, frameHeight);
        imageWidth = Math.floor(imageFit.width);
        imageHeight = Math.floor(imageFit.height);
        sails.log.debug("user size is greater than the frame auto resize within the frame", imageWidth, imageHeight);
      }
    }

    // let imageFitWidth = Math.floor(imageFit.width);
    // let imageFitHeight = Math.floor(imageFit.height);

    // @TODO disable middle align
    // if (imageFitHeight < frameHeight) {
      // console.log('auto middle align');
      // top = (frameHeight - imageFitHeight)/2;
    // }

    // Add with frame
    top+= frameTop;
    left+= frameLeft;

    data = {
      material, design, top, left,
      width: imageWidth, height: imageHeight,
      materialImageId,
    }

    return data;
  }
};
