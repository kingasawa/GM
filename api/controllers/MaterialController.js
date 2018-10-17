/**
 * AboutUsController
 *
 * @description :: Server-side logic for managing aboutuses
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  get: async (req, res) => {
    let { q, id } = req.allParams();
    let populate = ['image']
    let query = {select:['id','name'] }
    if(q){
      query.name =  { 'like': `%${q}%` }
    } else if(id){
      query.id =  id;
    }
    let foundMaterial = await Material.get({query,populate})
    // let foundMaterial = await Material.find(findQuery).populate('materialimage');

    if(id){
      foundMaterial = foundMaterial[0];
    }

    res.json(foundMaterial);
    // return res.view('aboutUs', data)
  }
};

