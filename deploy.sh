#!/bin/bash

# 1. Pull latest code
git pull origin master

# 2. Build and restart (This will cause ~10 seconds of downtime)
docker-compose up -d --build

# 3. CRITICAL: Remove old, dangling images to save disk space
docker image prune -f