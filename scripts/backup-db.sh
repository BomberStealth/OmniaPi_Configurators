#!/usr/bin/env bash
# Backup del database configuratori_db (bolle, clienti, listino, account).
# Comprime in .sql.gz e tiene gli ultimi N giorni. Idealmente su SSD.
#
# Uso a mano:   bash scripts/backup-db.sh
# In automatico (ogni notte alle 2:30), crontab -e:
#   30 2 * * * /home/omniapi/configuratori/scripts/backup-db.sh >> /var/log/configuratori-backup.log 2>&1
#
# Ripristino di un backup:
#   gunzip -c /mnt/ssd/backup-configuratori/configuratori_db-XXXX.sql.gz | mysql -u omniapi -p configuratori_db
set -euo pipefail

# Carica le credenziali dal .env del BE se presente
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ENV_FILE:-$HERE/../BE/.env}"
if [ -f "$ENV_FILE" ]; then
  set -a; . "$ENV_FILE"; set +a
fi

DB_NAME="${DB_NAME:-configuratori_db}"
DB_USER="${DB_USER:-omniapi}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_HOST="${DB_HOST:-localhost}"
BACKUP_DIR="${BACKUP_DIR:-/mnt/ssd/backup-configuratori}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$BACKUP_DIR/${DB_NAME}-${STAMP}.sql.gz"

# MYSQL_PWD evita di mettere la password sulla riga di comando
MYSQL_PWD="$DB_PASSWORD" mysqldump \
  --single-transaction --quick --routines --events \
  -h "$DB_HOST" -u "$DB_USER" "$DB_NAME" \
  | gzip -9 > "$OUT"

if [ ! -s "$OUT" ]; then
  echo "ERRORE: backup vuoto, lo rimuovo ($OUT)" >&2
  rm -f "$OUT"
  exit 1
fi

# ruota i backup più vecchi di RETENTION_DAYS
find "$BACKUP_DIR" -name "${DB_NAME}-*.sql.gz" -type f -mtime +"$RETENTION_DAYS" -delete

echo "$(date '+%Y-%m-%d %H:%M:%S')  OK backup -> $OUT ($(du -h "$OUT" | cut -f1))"
