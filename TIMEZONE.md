
select "createdAt", "createdAt"::timestamp AT TIME ZONE '+7' from public.order limit 2


SELECT current_setting('TIMEZONE') TZ;
SET TIME ZONE '-8'
SET TIME ZONE '+7'

