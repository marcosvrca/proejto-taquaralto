#!/bin/sh
set -eu

envsubst '${VITE_API_URL}' \
  < /usr/share/nginx/html/runtime-config.js.template \
  > /usr/share/nginx/html/runtime-config.js
