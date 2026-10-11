#!/bin/sh
# Screenshots of a skin for design review (headless Chrome, a 390 x 844 phone frame):
#   sh docs/game/tools/preview.sh <skin> <outdir>
# writes <outdir>/<skin>-title.png, -howto.png and -map-0 .. -map-4.png (level map from top to bottom)
SKIN=$1; OUT=${2:-.}; DIR=$(cd "$(dirname "$0")/.." && pwd)
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CH" ] || CH=$(command -v chromium || command -v google-chrome)
shot() { "$CH" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=6000 --force-device-scale-factor=1 \
  --window-size=390,844 --screenshot="$OUT/$SKIN-$1.png" "file://$DIR/tools/preview.html?skin=$SKIN&all=1$2" >/dev/null 2>&1; echo "$OUT/$SKIN-$1.png"; }
mkdir -p "$OUT"
shot title ""
shot howto "&view=howto"
k=0; for f in 0 0.25 0.5 0.75 1; do shot map-$k "&view=menu&scroll=$f"; k=$((k + 1)); done
