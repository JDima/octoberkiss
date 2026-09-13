#!/bin/zsh
# Публикация: проставляет версию ассетам (иначе браузер отдаст старые
# css/js из кэша и страница может не открыться), коммитит и пушит.
set -e
cd "$(dirname "$0")"
V=$(date +%Y%m%d%H%M)
/usr/bin/python3 - "$V" <<'PY'
import sys, re
v = sys.argv[1]; p = 'index.html'; s = open(p).read()
s = re.sub(r'href="css/style\.css(\?v=\d+)?"', 'href="css/style.css?v=%s"' % v, s)
s = re.sub(r'src="js/main\.js(\?v=\d+)?"',     'src="js/main.js?v=%s"' % v, s)
open(p, 'w').write(s)
PY
echo "версия ассетов: $V"
git add -A
git commit -m "${1:-обновление}" || echo "нечего коммитить"
git push origin main
echo "готово — https://jdima.github.io/octoberkiss/"
