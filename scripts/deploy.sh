#!/usr/bin/env bash
# Deploy COMPLETO dei configuratori sul server: FE + BE insieme, così non
# vanno mai fuori sync (l'auto-deploy di default aggiorna solo la FE).
#
# Uso:   bash scripts/deploy.sh
#
# Si può anche agganciare a `omniapi-deploy` facendolo puntare a questo script.
set -euo pipefail

REPO="${REPO:-/home/omniapi/configuratori}"
WEBROOT="${WEBROOT:-/var/www/staging/configuratori}"
PM2_APP="${PM2_APP:-configuratori-be}"

cd "$REPO"
echo "== git pull =="
git pull --ff-only

echo "== BE: build =="
cd "$REPO/BE"
npm install
npm run build

echo "== BE: restart ($PM2_APP) =="
# --update-env rilegge il .env (es. MAIOLI_UPLOAD_DIR). Le migrazioni girano
# da sole all'avvio del BE.
pm2 restart "$PM2_APP" --update-env
pm2 save || true

echo "== FE: build =="
cd "$REPO/FE"
npm install
npm run build

echo "== FE: pubblica su $WEBROOT =="
rsync -a --delete "$REPO/FE/dist/" "$WEBROOT/"

echo "== BE log (ultime righe) =="
pm2 logs "$PM2_APP" --lines 15 --nostream

echo "== Deploy completato =="
