#!/bin/bash
# deploy-from-git.sh — Pull latest qix from GitHub and deploy
#
# Usage:  ./deploy-from-git.sh
#
# Run this on the Linode. On first run it clones the repo (public, https —
# no deploy key needed). On subsequent runs it pulls latest, rebuilds the
# image, and restarts.
#
# Serves qix.tendimensions.com via host nginx → qix-web container (127.0.0.1:8091).
# Cloudflare DNS record for the subdomain must be added separately.

set -e

# ── Config ───────────────────────────────────────────────────────────────────
REPO_URL="https://github.com/tendimensions/qix.git"
REPO_DIR="$HOME/qix"
COMPOSE_FILE="$REPO_DIR/docker-compose.yml"
HOST_NGINX_CONF="$REPO_DIR/nginx-host.conf"
NGINX_SITE_NAME="qix.tendimensions.com"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}======================================"
echo -e "  Qix Deployment"
echo -e "======================================${NC}"
echo ""

# ── Step 1: Clone or pull ────────────────────────────────────────────────────

if [ -d "$REPO_DIR/.git" ]; then
    echo -e "${YELLOW}[1/4] Pulling latest changes...${NC}"
    echo -e "${RED}  ⚠  Discarding all local changes — remote is authoritative${NC}"
    git -C "$REPO_DIR" fetch origin
    git -C "$REPO_DIR" reset --hard origin/main
    git -C "$REPO_DIR" clean -fd
else
    echo -e "${YELLOW}[1/4] Cloning repo...${NC}"
    git clone "$REPO_URL" "$REPO_DIR"
fi

echo -e "${GREEN}  Repo up to date${NC}"
echo ""

# ── Step 2: Build and deploy ─────────────────────────────────────────────────

echo -e "${YELLOW}[2/4] Building Docker image and restarting...${NC}"
docker compose -f "$COMPOSE_FILE" up -d --build --force-recreate
echo ""

# ── Step 3: Configure host nginx ─────────────────────────────────────────────

echo -e "${YELLOW}[3/4] Configuring host nginx...${NC}"

SITES_AVAILABLE="/etc/nginx/sites-available/$NGINX_SITE_NAME"
SITES_ENABLED="/etc/nginx/sites-enabled/$NGINX_SITE_NAME"

sudo cp "$HOST_NGINX_CONF" "$SITES_AVAILABLE"
echo -e "${GREEN}  Copied nginx-host.conf → $SITES_AVAILABLE${NC}"

if [ ! -L "$SITES_ENABLED" ]; then
    sudo ln -s "$SITES_AVAILABLE" "$SITES_ENABLED"
    echo -e "${GREEN}  Enabled site: $SITES_ENABLED${NC}"
else
    echo -e "${GREEN}  Site already enabled: $SITES_ENABLED${NC}"
fi

sudo nginx -t
sudo systemctl reload nginx
echo -e "${GREEN}  nginx reloaded${NC}"
echo ""

# ── Step 4: Verify ───────────────────────────────────────────────────────────

echo -e "${YELLOW}[4/4] Verifying deployment...${NC}"
sleep 3

if curl -sf http://127.0.0.1:8091/ > /dev/null; then
    echo -e "${GREEN}  Container responding on 127.0.0.1:8091${NC}"
else
    echo -e "${RED}  Container NOT responding on 127.0.0.1:8091${NC}"
    docker compose -f "$COMPOSE_FILE" ps
    exit 1
fi

DEPLOYED_VERSION=$(curl -s http://127.0.0.1:8091/js/config.js | grep -oP 'VERSION = "\K[^"]+')

echo ""
echo -e "${CYAN}======================================"
echo -e "  Deployment Complete"
echo -e "======================================${NC}"
docker compose -f "$COMPOSE_FILE" ps
echo ""
echo -e "${GREEN}Game:    https://qix.tendimensions.com${NC}"
echo -e "${GREEN}Version: ${DEPLOYED_VERSION}${NC}"
echo ""
