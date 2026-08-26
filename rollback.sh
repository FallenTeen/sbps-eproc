#!/bin/bash

set -euo pipefail

# ============================================================
#  Rollback Script — Revert to Previous Commit
#  Usage: bash rollback.sh [staging|production]
# ============================================================

ENV="${1:-staging}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
ok()   { echo -e "${GREEN}[OK]${NC}    $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $1"; }
err()  { echo -e "${RED}[ERR]${NC}   $1"; }

case "$ENV" in
    staging)
        APP_DIR="/home/sbpq2541/sbps-eproc-stage"
        BRANCH="develop"
        DOMAIN="staging.sbpscorp.com"
        ;;
    production)
        APP_DIR="/home/sbpq2541/sbps-eproc-prod"
        BRANCH="main"
        DOMAIN="sistem.sbpscorp.com"
        ;;
    *)
        err "Usage: bash rollback.sh [staging|production]"
        exit 1
        ;;
esac

echo ""
echo -e "${YELLOW}===========================================${NC}"
echo -e "${YELLOW}  ROLLBACK: ${ENV} (${DOMAIN})${NC}"
echo -e "${YELLOW}===========================================${NC}"
echo ""

cd "$APP_DIR"

CURRENT=$(git rev-parse HEAD)
PREV=$(git rev-parse HEAD~1)

log "Current commit: ${CURRENT:0:7}"
log "Rolling back to: ${PREV:0:7}"

read -p "Continue rollback? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    warn "Rollback cancelled"
    exit 0
fi

if [ "$ENV" = "production" ]; then
    log "Enabling maintenance mode..."
    php artisan down --retry=60 2>&1 || true
fi

log "Rolling back..."
git reset --hard HEAD~1
ok "Rolled back to ${PREV:0:7}"

log "Reinstalling dependencies..."
composer install --no-dev --no-interaction --no-scripts --prefer-dist --optimize-autoloader 2>&1 | tail -1

log "Clearing caches..."
php artisan config:clear 2>&1
php artisan view:clear 2>&1
php artisan route:clear 2>&1

log "Setting permissions..."
chmod -R 775 storage bootstrap/cache 2>/dev/null || true

if [ "$ENV" = "production" ]; then
    php artisan up 2>&1 || true
fi

echo ""
echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}  ROLLBACK COMPLETE${NC}"
echo -e "${GREEN}  Environment: ${ENV}${NC}"
echo -e "${GREEN}  Now at: ${PREV:0:7}${NC}"
echo -e "${GREEN}===========================================${NC}"
echo ""
