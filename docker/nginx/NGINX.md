#Docker start

## NEW GCE
sudo docker run --net=host --restart=always -d -v /app/service/nginx/nginx.conf:/etc/nginx/nginx.conf -v /app/service/nginx/conf.d:/etc/nginx/conf.d -v /app/service/nginx/log:/var/log/nginx -v /app/service/nginx/certs:/etc/nginx/certs --name nginx nginx


sudo docker run --net=app --restart=always -d -p 80:80 -p 443:443 -v /app/service/nginx/nginx.conf:/etc/nginx/nginx.conf -v /app/service/nginx/conf.d:/etc/nginx/conf.d -v /app/service/nginx/log:/var/log/nginx -v /app/service/nginx/certs:/etc/nginx/certs --name nginx nginx
##Docker start notes
 -v /app/service/nginx/html:/usr/share/nginx/html/
 /root/nginx/sites-enabled:/etc/nginx/conf.d -v /root/nginx/certs:/etc/nginx/certs -v /root/nginx/logs:/var/log/nginx -v /root/nginx/html:/var/www/html


#SSL free

https://www.sslforfree.com/create?generate&domains=img.gearment.com

#Security conf
https://gist.github.com/plentz/6737338


#Rate limit + performance
https://gist.github.com/ipmb/472da2a9071dd87e24d3


#SOCKET
https://gist.github.com/atma/6262642
