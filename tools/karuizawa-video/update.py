#!/usr/bin/env python3
"""既存のDriveファイルの中身だけ差し替える（ファイルIDは変わらない＝アプリのリンクはそのまま）。"""
import json, sys
sys.path.insert(0,'/Users/yamadayuji/.gemini/antigravity/scratch/06_基盤/receipt-bot')
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

creds = Credentials.from_authorized_user_file('/Users/yamadayuji/.gemini/antigravity/scratch/06_基盤/receipt-bot/token.json')
if creds.expired and creds.refresh_token: creds.refresh(Request())
svc = build('drive','v3',credentials=creds)
links = json.load(open('links.json'))
for sid, url in sorted(links.items()):
    fid = url.split('/d/')[1].split('/')[0]
    media = MediaFileUpload(f'out/kz-{sid}.mp4', mimetype='video/mp4', resumable=False)
    svc.files().update(fileId=fid, media_body=media, supportsAllDrives=True).execute()
    print(f'  ↻ kz-{sid}.mp4 更新')
print('完了：ファイルIDは変わらないのでアプリ側の修正は不要')
