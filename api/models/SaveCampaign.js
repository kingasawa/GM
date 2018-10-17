/**
 * SaveCampaign.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    savingName: {
      type: 'string'
    },
    shopName: {
      type: 'string'
    },
    savingToggle: {
      type: 'string'
    },
    savingTitle: {
      type: 'string'
    },
    savingTags: {
      type: 'string'
    },
    savingItems: {
      type: 'json'
    },
    savingCollection: {
      type: 'string'
    },
    savingDescription: {
      type: 'string'
    },
    // This is all save data
    data: {
      type: 'json'
    },
    owner: {
      model: 'user',
      required: true,
      index: true,
      integer: true
    },
  },
  getCampaign: async ({ id = null, owner = null }) => {
    let data = {};
    let ENABLE_SAVECAMPAIGN_CACHE = true;
    let cachePrefix = `savecampaign:getCampaign:${id}:${owner}`;

    sails.log.debug("getCampaign id, owner", id, owner);

    let saveCampaignDataCached = await Cache.getAsync(`${cachePrefix}`);

    if(ENABLE_SAVECAMPAIGN_CACHE && saveCampaignDataCached){
      sails.log.debug("load savecampaign from cache", saveCampaignDataCached);
      data = JSON.parse(saveCampaignDataCached);
    }else{
      let saveCampaignData = await SaveCampaign.findOne({ id, owner });
      if(saveCampaignData){
        let saveCampaignDataString = JSON.stringify(saveCampaignData);
        Cache.set(`${cachePrefix}`, saveCampaignDataString, 'EX', 120);
        data = saveCampaignData;
      }else{
        sails.log.debug("SaveCampaign not found id:%s owner:%s", id, owner);
      }
    }

    return data;
  },

};

