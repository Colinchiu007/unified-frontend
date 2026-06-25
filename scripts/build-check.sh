#!/usr/bin/env bash
set -euo pipefail

# ── Build Post-Check Script ──
# Run after `npm run build`, before `systemctl restart unified-frontend`.
# Catches common deployment issues automatically.

PASS=0
FAIL=0
NEXT_DIR=/srv/projects/unified-frontend/.next
NGINX_URL=http://localhost
NEXT_PORT=3000

red()   { echo -e "\033[31m✗ $1\033[0m"; }
green() { echo -e "\033[32m✓ $1\033[0m"; }

check() {
  local desc="$1"
  shift
  if "$@" 2>/dev/null; then
    green "$desc"
    PASS=$((PASS + 1))
  else
    red "$desc"
    FAIL=$((FAIL + 1))
  fi
}

echo "━━━ Build Post-Check ━━━"
echo ""

# Check 1: Build artifacts exist
check "Build artifacts exist" test -f "$NEXT_DIR/server/app/login/page.js"

# Check 2: API_BASE not hardcoded to localhost:8000 (the bug from this session)
# Only check compiled JS files, skip settings page which displays the URL to users
if grep -rqF 'http://localhost:8000' "$NEXT_DIR/server/app" --include='*.js' --exclude='*settings*' 2>/dev/null; then
  red "API_BASE not hardcoded to localhost:8000"
  FAIL=$((FAIL + 1))
else
  green "API_BASE not hardcoded to localhost:8000"
  PASS=$((PASS + 1))
fi

# Check 3: Key SSR pages reachable
check "Homepage reachable" \
  curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:$NEXT_PORT/ | grep -q 200
check "Login page reachable" \
  curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:$NEXT_PORT/login | grep -q 200
check "Register page reachable" \
  curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:$NEXT_PORT/register | grep -q 200

# Check 4: API reachable through nginx
REGISTER_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$NGINX_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"_check_build",