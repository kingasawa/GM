#NETWORK

Moral of the story:

--publish-service was renamed to --net. To let containers one another without --link:

Create a network using docker network create $NETWORK_NAME
Create your containers using docker create --net $NETWORK_NAME
You can then refer to containers sharing the same network by their hostname (either the --name you passed in to create/run, or docker inspect --format '{{.Config.Hostname}}' $CONTAINER_ID).

$ docker network create middle_earth
2533f0e8688170dae6a7524d517229b2944b8ae97a90f127811d4026237d9af7

$ docker run --name shire --detach --net middle_earth httpd:2.4
857986782e9cc040c6b421d703e9f1522ed767b57e11c81f8352e07036f4ea16

$ docker run --name mordor --detach --net middle_earth httpd:2.4
5f798add4b8df14c5d8ae7aeecbda85d69eb731a6bbcf01be118c5dced7f1a7c

$ docker exec -t mordor ping -c 2 shire

##Swarm
  https://docs.docker.com/engine/swarm/swarm-mode/

##Weave
  https://www.weave.works/guides/networking-docker-containers-with-weave-on-ubuntu/
