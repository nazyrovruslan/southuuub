#!/usr/bin/env python3
"""Static checker for Django Static Frontend Contract v1 (dsfc/1).

Usage: python3 dsfc_check.py <build-dir> [--json]
Exit code: 0 = compatible (warnings allowed), 1 = has FAIL items, 2 = bad usage.
Standard library only, so the same file can run on the frontend side and inside Django.
"""
import hashlib
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

TOKEN = "/__DSFC_BASE__/"
MARKERS = ("<!--dsfc:head-->", "<!--dsfc:body-start-->", "<!--dsfc:body-end-->")
TEXT_EXT = {".html", ".js", ".mjs", ".css", ".json", ".webmanifest", ".svg", ".txt", ".xml"}
FORBIDDEN_FILES = re.compile(r"(^|/)(index\.django\.html|200\.html|404\.html|\.env.*|node_modules)(/|$)|\.map$")
HASHED = re.compile(r"[-.][A-Za-z0-9_-]{6,}\.[a-z0-9]+$")
SEO_META = re.compile(r"^(description|robots|og:.*|twitter:.*)$")
TRACKERS = ("mc.yandex.ru", "googletagmanager.com", "google-analytics.com", "connect.facebook.net", "vk.com/rtrg", "top-fwz1.mail.ru")
CONFIG_TYPES = {"text", "richtext", "url", "bool", "int", "date", "image"}
DJANGO_SYNTAX = re.compile(r"\{\{|\{%|\{#|endverbatim")
LOCAL_URL_ATTRS = {"src", "href", "poster", "data", "action", "content", "srcset", "imagesrcset", "xlink:href"}


class Report:
    def __init__(self):
        self.items = []

    def fail(self, code, msg):
        self.items.append(("FAIL", code, msg))

    def warn(self, code, msg):
        self.items.append(("WARN", code, msg))

    def ok(self, code, msg):
        self.items.append(("OK", code, msg))

    @property
    def failed(self):
        return any(level == "FAIL" for level, _, _ in self.items)


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.tags = []          # (tag, attrs dict, line)
        self.scripts = []       # (attrs, body, line)
        self.styles = []        # body
        self.comments = []
        self._script = None
        self._style = None
        self.depth = 0
        self.root_depth = None
        self.in_root_comments = []

    def handle_starttag(self, tag, attrs):
        a = {k: (v or "") for k, v in attrs}
        self.tags.append((tag, a, self.getpos()[0]))
        if tag == "script":
            self._script = (a, [], self.getpos()[0])
        elif tag == "style":
            self._style = []
        if tag not in ("meta", "link", "img", "br", "hr", "input", "source", "track", "wbr", "area", "base", "col", "embed", "param"):
            self.depth += 1
            if "data-dsfc-root" in a and self.root_depth is None:
                self.root_depth = self.depth

    def handle_endtag(self, tag):
        if tag == "script" and self._script:
            a, body, line = self._script
            self.scripts.append((a, "".join(body), line))
            self._script = None
        elif tag == "style" and self._style is not None:
            self.styles.append("".join(self._style))
            self._style = None
        if self.root_depth is not None and self.depth == self.root_depth:
            self.root_depth = -1
        self.depth -= 1

    def handle_data(self, data):
        if self._script:
            self._script[1].append(data)
        elif self._style is not None:
            self._style.append(data)

    def handle_comment(self, data):
        self.comments.append(data)
        if self.root_depth not in (None, -1):
            self.in_root_comments.append(data)


def line_of(text, idx):
    return text.count("\n", 0, idx) + 1


def local_url_problem(url):
    """Return a description if a URL points to a local file without the base token."""
    u = url.strip()
    if not u or u.startswith(("#", "data:", "blob:", "mailto:", "tel:", "javascript:", "http://", "https://", "//", TOKEN)):
        return None
    if u.startswith(("./", "../", "/")) or re.match(r"^[\w.-]+/[\w./-]+\.\w+$", u) or re.match(r"^[\w.-]+\.(js|css|png|jpe?g|webp|avif|svg|ico|mp4|webm|woff2?|ttf|json|webmanifest)$", u):
        return u
    return None


def check(build: Path) -> Report:
    r = Report()
    if not build.is_dir():
        r.fail("layout", f"{build} не папка")
        return r
    files = sorted(p for p in build.rglob("*") if p.is_file())
    rel = [p.relative_to(build).as_posix() for p in files]

    # --- manifest
    man_path = build / "dsfc-manifest.json"
    man = None
    if not man_path.exists():
        r.fail("manifest", "нет dsfc-manifest.json")
    else:
        try:
            man = json.loads(man_path.read_text("utf-8"))
        except Exception as e:  # noqa: BLE001
            r.fail("manifest", f"dsfc-manifest.json не парсится: {e}")
    if man is not None:
        if man.get("contract") != "dsfc/1":
            r.fail("manifest", f'contract = {man.get("contract")!r}, ожидается "dsfc/1"')
        if not re.fullmatch(r"[a-z0-9-]{2,40}", str(man.get("name", ""))):
            r.fail("manifest", f'name {man.get("name")!r} не подходит под [a-z0-9-]{{2,40}}')
        for key in ("title", "version", "entry", "lang"):
            if not man.get(key):
                r.fail("manifest", f"нет поля {key}")
        if man.get("base") != TOKEN:
            r.fail("manifest", f'base = {man.get("base")!r}, ожидается "{TOKEN}"')
        seo = man.get("seo") or {}
        for key in ("title", "description"):
            if not seo.get(key):
                r.fail("manifest", f"нет seo.{key}")
        for k, spec in (man.get("config") or {}).items():
            if not isinstance(spec, dict) or spec.get("type") not in CONFIG_TYPES or "default" not in spec:
                r.fail("manifest", f"config.{k}: нужен type из {sorted(CONFIG_TYPES)} и default")
        listed = {f.get("path"): f for f in man.get("files") or []}
        actual = set(rel) - {"dsfc-manifest.json"}
        for p in sorted(actual - set(listed)):
            r.fail("manifest", f"файл не перечислен в files: {p}")
        for p in sorted(set(listed) - actual):
            r.fail("manifest", f"в files есть, на диске нет: {p}")
        for p in sorted(actual & set(listed)):
            want = listed[p].get("sha256")
            if want and want != hashlib.sha256((build / p).read_bytes()).hexdigest():
                r.fail("manifest", f"sha256 не совпадает: {p}")
            elif not want:
                r.warn("manifest", f"нет sha256 у {p}")

    # --- layout
    entry = build / ((man or {}).get("entry") or "index.html")
    if not entry.exists():
        r.fail("layout", f"нет точки входа {entry.name}")
        return r
    for p in rel:
        if FORBIDDEN_FILES.search(p):
            r.fail("layout", f"запрещённый файл в сборке: {p}")
        elif p.startswith("assets/") and not HASHED.search(p):
            r.warn("layout", f"в assets/ файл без хеша в имени: {p}")
        elif not p.startswith(("assets/", "public/")) and p not in ("index.html", "dsfc-manifest.json"):
            r.warn("layout", f"файл вне assets/ и public/: {p}")
    if len(files) > 500:
        r.fail("layout", f"файлов {len(files)}, лимит 500")
    total = sum(p.stat().st_size for p in files)
    if total > 100 * 2**20:
        r.warn("layout", f"общий размер {total / 2**20:.1f} МБ, рекомендуется до 100 МБ")
    for p in files:
        if p.stat().st_size > 20 * 2**20:
            r.warn("layout", f"{p.relative_to(build)} весит {p.stat().st_size / 2**20:.1f} МБ (больше 20 МБ)")

    html = entry.read_text("utf-8")

    # --- Django template syntax
    hits = [(m.group(0), line_of(html, m.start())) for m in DJANGO_SYNTAX.finditer(html)]
    if hits:
        sample = ", ".join(f"{h!r}@{ln}" for h, ln in hits[:8])
        r.fail("django-syntax", f"{len(hits)} вхождений Django-синтаксиса в {entry.name}: {sample}")
    else:
        r.ok("django-syntax", "в HTML нет {{ {% {# и endverbatim")
    for p in files:
        if p.suffix in (".js", ".mjs", ".css") and DJANGO_SYNTAX.search(p.read_text("utf-8", "replace")):
            r.ok("django-syntax", f"{p.relative_to(build)} содержит {{{{/{{%/{{# (допустимо, файл не рендерится шаблонизатором; не инлайнить)")

    # --- markers
    for mk in MARKERS:
        n = html.count(mk)
        if n != 1:
            r.fail("markers", f"{mk} встречается {n} раз, нужно ровно 1")
    if all(html.count(mk) == 1 for mk in MARKERS):
        h, bs, be = (html.index(mk) for mk in MARKERS)
        head_end = html.lower().find("</head>")
        body_open = html.lower().find("<body")
        body_close = html.lower().rfind("</body>")
        if not (h < head_end):
            r.fail("markers", "<!--dsfc:head--> должен быть внутри <head>")
        if not (body_open < bs < be < body_close):
            r.fail("markers", "body-start/body-end должны быть внутри <body>, start раньше end")

    page = Page()
    page.feed(html)

    # --- root / hydration
    roots = [t for t in page.tags if "data-dsfc-root" in t[1]]
    if len(roots) != 1:
        r.fail("root", f"элементов с data-dsfc-root: {len(roots)}, нужен ровно 1")
    else:
        idx = html.find("data-dsfc-root")
        if re.search(r"data-dsfc-root[^>]*>\s*</", html[idx: idx + 4000]):
            r.fail("root", "корневой элемент пустой: страница не пререндерена (нужен SSG)")
        if any(c.startswith("dsfc:") for c in page.in_root_comments):
            r.fail("root", "маркер dsfc оказался внутри data-dsfc-root")

    # --- html lang
    html_tag = next((t for t in page.tags if t[0] == "html"), None)
    if not html_tag or not html_tag[1].get("lang"):
        r.fail("seo", "<html> без lang")

    # --- scripts
    for a, body, ln in page.scripts:
        typ = a.get("type", "").lower()
        if "src" in a:
            continue
        if typ in ("application/json", "application/ld+json"):
            if DJANGO_SYNTAX.search(body):
                r.fail("django-syntax", f"inline JSON на строке {ln} содержит Django-синтаксис")
            continue
        r.fail("inline-script", f"исполняемый inline-скрипт на строке {ln}: {body.strip()[:80]!r}")
    for tr in TRACKERS:
        if tr in html:
            r.fail("trackers", f"в HTML найден счётчик {tr}: аналитику вставляет Django")
    for p in files:
        if p.suffix in (".js", ".mjs"):
            js = p.read_text("utf-8", "replace")
            for tr in TRACKERS:
                if tr in js:
                    r.fail("trackers", f"{p.relative_to(build)}: счётчик {tr} в JS")
            for pat, why in ((r"document\.title\s*=", "JS меняет document.title"),
                             (r"\buseHead\b|\buseSeoMeta\b|@unhead|titleTemplate", "JS управляет <head> (unhead/useHead)"),
                             (r"location\.pathname\.replace", "пути строятся от location.pathname"),
                             (r"__ASSETS__|/_nuxt/", "следы старой схемы путей (__ASSETS__ / _nuxt)"),
                             (r"\beval\(|new Function\(|document\.write\(", "eval/new Function/document.write")):
                if re.search(pat, js):
                    level = r.fail if why.startswith("JS меняет") else r.warn
                    level("js", f"{p.relative_to(build)}: {why}" + (" (может быть мёртвым кодом библиотеки; решает dsfc_smoke.mjs)" if "unhead" in why else ""))

    # --- SEO defaults
    seo_tags = []
    for tag, a, ln in page.tags:
        is_seo = (tag == "title"
                  or (tag == "meta" and SEO_META.match(a.get("name") or a.get("property") or ""))
                  or (tag == "link" and a.get("rel") in ("canonical", "alternate") and "hreflang" in a or tag == "link" and a.get("rel") == "canonical")
                  or (tag == "script" and a.get("type") == "application/ld+json"))
        if is_seo:
            seo_tags.append((tag, a, ln))
            if a.get("data-dsfc") != "seo":
                ident = a.get("name") or a.get("property") or a.get("rel") or a.get("type") or ""
                r.fail("seo", f"<{tag} {ident}>".replace(" >", ">") + f" на строке {ln} без data-dsfc=\"seo\"")
    have = {(a.get("name") or a.get("property") or tag) for tag, a, _ in seo_tags}
    for need in ("title", "description", "og:title", "og:description", "og:image"):
        if need not in have:
            r.fail("seo", f"нет тега по умолчанию: {need}")
    for tag, a, ln in seo_tags:
        if (a.get("rel") == "canonical" or a.get("property") == "og:url") and (a.get("href") or a.get("content", "")).startswith("http"):
            r.warn("seo", f"строка {ln}: абсолютный canonical/og:url в сборке; его должна задавать CMS")

    # --- URLs
    bad_urls = []
    for tag, a, ln in page.tags:
        for k, v in a.items():
            if k not in LOCAL_URL_ATTRS:
                continue
            if tag == "meta" and not (a.get("property", "").startswith("og:image") or a.get("name", "").startswith("twitter:image")):
                continue
            parts = [s.strip().split(" ")[0] for s in v.split(",")] if k.endswith("srcset") else [v]
            for u in parts:
                pr = local_url_problem(u)
                if pr:
                    bad_urls.append(f"{pr} (<{tag} {k}> строка {ln})")
    css_blobs = page.styles + [p.read_text("utf-8", "replace") for p in files if p.suffix == ".css"]
    for css in css_blobs:
        for m in re.finditer(r"url\(\s*['\"]?([^'\")]+)", css):
            pr = local_url_problem(m.group(1))
            if pr:
                bad_urls.append(f"{pr} (CSS url())")
    if bad_urls:
        r.fail("base", f"{len(bad_urls)} локальных URL без {TOKEN}: " + "; ".join(bad_urls[:10]))
    else:
        r.ok("base", f"все локальные URL в HTML/CSS начинаются с {TOKEN}")

    # every token reference must resolve to a file
    missing = set()
    for p in files:
        if p.suffix in TEXT_EXT:
            for m in re.finditer(re.escape(TOKEN) + r"([A-Za-z0-9_./@%+~-]*)", p.read_text("utf-8", "replace")):
                target = m.group(1).split("?")[0].split("#")[0]
                if target and not target.endswith("/") and not (build / target).is_file():
                    missing.add(target)
    for t in sorted(missing)[:20]:
        r.fail("base", f"{TOKEN}{t} не найден в сборке")
    if TOKEN not in html:
        r.fail("base", f"в {entry.name} нет ни одного {TOKEN}: сборка собрана не с base = '{TOKEN}'")
    return r


def main(argv):
    args = [a for a in argv[1:] if not a.startswith("--")]
    if len(args) != 1:
        print(__doc__)
        return 2
    rep = check(Path(args[0]))
    if "--json" in argv:
        print(json.dumps([{"level": l, "code": c, "message": m} for l, c, m in rep.items], ensure_ascii=False, indent=2))
    else:
        groups = {}
        for level, code, msg in rep.items:
            groups.setdefault((level, code), []).append(msg)
        for (level, code), msgs in groups.items():
            for msg in msgs[:6]:
                print(f"{level:4} [{code}] {msg}")
            if len(msgs) > 6:
                print(f"{level:4} [{code}] … и ещё {len(msgs) - 6} таких же")
        n_fail = sum(1 for i in rep.items if i[0] == "FAIL")
        n_warn = sum(1 for i in rep.items if i[0] == "WARN")
        print(f"\nИтог: {'НЕ СОВМЕСТИМА' if rep.failed else 'совместима'} с dsfc/1 · FAIL {n_fail} · WARN {n_warn}")
    return 1 if rep.failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
