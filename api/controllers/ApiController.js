/**
 * ApiController
 *
 * @description :: Server-side logic for managing aboutuses
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

import validate from 'validate.js';
import bluebird from 'bluebird';
import uuidv4 from 'uuid/v4';
import keyBy from 'lodash.keyby';

const skipperThumbor = require('skipper-thumbor');

const config = sails.config.uploader;

// Fix SSL uploader
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

const { sideInfo, getSkuConstraints, putImageConstraints } = sails.config.sku;

const DESIGN_THUMB = 'http://img.gearment.com/load/f01d8978f0514fd98e68603c7d3edf42/320x320'

module.exports = {
  postDesign: (req, res) => {
    let owner = req.owner;

    const uploadConfig = {
      maxBytes: 100000000,
      adapter: skipperThumbor,
      imageHost: config.imageHost,
      imageSecret: config.imageSecret
    };

    req.file('image').upload(uploadConfig, function(err, uploadedFiles) {
      if (err) {
        sails.log.error('Upload Image Error', err);
        return res.badRequest({
          error: err,
        });
        // return res.serverError(err);
      }

      if (_.size(uploadedFiles) === 0 || !_.get(uploadedFiles, '[0].extra.id')) {
        return res.badRequest({
          error: 'UPLOAD_ERROR',
        });
      }

      let id = _.get(uploadedFiles, '[0].extra.id');

      if (!id) {
        return res.badRequest({
          error: 'UPLOAD_ERROR',
        });
      }

      let { filename } = _.get(uploadedFiles, '[0]')

      console.log('uploadedFiles filename', filename, JSON.stringify(uploadedFiles));

      const fitlUrl = `${sails.config.uploader.imageHost}/load/${id}/600x600`;
      const thumbUrl = `${sails.config.uploader.imageHost}/load/${id}/320x320`;

      // uploadedFiles[0].extra.fitlUrl = fitlUrl;
      // uploadedFiles[0].extra.thumbUrl = thumbUrl;
      // uploadedFiles[0].extra.filename = filename;

      let responseData = {
        ...uploadedFiles[0].extra,
        fitlUrl,
        thumbUrl,
        filename,
        imageId: id
      }

      Image.create({
        id,
        name: filename,
        owner
      }).exec((err, imageCreated) => {
        console.log('imageCreated', err, imageCreated);
      })

      Design.create({
        id,
        thumbUrl,
        owner
      }).exec(function(err, addDesign) {
        // sails.sockets.broadcast(session_id, broadCastchannel, { msg:addDesign })
        if (err) {
          return res.badRequest(err);
        }
        let { design_id: designId } = addDesign

        responseData = {
          ...responseData,
          designId,
          imageId: id
        }

        return res.json(responseData);
      })
    });
  },
  postImage: (req, res) => {
    let owner = req.owner;

    const uploadConfig = {
      maxBytes: 100000000,
      adapter: skipperThumbor,
      imageHost: config.imageHost,
      imageSecret: config.imageSecret
    };

    req.file('image').upload(uploadConfig, function(err, uploadedFiles) {
      if (err) {
        sails.log.error('Upload Image Error', err);
        return res.badRequest({
          error: err,
        });
        // return res.serverError(err);
      }

      if (_.size(uploadedFiles) === 0 || !_.get(uploadedFiles, '[0].extra.id')) {
        return res.badRequest({
          error: 'UPLOAD_ERROR',
        });
      }

      let id = _.get(uploadedFiles, '[0].extra.id');

      if (!id) {
        return res.badRequest({
          error: 'UPLOAD_ERROR',
        });
      }

      let { filename } = _.get(uploadedFiles, '[0]')

      console.log('uploadedFiles filename', filename, JSON.stringify(uploadedFiles));

      const fitlUrl = `${sails.config.uploader.imageHost}/load/${id}/600x600`;
      const thumbUrl = `${sails.config.uploader.imageHost}/load/${id}/320x320`;

      let responseData = {
        ...uploadedFiles[0].extra,
        fitlUrl,
        thumbUrl,
        filename,
        imageId: id
      }

      Image.create({
        id,
        name: filename,
        owner
      }).exec((err, imageCreated) => {
        sails.log.error('API:postImage error', err, imageCreated);
      })

      return res.json(responseData);
    });
  },
  putDesign: async (req, res) => {
    let owner = req.owner;
    let params = req.allParams();
    let { designId, imageId } = params;

    let foundImageId = await Image.findOne({
      id: imageId,
      owner
    })

    if (!foundImageId) {
      return res.json(500, { error: { imageId: 'imageId not found' } });
    }

    let validateData = validate(params, putImageConstraints, { format: "grouped" });
    if (validateData) {
      return res.json(500, validateData);
    }

    let updateData = {
      id: imageId,
      thumbUrl: `http://img.gearment.com/load/${imageId}/320x320`
    };

    Design.update({
      design_id: designId,
      owner
    }, updateData).exec((err, updateData) => {
      if (err) {
        sails.log.error('API:putDesign error', err);
        return res.negotiate({ error: err.invalidAttributes });
      }
      sails.log.debug('API:putDesign update data', updateData);
      res.json(updateData);
    })

  },
  getProduct: async (req, res) => {
    let materialData = await Material.getInfo();
    let { id } = req.allParams()


    if (id) {
      if (materialData[id]) {
        materialData = materialData[id];
      }
    }else{
      materialData = keyBy(materialData, 'id');
    }

    res.json(materialData);
  },
  postSku: async (req, res) => {
    let params = req.allParams();

    let { side, mockup, color, size, designId } = params;

    let { owner } = req;

    if (designId) {
      let foundDesign = await Design.findOne({
        design_id: designId,
        owner
      })
      if (!foundDesign) {
        return res.json(500, {
          error: {
            designId: "designId not found"
          }
        });
      };
      sails.log.debug('API:postSku data',foundDesign)
    }

    // Generate fake designId
    let fakeDesignLongId = uuidv4();

    bluebird.promisifyAll(Product);

    let mockupValidate = validate(params,
      { mockup: getSkuConstraints.mockup },
      { format: "grouped" });
    if (mockupValidate) {
      return res.json(500, mockupValidate);
    }

    // @TODO cache data here
    let productColorData = await Product.queryAsync(`select distinct(color) from product where material=${mockup}`);
    productColorData = productColorData.rows;
    productColorData = productColorData.map((item) => item.color);
    let productSizeData = await Product.queryAsync(`select distinct(size) from product where material=${mockup}`);
    productSizeData = productSizeData.rows;
    productSizeData = productSizeData.map((item) => item.size);

    // console.log('productColorData', productColorData);
    // console.log('productSizeData', productSizeData);

    //params yêu cầu có materialID , color , size , ownerID , side(text)
    //thiếu 1 trong những params này thì báo lỗi cho seller biết thiếu gì.
    getSkuConstraints.color.inclusion = {
      within: productColorData,
      message: `Support: ${productColorData.join(', ')} only`
    }
    getSkuConstraints.size.inclusion = {
      within: productSizeData,
      message: `Support: ${productSizeData.join(', ')} only`
    }

    let validateInfo = validate(params, getSkuConstraints, { format: "grouped" });

    if (validateInfo) {
      return res.json(500, validateInfo);
    }

    // Prepare SKU data
    let sideId = sideInfo[side];
    if (!designId) {
      //lấy dữ liệu ở trên để tạo 1 cái design khống lấy id . để sau này seller còn sửa đc
      let addDesign = await Promise.resolve(Design.create({
        id: fakeDesignLongId,
        thumbUrl: DESIGN_THUMB, // fixed image
        owner
      }));
      designId = addDesign.design_id;
    }

    let foundProductID = await Product.findOne({
      select: ['id'],
      material: mockup,
      color,
      size
    });
    let { id: productId, } = foundProductID;

    let sku = Sku.generate({
      sideId,
      productId,
      designId
    });

    sails.log.debug('API:postSku data',{foundProductID,sku})
    // console.log('sku', sku);
    res.json({
      sku,
    })
  }
};

