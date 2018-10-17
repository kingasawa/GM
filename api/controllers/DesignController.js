import keyBy from 'lodash.keyby';
import QueryBuilder from 'node-datatable';
import bluebird from 'bluebird';
import replace from 'lodash.replace';
import uuidv4 from 'uuid/v4';

const { apiKey, apiSecret } = sails.config.shopify;
const { shopifyVendor } = sails.config.shopify;
const { designLimit } = sails.config.globals;

import validate from 'validate.js';

module.exports = {
  index: (req, res) => res.json({
    message: "Please dont route index",
  }),
  get: async (req, res) => {
    let { page = 1 } = req.allParams();
    let { id: owner } = req.user;
    let totalDesign = await Design.count({
      select: ['id', 'thumbUrl' , 'design_id'],
      owner
    })

    let designData = await Design.find({
      select: ['id', 'thumbUrl' , 'design_id'],
      owner
    }).paginate({page, limit: designLimit});

    // console.log('designData', designData);
    let totalPage = Math.ceil(totalDesign/designLimit);
    res.json({ designData: [...designData], total: totalDesign, totalPage, limit: designLimit });
  },

  datatable: async(req,res) => {
    const { id } = req.user; // get ID from passport sesion -> req, not raw session
    bluebird.promisifyAll(Design);

    let tableDefinition = {
      dbType: 'postgres',
      sSelectSql: 'd.id,design_id, thumbUrl, d.createdAt, owner, u.username',
      sTableName: 'public.design d LEFT JOIN public.user u on d.owner = u.id',
      sWhereAndSql: ``,
      aSearchColumns: ['design_id','d.createdAt','u.username']
    };

    let queryParams = req.allParams();
    let queryBuilder = new QueryBuilder(tableDefinition);
    let queries = queryBuilder.buildQuery(queryParams);

    // /** fix "createdAt" search issue **/
    let newQueries = {};
    _.each(queries, (value, key) => {newQueries[key] = value.replace( /([a-z]{1,})([A-Z][a-z]{1,})\b/g, '"$1$2"' );})
    queries = newQueries;
    // /** fix "createdAt" search issue **/
    //
    //   // sails.log.debug("SCP:Order:Datatables", queries);
    let recordsFiltered;
    if (queries.recordsFiltered) {
      recordsFiltered = await (Design.queryAsync(queries.recordsFiltered));
      recordsFiltered = recordsFiltered.rows;
    }

    let recordsTotal = await (Design.queryAsync(queries.recordsTotal));
    recordsTotal = recordsTotal.rows;

    let select = await (Design.queryAsync(queries.select));
    select = select.rows;

    let results = {
      recordsTotal,
      select
    };
    if (recordsFiltered) {
      results.recordsFiltered = recordsFiltered;
    }

    res.json(queryBuilder.parseResponse(results))
  },

  search_order: async(req,res) => {
    let { design } = req.allParams();
    bluebird.promisifyAll(Design);

    let query = `select id,shop,internal_notes,tag from public.order 
                  where "line_items"::TEXT ILIKE '%${design}%' 
                  and "tracking" = 'Awaiting-Fulfillment'
                  ORDER BY id DESC
                  `;

    let result = await Design.queryAsync(query);
    let data = result.rows;

    res.view('acp/search_order',{data})
    // res.json(data)

  },
  update: async(req,res) => {
    let params = req.allParams();
    let { name, value, pk: id } = params;

    // let data = {};
    // bluebird.promisifyAll(Design);

    let validateConstraints = {
      name : {
        inclusion: {
          within: ['tag'],
          message: `Can not update`
        }
      }
    };

    // validateConstraints.size.inclusion = {
    //   within: ['tag'],
    //   message: `Can not update`
    // }

    let validateInfo = validate(params, validateConstraints, { format: "grouped" });

    if (validateInfo) {
      return res.json(500, validateInfo);
    }


    let query = {
      id
    }
    let updateData = {
      [name]: value
    }

    await Order.update(query, updateData).catch(e => console.log('Update tag error', e))

      // let query = `select id,shop,internal_notes,tag from public.order
      //               where "line_items"::TEXT ILIKE '%${design}%'
      //               and "tracking" = 'Awaiting-Fulfillment'`;
      //
      // let result = await Design.queryAsync(query);
      // let data = result.rows;
      //
      // res.view('acp/search_order',{data})
    res.json({
      query,
      updateData,
      // data
    })
  },


};

