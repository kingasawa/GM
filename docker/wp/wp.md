docker run \
--restart=always \
-v /app/service/wordpress/datadir:/var/lib/mysql \
--name wordpressdb -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=wordpress -d mysql:5.7

docker  run \
 --restart=always \
 -p 9000:80 \
   -v /app/service/wordpress/wp_html:/var/www/html \
-e WORDPRESS_DB_PASSWORD=password -d --name wordpress --link wordpressdb:mysql  wordpress


docker  run \
 --restart=always \
 -p 9001:80 \
   -v /app/service/wordpress/wp_html:/var/www/html \
-e WORDPRESS_DB_PASSWORD=password -d --name wordpress_php7 --link wordpressdb:mysql  wordpress:4.8.0-php7.0-apache


