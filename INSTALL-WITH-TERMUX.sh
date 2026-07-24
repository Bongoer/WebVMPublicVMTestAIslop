#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
TARGET="${1:-/sdcard/TermuxHome/webvm-xfce}"
TMP="${TMPDIR:-$HOME/.cache}/webvm-xfce-install"

pkg install -y curl unzip
rm -rf "$TMP"
mkdir -p "$TMP"

echo "Downloading the public WebVM source..."
curl -L \
  https://codeload.github.com/leaningtech/webvm/zip/refs/heads/main \
  -o "$TMP/webvm-main.zip"

unzip -q "$TMP/webvm-main.zip" -d "$TMP"

rm -rf "$TARGET"
mkdir -p "$TARGET"
cp -a "$TMP/webvm-main/." "$TARGET/"
cp -a "$HERE/." "$TARGET/"

rm -f "$TARGET/INSTALL-WITH-TERMUX.sh"
rm -f "$TARGET/START-HERE.txt"
rm -f "$TARGET/README-XFCE.md"

echo
echo "Created:"
echo "$TARGET"
echo
echo "Upload this folder to your own GitHub fork or repository."
echo "Then enable GitHub Pages with GitHub Actions and run:"
echo "Build and deploy XFCE WebVM"
