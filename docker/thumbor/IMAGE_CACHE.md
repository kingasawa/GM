docker run --name redis \
--net=host \
--restart=always \
-d \
redis

docker run --name redis --net=host --restart=always -d redis

docker run --name mongo \
--net=host \
--restart=always \
 -v /app/service/mongo:/data/db -d mongo
