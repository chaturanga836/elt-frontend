#!/bin/bash
# Docker cleanup after frontend deploy (matches legacy Jenkins post { always } block).

set -euo pipefail

# 1. Remove exited build containers (unblocks dangling images)
docker container prune -f

# 2. Remove untagged <none> images
docker image prune -f

# 3. Keep only 2 newest numbered tags (current + 1 rollback)
if docker images etl-frontend-image --format '{{.Tag}}' 2>/dev/null | grep -qE '^[0-9]+$'; then
  docker images etl-frontend-image --format '{{.Tag}}' \
    | grep -E '^[0-9]+$' | sort -rn | tail -n +3 \
    | while read -r tag; do
        docker rmi "etl-frontend-image:${tag}" 2>/dev/null || true
      done
fi

# 4. Orphan volumes from failed builds (does not remove volumes in use by etl-frontend)
docker volume prune -f

echo "Docker prune complete"
