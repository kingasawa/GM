# NEW GCE

/app/service/app-dbm


docker run --net=host --restart=always -d \
  --name nodeshopis-db \
  -e POSTGRES_PASSWORD="nodeshopisX2017" \
  -e POSTGRES_DB=nodeshopis \
  -v /app/service/app-dbm:/var/lib/postgresql/data \
  postgres


#Prod remove
  -p 8003:5432 \
  -e POSTGRES_PASSWORD="" \

## Dev

  docker run --restart=always -d \
  -p 5434:5432 \
  --name nodeshopis-db \
  -e POSTGRES_PASSWORD="" \
  -e POSTGRES_DB=nodeshopis \
  -v /app/service/app-dbm:/var/lib/postgresql/data \
  postgres

### Dev copy staging db

  ssh duminhtam@104.198.236.57
  sudo su -
  cd /app/service && zip -r app-dbm.zip app-dbm
  scp duminhtam@104.198.236.57:/app/service/app-dbm.zip /app/service
  rm -rf  /app/service/app-dbm && cd  /app/service/ && unzip app-dbm.zip
