https://github.com/deviantony/docker-elk

docker run --net=host  --log-driver=gelf --log-opt gelf-address=udp://log:12201 --log-opt tag="test" alpine /bin/sh -c "while truedo echo  My message \$RANDOM; sleep 1; done;"
