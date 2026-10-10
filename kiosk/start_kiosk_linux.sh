#!/bin/bash
# ============================================================
#  СТЕНД «СТАДИОН ИМ. ЛЕНИНСКОГО КОМСОМОЛА» — запуск киоска
#  Linux:  chmod +x start_kiosk_linux.sh && ./start_kiosk_linux.sh
#  Требуется chromium / google-chrome и python3.
# ============================================================
cd "$(dirname "$0")/.." || exit 1

# --- 1. Локальный сервер (нужен для model.glb и шрифтов) ---
python3 -m http.server 8377 --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null' EXIT
sleep 1.5

# --- 2. Браузер в режиме киоска ---
URL="http://127.0.0.1:8377/stand.html"
BIN=$(command -v google-chrome || command -v chromium || command -v chromium-browser)
if [ -z "$BIN" ]; then
  echo "Не найден Chrome/Chromium. Установите: sudo apt install chromium" >&2
  exit 1
fi

"$BIN" --kiosk "$URL" \
  --autoplay-policy=no-user-gesture-required \
  --disable-translate --no-first-run \
  --disable-session-crashed-bubble \
  --overscroll-history-navigation=0
# --- 3. После закрытия браузера сервер гасится по trap EXIT ---
