/**
 * NotificationController
 *
 * @description :: Server-side logic for managing notifications
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const { apiKey, apiSecret } = sails.config.shopify;
// var apiKey = 'ae22432ff4d89ca146649cc782f385f1';
// var apiSecret =  '3573364f9e3da3faa1ee8cb02d1ee017';

module.exports = {
  index: (req,res) => {
    res.ok();
  },
  join: (req,res) => {
    if(req.isSocket){
      let session_id = req.signedCookies['sails.sid'];
      let rooms = [session_id];
      if(req.session.authenticated){
        sails.sockets.join(req, req.session.user.id);
        rooms.push(req.session.user.id);
      }
      rooms.map(room => sails.sockets.join(req, room))
      res.json({ join: rooms });
    }else{
      res.redirect('/');
    }
  },
	order: (req,res) => {
	  let params = req.allParams();

    sails.log.debug("Notification Order",{
      controller:'notification',
      params
    });

    // Never lost notification log
    Logs.create({datalog:params}).exec((err,result)=>{
      if(err) sails.log.error("Notification Order Log Error", err);
    })


    const { act } = params;
    const publisher = sails.hooks.kue_publisher;

    let PRIORITY = 'normal';
    let QUEUE = 'shopifyorderupdate';
    let TITLE_SUFFIX = 'Update';

    if(act === 'create'){
      PRIORITY = 'critical';
      QUEUE = 'shopifyordercreate';
      TITLE_SUFFIX = 'Create';
    }

    const JOB_TIMEOUT = 10 * 1000; // 30s // Timeout fail to update
    const TTL = 60 * 1000; // 60s failed -> mark as ttl failed
    const job = publisher.create(QUEUE, {
      title: `Shopify Order ${TITLE_SUFFIX}`,
      params
    }).priority(PRIORITY)
                         .attempts(3) //why 2? Because this is update to DB
                         .backoff( { delay: JOB_TIMEOUT, type:'fixed'} )
                         .on('complete', function(result){
                           if(result){
                             const { event, data } = result;
                             sails.log.debug({
                               controller: 'notification',
                               msg: `order:completed:result`,
                               result
                             });
                                                          // sails.sockets.blast(event, { data });
                           }else{
                             sails.log.error({
                               controller: 'notification',
                               msg: `order:completed:Some thing wrong please check!!!`,
                             });
                           }
                         })
                         .on('failed attempt', function(errorMessage, doneAttempts){
                           sails.log.error({
                             controller: 'notification',
                             msg: `order:failed_attempt`,
                             error: errorMessage
                           });
                         }).on('failed', function(errorMessage){
                          sails.log.debug({
                            controller: 'notification',
                            msg: `order:failed`,
                            error: errorMessage
                          });
                        })
                         .ttl(TTL)
                         .removeOnComplete( true )
                         .save();
    res.send(200);
    // res.end();
  },

  app: async(req,res)=> {
    res.send(200);
    let params = req.allParams();
    // console.log('event app/uninstalled',params);

    let foundShop = await Promise.resolve(Shop.findOne({name:params.shop}));
    Shop.destroy({id:foundShop.id}).exec(function(){});
    ShopifyToken.destroy({shop:foundShop.id}).exec(function(){})

  },

  easypost: async(req,res) => {
    res.send(200);
    let params = req.allParams();
    let { description,result } = params;
    await Promise.resolve(ScanFormLogs.create({datalog:params}));
    if(description == 'batch.updated'){
      Manifesting.update({batch_id:result.id},{state:result.state}).then(updateDone => {
        console.log('updateDone', updateDone);
      }).catch(err => {
        console.log('err', err);
      })
    }

  },
};

