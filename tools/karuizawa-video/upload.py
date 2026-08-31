#!/usr/bin/env python3
"""生成した動画をGoogle Driveの指定フォルダへアップロードし、共有リンクを返す。"""
import json, os, sys, glob
sys.path.insert(0, '/Users/yamadayuji/.gemini/antigravity/scratch/06_基盤/receipt-bot')
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

TOKEN = '/Users/yamadayuji/.gemini/antigravity/scratch/06_基盤/receipt-bot/token.json'
FOLDER_ID = '1WC5cDOc2WG8-cAaB-QKGyKHfOmyte73M'

creds = Credentials.from_authorized_user_file(TOKEN)
if creds.expired and creds.refresh_token:
    creds.refresh(Request())
svc = build('drive', 'v3', credentials=creds)

# 既存ファイル（重複アップ防止）
existing = {}
res = svc.files().list(q=f"'{FOLDER_ID}' in parents and trashed=false",
                       fields='files(id,name)', supportsAllDrives=True,
                       includeItemsFromAllDrives=True).execute()
for f in res.get('files', []):
    existing[f['name']] = f['id']

links = {}
for path in sorted(glob.glob('out/kz-*.mp4')):
    name = os.path.basename(path)
    if name in existing:
        fid = existing[name]
        print(f'  = {name} (既存)')
    else:
        media = MediaFileUpload(path, mimetype='video/mp4', resumable=False)
        f = svc.files().create(body={'name': name, 'parents': [FOLDER_ID]},
                               media_body=media, fields='id',
                               supportsAllDrives=True).execute()
        fid = f['id']
        print(f'  ↑ {name}')
    links[name.replace('kz-', '').replace('.mp4', '')] = f'https://drive.google.com/file/d/{fid}/view'

json.dump(links, open('links.json', 'w'), ensure_ascii=False, indent=1)
print(json.dumps(links, ensure_ascii=False, indent=1))
