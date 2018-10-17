https://github.com/thumbor/thumbor/wiki/How-to-upload-images

docker run --net=host --restart=always -d \
--kernel-memory 8096m \
-m 8096m \
-e  UPLOAD_ENABLED=True \
-e UPLOAD_DEFAULT_FILENAME='' \
-e  UPLOAD_DELETE_ALLOWED=True \
-e  QUALITY=80 \
-e  WEBP_QUALITY=80 \
-e  AUTO_WEBP=True \
-e  PNG_COMPRESSION_LEVEL=6 \
-e RESULT_STORAGE_EXPIRATION_SECONDS=172800 \
-e STORAGE_EXPIRATION_SECONDS=172800 \
-e  SECURITY_KEY=NODESHOPISX_SECURED_XKEYX \
-e  UPLOAD_PUT_ALLOWED=True  \
-v /app/service/images/data:/data \
--name image-service apsl/thumbor

#cluster 2
docker run -p 8001:8000 --restart=always -d \
--kernel-memory 2048m \
-m 2048m \
-e  UPLOAD_ENABLED=True \
-e UPLOAD_DEFAULT_FILENAME='' \
-e  UPLOAD_DELETE_ALLOWED=True \
-e  QUALITY=80 \
-e  WEBP_QUALITY=80 \
-e  AUTO_WEBP=True \
-e  PNG_COMPRESSION_LEVEL=6 \
-e RESULT_STORAGE_EXPIRATION_SECONDS=172800 \
-e STORAGE_EXPIRATION_SECONDS=172800 \
-e  SECURITY_KEY=NODESHOPISX_SECURED_XKEYX \
-e  UPLOAD_PUT_ALLOWED=True  \
-v /app/service/images/data:/data \
--name image-service-backup apsl/thumbor

#backup
docker run -p 8002:8000 --restart=always -d \
--kernel-memory 2048m \
-m 2048m \
-e  UPLOAD_ENABLED=True \
-e UPLOAD_DEFAULT_FILENAME='' \
-e  UPLOAD_DELETE_ALLOWED=True \
-e  QUALITY=80 \
-e  WEBP_QUALITY=80 \
-e  AUTO_WEBP=True \
-e  PNG_COMPRESSION_LEVEL=6 \
-e RESULT_STORAGE_EXPIRATION_SECONDS=172800 \
-e STORAGE_EXPIRATION_SECONDS=172800 \
-e  SECURITY_KEY=NODESHOPISX_SECURED_XKEYX \
-e  UPLOAD_PUT_ALLOWED=True  \
-v /app/service/images/data:/data \
--name image-service-ondemand-backup apsl/thumbor



# RESULT CACHE REDIS
-e  RESULT_STORAGE='tc_redis.result_storages.redis_result_storage' \
-e  RESULT_STORAGE_STORES_UNSAFE=True \
-e REDIS_RESULT_STORAGE_SERVER_HOST='localhost' \
-e REDIS_RESULT_STORAGE_SERVER_PORT=6379 \
-e REDIS_RESULT_STORAGE_SERVER_DB=0 \
-e REDIS_RESULT_STORAGE_SERVER_PASSWORD=None \

# RESULT CACHE MONGO
-e MONGO_STORAGE_SERVER_HOST='127.0.0.1' \
-e MONGO_STORAGE_SERVER_PORT='27017' \
-e MONGO_STORAGE_SERVER_DB='thumbor' \
-e MONGO_STORAGE_SERVER_COLLECTION='images' \
-e  RESULT_STORAGE_STORES_UNSAFE=True \


//Webp
-e  WEBP_QUALITY=100 \
 -e  AUTO_WEBP=True \

// Timeout
-e  HTTP_LOADER_CONNECT_TIMEOUT=10 \
-e  HTTP_LOADER_REQUEST_TIMEOUT=30 \

//Log
--log-driver=gcplogs \
--log-opt gcp-log-cmd=true \

# issue can not upload
  -e UPLOAD_MAX_SIZE=10240

# Imaginary

docker run --net=host \
--restart=always \
--kernel-memory 1024m \
-m 1024m \
-e "DEBUG=*" -d --name iresize h2non/imaginary -cors -gzip  -enable-url-source


docker run \
--restart=always \
--kernel-memory 1024m \
-m 1024m \
-p 9001:9000 \
-e "DEBUG=*" -d --name iresize-backup h2non/imaginary -cors -gzip  -enable-url-source
