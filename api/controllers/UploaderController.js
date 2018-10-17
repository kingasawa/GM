const skipperThumbor =  require('skipper-thumbor');
import Thumbor from 'thumbor';
import request from 'request';
import requestImageSize from 'request-image-size';

const config = sails.config.uploader;

// Fix SSL uploader
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
const headerMaxAge = 14 * 86400;

module.exports = {
  index: (req, res) => {
    const uploadConfig = {
      maxBytes: 100000000,
      adapter: skipperThumbor,
      imageHost: config.imageHost,
      imageSecret: config.imageSecret
    };

    let owner = req.user.id;
    // let fileName = _.get(req, '_readableState.pipes.partFilename', null);
    // sails.log.info('Upload Image uploadConfig', uploadConfig)
    req.file('image').upload(uploadConfig,
      function (err, uploadedFiles){
      if (err) {
        sails.log.error('Upload Image Error', err);
        return res.badRequest({
          error: err,
        });
        // return res.serverError(err);
      }


        if(_.size(uploadedFiles) === 0 || !_.get(uploadedFiles, '[0].extra.id')) {
          return res.badRequest({
            error: 'UPLOAD_ERROR',
          });
        }
        // console.log('uploadedFiles', uploadedFiles);
        // console.log('uploadedFiles[0]', uploadedFiles[0]);

        let { filename } = _.get(uploadedFiles, '[0]')

      // let thumborService;
      // thumborService = new Thumbor(sails.config.uploader.imageSecret, sails.config.uploader.imageHost);
      // const fitlUrl = thumborService.setImagePath(uploadedFiles[0].extra.id).fitIn(600, 600).filter('fill(transparent)').buildUrl();
      // thumborService = new Thumbor(sails.config.uploader.imageSecret, sails.config.uploader.imageHost);
      // const thumbUrl = thumborService.setImagePath(uploadedFiles[0].extra.id).fitIn(320, 320).filter('fill(transparent)').buildUrl();


      let id = uploadedFiles[0].extra.id;
      const fitlUrl = `${sails.config.uploader.imageHost}/load/${id}/600x600`;
      const autoWidthlUrl = `${sails.config.uploader.imageHost}/load/${id}/0x600`;
      const thumbUrl = `${sails.config.uploader.imageHost}/load/${id}/320x320`;

      uploadedFiles[0].extra.fitlUrl = fitlUrl;
      uploadedFiles[0].extra.thumbUrl = thumbUrl;
      uploadedFiles[0].extra.filename = filename;
      uploadedFiles[0].extra.autoWidthlUrl = autoWidthlUrl;

      Image.create({
        id,
        name: filename,
        owner
      }).exec((err, imageCreated) => {
        console.log('imageCreated', err, imageCreated);
      })

      // fitIn
      return res.json(uploadedFiles[0].extra);
    });
  },
  crop: (req, res) => {
    // crop images generate safe url for public use
    const { id } = req.allParams();
    const safeUrl = ThumborService.setImagePath(id).resize(50, 50).buildUrl();

    const result = {
      url: safeUrl
    };

    res.json(result);
  },

  product: (req, res) => {
    // crop images generate safe url for public use
    let { logo, material,
      color = 'white',
      topY = 105,
      leftX = 'center',
      transparent = 0,
      quality = 100, // seller love it
      scaleX = 1,
      scaleY = 1,
      logoWidth = 100,
      logoHeight = 100,
      // materialHeight = 0,
      // materialWidth = 670,
      materialWidth= 0,
      materialHeight = 600,
    } = req.allParams();

    // @TODO Khong duoc sua
    const RATIO_INCREASED = 1.230; // @TODO so nay phai thay doi khi material thay doi width hoac height

    logoWidth = Math.ceil(logoWidth * RATIO_INCREASED);
    logoHeight = Math.ceil(logoHeight * RATIO_INCREASED);
    materialHeight = Math.ceil(materialHeight * RATIO_INCREASED);
    materialWidth = Math.ceil(materialWidth * RATIO_INCREASED);
    topY = Math.ceil(topY * RATIO_INCREASED);
    if(leftX !== 'center'){
      leftX = Math.ceil(leftX * RATIO_INCREASED);
    }

    if(color.indexOf('#') > -1){
      color = color.replace('#', '');
      console.log('color', color);
    }else{
      // Convert to hex color
      // color = color.replace(/%20/g,'');
      // color = color.replace(/ /g,'');
      console.log('color', color);
      color = Color.rgb2hex(color);

    }

    let thumborService
    let logoUrl;
    if(logo){
      // logoUrl = thumborService.setImagePath(logo).fitIn(logoWidth, logoHeight).filter('fill(transparent)').buildUrl();
      logoUrl = `${sails.config.uploader.imageHost}/best-load/${logo}/${logoWidth}x${logoHeight}`;
    }
    // let thumborService = new Thumbor(sails.config.uploader.imageSecret, sails.config.uploader.imageHost);
    // const materialUrl = thumborService.setImagePath(material).fitIn(materialWidth, materialHeight).buildUrl();

    let materialUrl = `${sails.config.uploader.imageHost}/load/${material}/${materialWidth}x${materialHeight}`;



    thumborService = new Thumbor(sails.config.uploader.imageSecret, sails.config.uploader.imageHost);

    let productThumbor = thumborService.setImagePath(materialUrl)
                                .filter(`fill(${color},1)`)
                                // .filter(`watermark(${logoUrl},${leftX},${topY},${transparent})`)
                                // .buildUrl();

    if(logoUrl){
      productThumbor = productThumbor.filter(`watermark(${logoUrl},${leftX},${topY},${transparent})`)
    }

    let product = productThumbor.buildUrl();
    // product = thumborService.setImagePath(product)
    //                             .filter(`quality(${quality})`)
    //                             .buildUrl();

    // product = product.replace(sails.config.uploader.imageHost, sails.config.uploader.imageHostSSL)

    const result = {
      product,
      // logoUrl,
      // materialUrl,
    };

    console.log('productThumbor', productThumbor);
    console.log('materialUrl', materialUrl);
    sails.log.debug("product Url", product);

    res.setHeader('Content-Type', 'images/png');
    res.setHeader('Cache-Control', `public, max-age=${headerMaxAge}`);

    //@TODO waiting for varnish cache
    request
      .get(product)
      // .on('response', function(response) {
        // console.log(response.statusCode) // 200
        // console.log(response.headers['content-type']) // 'images/png'
      // })
      .pipe(res);

    // res.json(result);
  },
  imageSize: async (req, res) => {
    let { id, url = '' } = req.allParams();
    let result = await ProductDesign.getImageSize({ id, url })
    res.json(result);
  },

};

