#!/usr/bin/env bash
set -e

CMD="$1"; shift || true

case "$CMD" in
  fix)              npx eslint . --ext .js,.jsx --fix && npx prettier --write . ;;
  test)             npx jest --passWithNoTests ;;
  guard)            node tools/lia-runner.js ;;
  dev)
    npx kill-port 3000 || true
    npm start &
    if [ "$OSTYPE" = "msys" ] || [ "$OSTYPE" = "win32" ]; then
      start http://localhost:3000
    elif [[ "$OSTYPE" == "darwin"* ]]; then
      open http://localhost:3000
    else
      xdg-open http://localhost:3000
    fi
    ;;
  open)             code "${1:-src/App.jsx}" ;;
  "gen:page")       npx plop page -- "name=$1" ;;
  "gen:component")  npx plop component -- "name=$1" ;;
  *) echo "Usage: sh lia.sh {fix|test|guard|dev|open <f>|gen:page <Name>|gen:component <Name>}";;
esac