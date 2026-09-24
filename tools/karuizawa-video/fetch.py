#!/usr/bin/env python3
"""Wikimedia Commons から、ライセンスが明確な画像を1枚選んで落とす。"""
import json, sys, urllib.request, urllib.parse, os, html, re

OK_LICENSES = ('CC BY', 'CC BY-SA', 'CC0', 'Public domain', 'Attribution')

def clean(s):
    s = re.sub(r'<[^>]+>', '', s or '')
    return html.unescape(s).strip().replace('\n', ' ')

def search(term, limit=10):
    q = urllib.parse.urlencode({
        'action': 'query', 'generator': 'search', 'gsrsearch': term,
        'gsrnamespace': 6, 'gsrlimit': limit, 'prop': 'imageinfo',
        'iiprop': 'url|extmetadata', 'iiurlwidth': 1600, 'format': 'json',
    })
    url = f'https://commons.wikimedia.org/w/api.php?{q}'
    req = urllib.request.Request(url, headers={'User-Agent': 'EigoNoMori-ClassMaterial/1.0 (school use)'})
    with urllib.request.urlopen(req, timeout=30) as r:
        d = json.load(r)
    out = []
    for p in (d.get('query') or {}).get('pages', {}).values():
        ii = (p.get('imageinfo') or [{}])[0]
        md = ii.get('extmetadata', {})
        lic = clean(md.get('LicenseShortName', {}).get('value', ''))
        if not lic.startswith(OK_LICENSES):
            continue
        thumb = ii.get('thumburl')
        base = (thumb or '').split('?')[0].lower()
        if not thumb or not base.endswith(('.jpg', '.jpeg', '.png')):
            continue
        out.append({
            'title': p['title'],
            'license': lic,
            'artist': clean(md.get('Artist', {}).get('value', ''))[:80],
            'thumburl': thumb,
            'descurl': ii.get('descriptionurl', ''),
        })
    return out

def download(url, path):
    req = urllib.request.Request(url, headers={'User-Agent': 'EigoNoMori-ClassMaterial/1.0 (school use)'})
    with urllib.request.urlopen(req, timeout=60) as r, open(path, 'wb') as f:
        f.write(r.read())

if __name__ == '__main__':
    term, out_img, out_meta = sys.argv[1], sys.argv[2], sys.argv[3]
    hits = search(term)
    if not hits:
        print('NO_RESULT'); sys.exit(1)
    pick = hits[0]
    download(pick['thumburl'], out_img)
    with open(out_meta, 'w') as f:
        json.dump(pick, f, ensure_ascii=False, indent=1)
    print(f"{pick['license']} | {pick['artist']} | {pick['title']}")
