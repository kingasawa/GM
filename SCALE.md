http://deploy:gearmentDeploy2017@git.vnmagic.net/cms/nodeshopis.git

docker run --name nodeshopis -d -ti --net=host --restart=always -d -e 'ENDPOINT=start' -e 'GIT_REPO=http://deploy:gearmentDeploy2017@git.vnmagic.net/cms/nodeshopis.git' -v ~/.ssh/:/root/.ssh --log-driver none tamdu/node:6


docker run -d --restart=always --name registry \
--net=host \
  -v /root/auth:/auth \
  -e "REGISTRY_AUTH=htpasswd" \
  -e "REGISTRY_AUTH_HTPASSWD_REALM=Registry Realm" \
  -e REGISTRY_AUTH_HTPASSWD_PATH=/auth/htpasswd \
  registry:2

-v /root/certs:/certs \
  -e REGISTRY_HTTP_TLS_CERTIFICATE=/certs/dev_instance.crt \
  -e REGISTRY_HTTP_TLS_KEY=/certs/dev_instance.key \

