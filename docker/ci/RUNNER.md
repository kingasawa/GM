docker run -d --name gitlab-runner --restart always \
--net=app \
  -v /app/service/gitlab-runner/config:/etc/gitlab-runner \
  -v /var/run/docker.sock:/var/run/docker.sock \
  gitlab/gitlab-runner:latest

==========================
#SERVER 10
```
docker run --restart=always -v /root/.ssh:/root/.ssh \
--net=host \
 -dt \
 -v /app/service/ci/data/teamcity:/data/teamcity \
 --name teamcity_server \
 tamdu/teamcity:10
```

#AGENT
```
docker run \
--net=host \
-e TEAMCITY_SERVER_PORT_8111_TCP_PORT=8111 \
-e TEAMCITY_SERVER_HOST=localhost \
--restart=always \
-v /root/.ssh:/root/.ssh \
--name teamcity_agent_1  \
-dt \
tamdu/teamcity-agent:10
```
 --restart=always


=========PS==================
-e TEAMCITY_PACKAGE=TeamCity-10.0.4.tar.gz \
=========PS==================

