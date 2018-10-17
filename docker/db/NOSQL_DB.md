# NEW GCE

/app/service/app-dbm


docker run --net=host --restart=always -d \
  --name nodeshopis-db \
  -e POSTGRES_PASSWORD="nodeshopisX2017" \
  -e POSTGRES_DB=nodeshopis \
  -v /app/service/app-dbm:/var/lib/postgresql/data \
  postgres

docker run --name mongo -v ~/docker/mongo_gm/data:/data/db \
-p 27017:27017 \
-d mongo:latest

