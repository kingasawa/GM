https://www.npmjs.com/package/sails-hook-publisher

#CORE REDIS
  docker run --name redis --net=app --restart=always -v /app/service/redis/data:/data -d redis redis-server --appendonly yes
#NODE WRAPPER
  https://github.com/Automattic/kue

##DOCS
  https://www.npmjs.com/package/npmdoc-kue
##SIMPLE Dashboard
  docker run --net=host -e REDIS_URL=redis://127.0.0.1:6379 --name=kue -d pavlov/kue-dashboard



