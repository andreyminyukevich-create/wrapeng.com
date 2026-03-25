#!/usr/bin/env bash
set -euo pipefail

rsync -avz --delete \
  --exclude node_modules \
  --exclude .git \
  --exclude .env \
  --exclude deploy.sh \
  ./ keep1r:/var/www/keep1r/wrapeng.com/

echo "Деплой завершён!"
