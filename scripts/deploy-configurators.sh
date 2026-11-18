#!/bin/bash
# OmniaPi Configurators — script di auto-deploy lanciato dal webhook server.
# Questo file va COPIATO in /home/omniapi/omniapi/BE/deploy/deploy-configurators.sh
# (è lì che lo esegue il processo pm2 "omniapi-deploy").
#
# Fa TUTTO: build+restart del BE e build+pubblicazione della FE, così a ogni
# push FE e BE restano in sync senza interventi a mano.
set -euo pipefail

BRANCH="${1:-${DEPLOY_BRANCH:-main}}"
REPO_DIR="${OMNIAPI_CONF_DIR:-$HOME/omniapi/configurators}"
BE_PM2="${OMNIAPI_CONF_BE_PM2:-omniapi-configurators-be}"
WEBROOT="${OMNIAPI_CONF_WEBROOT:-/var/www/staging/configuratori}"

echo "[deploy-configurators] branch=$BRANCH dir=$REPO_DIR"
cd "$REPO_DIR"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "[deploy-configurators] ERRORE: modifiche locali non committate in $REPO_DIR — abort"
  exit 1
fi

echo "[deploy-configurators] git fetch + checkout + reset"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

# ---- Backend: build + restart (le migrazioni girano all'avvio del BE) ----
if pm2 describe "$BE_PM2" > /dev/null 2>&1; then
  echo "[deploy-configurators] build BE"
  cd "$REPO_DIR/BE"
  npm ci --include=dev --no-audit --no-fund
  npm run build
  echo "[deploy-configurators] restart BE pm2:$BE_PM2"
  pm2 restart "$BE_PM2" --update-env
else
  echo "[deploy-configurators] nessun processo PM2 '$BE_PM2' trovato, skip BE"
fi

# ---- Frontend: build + pubblica sul webroot ----
echo "[deploy-configurators] build FE"
cd "$REPO_DIR/FE"
npm ci --include=dev --no-audit --no-fund
npm run build

echo "[deploy-configurators] pubblica FE su $WEBROOT"
rsync -a --delete "$REPO_DIR/FE/dist/" "$WEBROOT/"

echo "[deploy-configurators] done"
