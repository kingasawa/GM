module.exports.shopify = {
  apiKey: 'ae22432ff4d89ca146649cc782f385f1',
  apiSecret: '3573364f9e3da3faa1ee8cb02d1ee017',
  shopifyVendor: 'Gearment',
  apiConfig: {
    rate_limit_delay: 10000, // 10 seconds (in ms) => if Shopify returns 429 response code
    backoff: 5, // limit X of 40 API calls => default is 35 of 40 API calls
    backoff_delay: 2000 // 1 second (in ms) => wait 1 second if backoff option is exceeded
  }
};
