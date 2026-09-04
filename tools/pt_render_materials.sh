#!/usr/bin/env bash
# pt_render_materials.sh — render all Gallery / release materials (M4′/M5-lite).
#
# Produces, under dist/gallery/:
#   <name>.html              single-file playable trailer (pt_build)
#   <name>-vertical.mp4/.wav  1080x1920 @30 deterministic MP4 + WAV mix
#   <name>-horizontal.mp4    1920x1080 @30
#   <name>-poster-<shot>.jpg hero stills at key shot times (boot/side/front/push)
#
# Each example = a pair of contracts under examples/<name>/ and a content
# template under content/<template>/. Rendering takes a few minutes per clip
# (SwiftShader, seek-per-frame); set SKIP_H=1 to skip horizontal renders.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/dist/gallery"
mkdir -p "$OUT"

# name : content-template
EXAMPLES=(
  "dogfood:terminal"
  "sellerscope:terminal"
)

# poster still times (seconds, inside the 30s timeline)
POSTERS="3.7 9.5 16.5 24.5"

render_one() {
  local name="$1" template="$2"
  local html="$OUT/$name.html"
  echo "== build $name"
  python3 "$ROOT/tools/pt_build.py" \
    --manifest "$ROOT/examples/$name/model.manifest.json" \
    --storyboard "$ROOT/examples/$name/storyboard.json" \
    --content "$ROOT/content/$template/content.js" \
    --title "$name · product-trailer" \
    --out "$html"

  for orient in vertical horizontal; do
    [ "$orient" = "horizontal" ] && [ "${SKIP_H:-0}" = "1" ] && continue
    local mp4="$OUT/$name-$orient.mp4"
    echo "== export $name $orient"
    python3 "$ROOT/tools/pt_export_mp4.py" \
      --html "$html" --orientation "$orient" \
      --keep-wav "$OUT/$name-$orient.wav" \
      --out "$mp4"
  done

  echo "== posters $name"
  local i=0
  for t in $POSTERS; do
    i=$((i+1))
    ffmpeg -y -v error -ss "$t" -i "$OUT/$name-vertical.mp4" \
      -frames:v 1 -q:v 3 "$OUT/$name-poster-$i.jpg"
  done
}

for spec in "${EXAMPLES[@]}"; do
  render_one "${spec%%:*}" "${spec##*:}"
done

echo
echo "materials in $OUT:"
ls -lh "$OUT" | sed 's/^/  /'
