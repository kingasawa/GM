import request from 'request';
// import keyby from 'lodash.keyby';

module.exports = {
  index: (req, res) => {
    return res.view('product/product-home');
  },
  savedSettings: (req, res) => {
    SaveCampaign.find({owner:req.user.id}).exec((err,foundSave) => {
      res.view('product/saved-settings',{foundSave});
    })
  },
  design: async (req, res) => {
    let { shop, hmac, saveId, show = null } = req.allParams();
    let owner = req.user.id;

    let data = await Product.getTotalDesignData({
      shop,
      owner
    });

    data.showSettings = false;
    if(show === 'settings'){
      data.showSettings = true;
    }
    data.getSave = null;
    if(saveId){
      data.getSave = await SaveCampaign.findOne({ id: saveId, owner });
    }

    // console.log('getSave', data.getSave);

    // console.log('data', data);

    // @TODO 1. bulk upload backend first
    // 2. give image logo and calculate backend to push shopify
    // 3. save settings

    // return res.json(data);
    res.view('product/product-add', data
      // designData, shopData, saveCampaignData, settingData, materialData
      //   {
      //   foundSave saveCampaignData,
      //   foundMaterial materialData,
      //   allDesign designData,
      //   foundShop shopData,
      //   getFee settingData
      // }
    );
  },
  bulkClone: async (req, res) => {
    let { shop, hmac, saveId, show = null } = req.allParams();
    let owner = req.user.id;

    let data = {};

    if(saveId){
      data.getSave = await SaveCampaign.findOne({ id: saveId, owner });
    }

    res.view('product/bulk-clone', data
    );
  },
  calculate: async (req, res) => {
    const { material = 3, design = '0493cba06d264d1b851d3141ae4a786c'} = req.allParams();
    sails.log.debug("calculate params", req.allParams());

    let data = await ProductDesign.generateDesignSize({ material, design });
    // material, design, top, left, width, height

    let {
      materialImageId,
      top: topY,
      left: leftX,
      width: logoWidth,
      height: logoHeight,
    } = data;
    // let logo = design;
    // let logoWidth = 195;
    // let logoHeight = 259;
    // let topY = 120;
    // let leftX = 206;
    let color  = 'rgb(39,%2039,%2039)';
    sails.log.debug("calculate data", data);
    // res.json(data);

    res.setHeader('Content-Type', 'images/png');
    // res.setHeader('Cache-Control', `public, max-age=${headerMaxAge}`);

    // let { material, design, top, left, width, height } = data;
    // console.log('calculated data', data);
    // rebuildUrl = `${findUrl[0]}&logoWidth=${width}&logoHeight=${height}&topY=${top}&leftX=${left}&${findUrl[5]}`;
    //
    // // let defaultImage = rebuildUrl + '&material=' + defaultImg + '&color=' + defaultColor;
    //
    // productImg.push(rebuildUrl + '&material=' + dataMaterial + '&color=' + dataColor);

    //http://localhost:3000/uploader/product/?totalLogo=1&logoWidth=195&logoHeight=259&topY=120&leftX=206&logo=523f2042961747e59ad89ba80c3c39ee&material=9f7459f24bb04ed782d24b6bece58152&color=rgb(39,%2039,%2039)
    let product = `http://localhost:3000/uploader/product/?logoWidth=${logoWidth}&logoHeight=${logoHeight}&topY=${topY}&leftX=${leftX}&logo=${design}&material=${materialImageId}&color=${color}`;
    //@TODO waiting for varnish cache
    request
      .get(product)
      // .on('response', function(response) {
      // console.log(response.statusCode) // 200
      // console.log(response.headers['content-type']) // 'images/png'
      // })
      .pipe(res);
  },
};

