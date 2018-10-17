# GCE new persistance
docker run --name redis \
  --net=host \
  --restart=always \
  -v /app/service/redis:/data \
  -d \
  redis redis-server --appendonly yes

# Dont use
  docker run --name mongo \
  --net=app \
  --restart=always \
  -v /app/service/mongo/data/db:/data/db \
  -d \
  mongo

  -p 6379:6379 \

  docker run --name redis \
  --net=host \
  --restart=always \
  -d \
  redis redis-server


  -v /app/service/redis/data:/data \
