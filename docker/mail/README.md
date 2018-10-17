docker run \
  --net=app --restart=always \
  -e maildomain=mail.gearment.com -e smtp_user=nodeshopis:nodeshopis \
  --name postfix -d catatnight/postfix
