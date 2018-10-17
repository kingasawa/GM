https://docs.docker.com/compose/install/

https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-ubuntu-16-04

#APP

```
docker run --name nodeshopis -d -ti \
--net=host --restart=always -d \
-e 'ENDPOINT=start' \
-e 'GIT_REPO=http://deploy:gearmentDeploy2017@git.vnmagic.net/cms/nodeshopis.git' \
--log-driver=gcplogs \
--log-opt gcp-log-cmd=true \
--log-opt labels=`app-cluster` \
--log-opt gcp-meta-name=`web-application` \
tamdu/node:6-json
```

# Initdb
docker run --name nodeshopis-initdb -d -ti \
--net=host --restart=always -d \
-e 'ENDPOINT=initdb' \
-e 'GIT_REPO=http://deploy:gearmentDeploy2017@git.vnmagic.net/cms/nodeshopis.git' \
--log-driver=gcplogs \
--log-opt gcp-log-cmd=true \
--log-opt labels=`app-cluster` \
--log-opt gcp-meta-name=`web-application` \
tamdu/node:6-json

## Staging
docker run --name nodeshopis -d -ti \
--net=host --restart=always -d \
-e 'ENDPOINT=staging' \
-e 'GIT_REPO=http://deploy:gearmentDeploy2017@git.vnmagic.net/cms/nodeshopis.git' \
tamdu/node:6-json


### initdb
docker run --name nodeshopis-initdb -d -ti \
--net=host --restart=always -d \
--log-driver=gcplogs \
--log-opt gcp-log-cmd=true \
-e 'ENDPOINT=staging-initdb' \
-e 'GIT_REPO=git@git.vnmagic.net:cms/nodeshopis.git' \
-v ~/.ssh/:/root/.ssh \
tamdu/node:6-json



## With GELF
  --log-driver=gelf \
  --log-opt gelf-address=udp://log:12201 \
  --log-opt tag=app-cluster \
  --log-opt labels=production,app-cluster \

## With GCP LOG
--log-driver=gcplogs \
--log-opt gcp-log-cmd=true \
--log-opt labels=`app-cluster` \
--log-opt gcp-meta-name=`web-application` \


# no log
--log-driver none \
