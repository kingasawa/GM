require('sails').load({
    hooks: {
        blueprints: false,
        controllers: false,
        cors: false,
        csrf: false,
        grunt: false,
        http: false,
        i18n: false,
        logger: false,
        //orm: leave default hook
        policies: false,
        pubsub: false,
        request: false,
        responses: false,
        //services: leave default hook,
        session: false,
        sockets: false,
        views: false
    }
}, function(err, app){

    //You can access all your SailsJS Models and Services here
    User.findOne(1).then(function(user){
        console.log(user)
    })
})
