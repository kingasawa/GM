sudo docker run \
  --net=app -d \
  --restart=unless-stopped -p 8080:8080 rancher/server


  sudo docker run -d --privileged -v /var/run/docker.sock:/var/run/docker.sock -v /var/lib/rancher:/var/lib/rancher rancher/agent:v1.2.0 http://104.196.242.54:8080/v1/scripts/5B5DF0025865171F8902:1483142400000:NLyoGKwE7xUIm9JBy08qZWTjc
