#!/bin/bash
# Pull the latest images and restart Balkar (same as deploy-urnet.sh on URR).
# Run from this folder on the server: ./deploy.sh
# To go back to a previous build: IMAGE_TAG=mooc-<commit sha> ./deploy.sh
set -e
cd "$(dirname "$0")"
docker compose pull
docker compose up -d
docker compose ps
