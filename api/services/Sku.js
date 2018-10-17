import validate from 'validate.js';


let { skuGeneratorConstraints } = sails.config.sku;

const Sku = {
  generate: ( args ) => {
    let { sideId, productId, designId } = args;
    let mockupValidate = validate(args, skuGeneratorConstraints , { format: "grouped" });
    if (mockupValidate) {
      sails.log.error({ error: mockupValidate});
      return false;
    }

    return `${productId}-${designId}-${sideId}`;
  }
}

module.exports = Sku;
