#!/bin/bash

# 1. Pull latest code and FORCE reset to match GitHub exactly
# This prevents local file changes on the server from breaking the build
git fetch origin master
git reset --hard origin/master

# 2. Build and restart 
# Use --force-recreate to ensure a fresh container state
docker-compose up -d --build --force-recreate

# 3. Cleanup
docker image prune -f
