/**
 * UpdateOrderController
 *
 * @description :: Server-side logic for managing aboutuses
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  getProductData: async (req, res) => {
    let { sku } = req.allParams();
    let detectSku = await Report.getGearmentSKU(sku,'Gearment');
    let select = ['id','name'];
    console.log(sku);

    if(detectSku.skuType == 'old'){
      let material = await Material.findOne({
        select, or: [{type: detectSku.variantNameType},{ oldType: detectSku.variantNameType}]
      }).populate('color').populate('size');
      res.json(material);
    }

    if(detectSku.skuType == 'current') {
      let material = await Material.findOne({
        select,id:detectSku.materialId
      }).populate('color').populate('size');
      res.json(material);
    }

    if(detectSku.skuType == 'new') {
      let foundMaterialId = await Product.findOne({select:['material'],id:detectSku.productId});

      let material = await Material.findOne({
        select,id:foundMaterialId.material
      }).populate('color').populate('size');
      res.json(material);
    }

  },

  edit: async(req,res)=>{
    let { orderId, sku, item } = req.allParams();
    sails.log.debug('Order:Edit:Params',req.allParams());
    let newValue = `${item.style} / ${item.color} / ${item.size}`;
    let changeCost = item.price;
    let newTotalBaseCost = 0;
    let newItemBaseCost;
    let currentValue;

    let foundOrder = await Order.findOne({id:orderId});
    _.each(foundOrder.line_items,(item)=>{
      if(item.sku == sku) {
        currentValue = item.variant_title;
        item.variant_title = newValue;
        item.basecost = changeCost;
      };

      newItemBaseCost = (item.basecost * item.quantity);
      newTotalBaseCost += newItemBaseCost;
    });


    let updateData = {
      line_items:foundOrder.line_items,
      total_item_basecost:newTotalBaseCost
    }

    Order.update({id:orderId},updateData)
         .then((result)=>{
            let createData = {
              orderid: orderId,
              type: 'edit',
              data: {sku,currentValue,newValue,msg:'Seller edit variant option'},
              owner: req.user.id
            }
           OrderAction.create(createData).catch((err)=>{
             sails.log.debug('OrderAction:create:failed',err)
           })
           sails.log.debug('Order:Edit:Success',result.line_items);
         })
         .catch((err)=>{sails.log.error('Order:Edit:Failed',err)})


    res.json({msg:'ok'});

    }

};

