# Deploying area.balkar.earth with the mooc Docker images

Balkar moves from pm2 + a static front build to the same Docker images as
URR (`<dockerhub-user>/balkar-back:mooc`, `<dockerhub-user>/balkar-front:mooc`). The data
migration is described in `../../MIGRATION_BALKAR.md`.

Server: `ssh <user>@<server-ip>`. Expected downtime: 10–15 minutes.

## 0. Before the day (no downtime)

1. Push `mooc` (back and front). GitHub Actions builds and pushes the images
   (`:mooc` and `:mooc-<sha>`). Check that both workflows are green.
   URR does not change until someone runs `~/deploy-urnet.sh` there.
2. On the Balkar server, prepare the folder:
   ```bash
   mkdir -p ~/balkar-docker/certificates && chmod 775 ~/balkar-docker/certificates
   cd ~/balkar-docker
   # copy docker-compose.yml and deploy.sh from deploy/balkar/ in this repo
   ```
3. Create `~/balkar-docker/.env` from the current one, without duplicated
   keys (the last value wins, which is what Strapi uses today):
   ```bash
   tac /var/www/balkar/balkar-back/.env | awk -F= '/^[A-Z_]+=/{ if (seen[$1]++) next } {print}' | tac > .env
   cat >> .env <<'EOF'
   NODE_ENV=production
   CRON_ENABLED=true
   VITE_API_BASE=https://api.balkar.earth
   DOCKERHUB_USERNAME=<dockerhub-user>
   EOF
   chmod 600 .env
   ```
   Check that `PORT=1347`, `DATABASE_HOST=127.0.0.1`, `DATABASE_NAME=balkar2`,
   `URL=https://api.balkar.earth` and `FRONTEND_URL=https://area.balkar.earth`
   are there.
4. `docker compose pull`

## 1. Backup

```bash
mkdir -p ~/backups
export PGPASSWORD=$(grep ^DATABASE_PASSWORD= ~/balkar-docker/.env | cut -d= -f2-)
pg_dump -h 127.0.0.1 -U postgres -Fc balkar2 > ~/backups/balkar2-pre-mooc-$(date +%F).dump
tar czf ~/backups/balkar-uploads-pre-mooc-$(date +%F).tgz -C /var/www/balkar/balkar-back/public uploads
sudo cp /etc/nginx/sites-available/balkar-front ~/backups/nginx-balkar-front.pre-mooc
```

## 2. Switch over

```bash
cd ~/balkar-docker
pm2 stop balkar-back                     # frees port 1347
docker compose up -d strapi
docker compose logs -f strapi            # wait for "To access the server" (it builds the admin first, ~2 min)
docker compose exec strapi node scripts/migrate-from-main.js           # dry run, read the numbers
docker compose exec strapi node scripts/migrate-from-main.js --apply
docker compose exec strapi node scripts/balkar-branding.js
docker compose restart strapi
docker compose up -d frontend
```

The new backend answers at api.balkar.earth right away (nginx already proxies
port 1347). area.balkar.earth still serves the old static build, so put the new
front there straight away (no sudo needed):
```bash
cd /var/www/balkar/balkar-front && mv dist dist-pre-mooc && mkdir dist
docker cp balkar-frontend:/usr/share/nginx/html/. dist/
```

Later, point area.balkar.earth to the frontend container (needs sudo); until
then `deploy.sh` keeps refreshing that folder:
```bash
sudo cp deploy/balkar/nginx-balkar-front.conf /etc/nginx/sites-available/balkar-front
sudo nginx -t && sudo systemctl reload nginx
```

## 3. Check

- https://area.balkar.earth → login page, Balkar logo, creams, Catalan.
- Log in, open a course: content, progress %, forum messages, a Monitoring
  module with file upload, the dashboard card images.
- https://api.balkar.earth/admin works.
- `docker compose logs strapi` shows no errors; the payment emails cron runs
  every 10 minutes.

When everything is fine, remove the old process so pm2 does not start it again
after a reboot:
```bash
pm2 delete balkar-back && pm2 save
mv ~/deploy-balkar-back.sh ~/deploy-balkar-back.sh.old
```

## Rollback

The migration changes the database schema, so going back means restoring it.
```bash
cd ~/balkar-docker && docker compose down
export PGPASSWORD=...   # as above
pg_restore -h 127.0.0.1 -U postgres --clean --if-exists -d balkar2 ~/backups/balkar2-pre-mooc-<date>.dump
pm2 start ~/ecosystem.config.js --only balkar-back
rm -rf /var/www/balkar/balkar-front/dist && mv /var/www/balkar/balkar-front/dist-pre-mooc /var/www/balkar/balkar-front/dist
sudo cp ~/backups/nginx-balkar-front.pre-mooc /etc/nginx/sites-available/balkar-front
sudo nginx -t && sudo systemctl reload nginx
```

## Later deploys

`cd ~/balkar-docker && ./deploy.sh` (same as `~/deploy-urnet.sh` on URR).
A specific build: `IMAGE_TAG=mooc-<full commit sha> ./deploy.sh` (the tag
uses the full 40-character sha).

## Done on 2026-10-25

Switched over 09:39–09:42 (3 minutes down). Backups in `~/backups/*pre-mooc*`
(database, uploads, old front build, old .env, nginx file). pm2 `balkar-back`
removed; `~/deploy-balkar-back.sh` renamed to `.old`. URR was updated the same
day with `~/deploy-urnet.sh`; its previous images are tagged `:pre-merge` on
that server.
