cluster-2
docker exec -ti nodeshopis-initdb bash
NODE_ENV=initdb node --max-old-space-size=4096 app.js


# DUMP FROM MACOSX DEV
pg_dump -w -d nodeshopis -s -t product -U postgres -h localhost -p 5434 -C --column-inserts

 -s, --schema-only
 --column-inserts

# DUMP FROM STAGING/PROD SSH
ssh 104.198.236.57 "sudo su && pg_dump -w -d nodeshopis -t materialbackconfig -U postgres -h localhost -C --column-inserts" >> staging-dbm.sql




