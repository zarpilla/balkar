#!/bin/bash
# Pull the latest images and restart Balkar (same as deploy-urnet.sh on URR).
# Run from this folder on the server: ./deploy.sh
# To go back to a previous build: IMAGE_TAG=main-<full commit sha> ./deploy.sh
set -e
cd "$(dirname "$0")"
docker compose pull
docker compose up -d

# Until area.balkar.earth proxies to the frontend container
# (nginx-balkar-front.conf), nginx serves this folder: refresh it from the image.
STATIC=/var/www/balkar/balkar-front/dist
if [ -d "$STATIC" ]; then
  sleep 3   # the container writes config.js on start
  docker cp balkar-frontend:/usr/share/nginx/html/. "$STATIC/"
  echo "Static front refreshed in $STATIC"
fi
docker compose ps
