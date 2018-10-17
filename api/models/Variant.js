module.exports={
  attributes:{
    shop:{
      type:'string'
    },
    variantID:{
      type:'string',
      unique: true
    },
    sku:{
      type:'string'
    },
    // new data to backup the old SKU
    newSku:{
      type:'string'
    },
    skuType:{
      type:'string'
    },
    color:{
      type:'string'
    },
    size:{
      type:'string'
    },
    material:{
      type:'string'
    },
    item:{
      type:'string'
    },
    vendor:{
      type:'string'
    },
    data:{
      type:'json'
    },
    deleted: {
      type: 'integer'
    },
    barcode: {
      type: 'string'
    }
  }
}
