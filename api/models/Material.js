/**
 * Material.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
import keyBy from 'lodash.keyby';
import bluebird from 'bluebird';

module.exports = {

  attributes: {
    name: {
      type: 'string',
      unique: true,
      // index: true,
      notNull: true
    },
    brand: {
      type: 'string',
      // notNull: true
    },
    brand_code: {
      type: 'string',
      // index: true,
      unique: true,
      // notNull: true
    },
    type: {
      type: 'string',
      index: true,
      notNull: true
    },
    product_type: {
      type: 'string',
      index: true
    },
    oldType: {
      type: 'string',
      index: true,
      // notNull: true
    },
    orderid: {
      type: 'integer',
      index: true,
    },
    // ref with tradegecko product
    tradegecko_id: {
      type: 'integer',
      index: true,
    },
    description: {
      type: 'longtext'
    },
    size: {
      collection: 'materialsize',
      via: 'material'
    },
    color: {
      collection: 'materialcolor',
      via: 'material'
    },
    image: {
      collection: 'materialimage',
      via: 'material'
    },
    cost: {
      collection: 'materialcost',
      via: 'material'
    },
    config: {
      collection: 'materialconfig',
      via: 'material'
    },
    backconfig: {
      collection: 'materialbackconfig',
      via: 'material'
    },
    product: {
      collection: 'product',
      via: 'material'
    },
    shipfee: {
      collection: 'materialship',
      via: 'material'
    }
  },

  get:async function({id, query, populate=[] }){
    let materialQuery = {
      ...query
    }
    if(id) {
      materialQuery.id = id
    }
    let foundMaterial = Material.find(materialQuery)
    populate.map((populateItem) => {
      foundMaterial.populate(populateItem);
    })
    foundMaterial =  await foundMaterial;
    return foundMaterial;
  },

  keyBy: async (key = 'brand_code') => {
    let materialData = await Material.find();
    return keyBy(materialData, key);
  },
  getInfo: async () => {
    bluebird.promisifyAll(Material);
    let materialInfo = await Material.queryAsync(`
      select m.name, m.id, m.brand,i.image, c.color, s.size  
      from material m 
      left join materialcolor c on m.id = c.material 
      left join materialsize s on m.id = s.material
      left join product p on m.id = p.material
      left join materialimage i on m.id = i.material
      ;`);

    return materialInfo.rows;
  },
};

