/**
 * AboutUsController
 *
 * @description :: Server-side logic for managing aboutuses
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

import QueryBuilder from 'node-datatable';
import bluebird from 'bluebird';
import replace from 'lodash.replace';
import uuidv4 from 'uuid/v4';
import keyby from 'lodash.keyby';
const knex = require('knex')({client: 'pg'});

module.exports = {

  list: (req, res) => {
    res.view('user/index');
  },

  datatable: async(req, res) => {
    console.log('sails.config.globals.group.SELLER',sails.config.globals.group.SELLER)
    bluebird.promisifyAll(Order);
    let tableDefinition = {
      dbType: 'postgres',
      sSelectSql: 'u.id, count(o.id) as total_order,sum(total_item_price) as total_amount, u.username, u.email, u.createdAt, u.payment_method, u.status, u.last_login',
      sCountTableName: `public.user u`,
      sTableName: `public.user u LEFT JOIN public.order o on o.owner = u.id AND o.tracking <> 'Cancelled'`,
      sWhereAndSql: `"group" = ${sails.config.globals.group.SELLER}`,
      sGroupBySql: `group by u.id`,
      aSearchColumns: ['u.id', 'u.username','u.createdAt', 'u.email', 'u.status']
    };

    let queryParams = req.allParams();
    let queryBuilder = new QueryBuilder(tableDefinition);
    let queries = queryBuilder.buildQuery(queryParams);

    /** fix "createdAt" search issue **/
    let newQueries = {};
    // _.each(queries, (value, key) => {newQueries[key] = replace(value, /\\/g,'');})
    _.each(queries, (value, key) => {newQueries[key] = value.replace( /([a-z]{1,})([A-Z][a-z]{1,})\b/g, '"$1$2"' );})
    queries = newQueries;

    console.log('queries', JSON.stringify(queries, null, 4));
    /** fix "createdAt" search issue **/

      // sails.log.debug("SCP:Order:Datatables", queries);
    let recordsFiltered;
    if (queries.recordsFiltered) {
      recordsFiltered = await (Order.queryAsync(queries.recordsFiltered));
      recordsFiltered = recordsFiltered.rows;
    }

    let recordsTotal = await (Order.queryAsync(queries.recordsTotal));
    recordsTotal = recordsTotal.rows;

    // let newSelect = knex.with('userDatatable',knex.raw(queries.select))
    //                     .from('userDatatable')
    // console.log('newSelect', newSelect.toString());

    let select = await (Order.queryAsync(queries.select));
    select = select.rows;

    let results = {
      recordsTotal,
      select
    };
    if (recordsFiltered) {
      results.recordsFiltered = recordsFiltered;
    }

    res.json(queryBuilder.parseResponse(results));
  },


  register: async(req, res) => {
    const params = req.allParams();
    sails.log.debug('user:register', params);
    let result = {};
    const user = await Promise.resolve(User.register(params))
                 .then(user => {
                   result.user = user;
                   result.location = `/login?email=${user.email}`;
                   sails.log.debug('user:register user', user);
                 })
                 .catch(err => {
                   sails.log.error('user:register err', JSON.stringify(err));

                   result.error = JSON.stringify(_.get(err, 'invalidAttributes', {}));
                 });

    if(req.isSocket){
      return res.json(result);
    }
    res.redirect(result.location);
  },

  setting: (req,res) => {
    let params = req.allParams();
    let session_id = req.signedCookies['sails.sid'];
    User.update({id:req.session.user.id},{auto_pay:params.autopay}).exec(()=> {
      sails.sockets.broadcast(session_id,'update/setting')
    })
  },

  address: async(req,res) => {
    let params = req.allParams();
    let session_id = req.signedCookies['sails.sid'];
    let foundUser = await Promise.resolve(BillingAddress.findOne({owner:req.user.id}));
    params.owner = req.user.id;
    if(foundUser) {
      BillingAddress.update({owner:req.user.id},params).exec(()=>{
        sails.sockets.broadcast(session_id,'new/address',{msg:'update'})
      })
    } else {
      BillingAddress.create(params).exec(()=>{
        sails.sockets.broadcast(session_id,'new/address',{msg:'create'})
      })
    }
  },

  update: async (req, res) => {
    let { password } = req.allParams();
    let id = req.user.id;

    let updatePassword = new Promise((resolve, reject) => {
      return sails.services.passport.protocols.local.update({ password, id }, (error, result) => {
        let data = {};
        if(error){
          data.error = _.get(error, 'invalidAttributes.password[0].message', {});
        }else{
          data = {
            msg: 'updated'
          }
        }

        resolve(data);
      });
    })
    let result = await updatePassword;

    if(result.error){
      return res.negotiate(result.error)
    }

    res.json(result);

  },

};

