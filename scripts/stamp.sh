#!/bin/sh
# Rewrites the ?v= on styles.css / app.js in index.html to a hash of each file's
# contents, so a deploy can never pair new HTML with a cached old stylesheet.
# Run before committing changes to either file.
cd "$(dirname "$0")/.." || exit 1
for f in styles.css app.js; do
  v=$(shasum "$f" | cut -c1-8)
  sed -i '' -E "s#${f}(\?v=[0-9a-f]+)?\"#${f}?v=${v}\"#" index.html
done
grep -o -E '(styles\.css|app\.js)\?v=[0-9a-f]+' index.html
