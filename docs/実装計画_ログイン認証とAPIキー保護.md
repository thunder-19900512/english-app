# 実装計画：クラス共通パスワードのログイン ＋ APIキー保護

> 2026-07-23 Fable作成。実装はこの計画に沿って行う（夏休み中）。
> 方針：**生徒の使用感を today と同じに保ったまま**、外部の第三者を締め出す。
> 大原則：**パスワードやAPIキーをアプリのコード（＝配るファイル）に埋め込まない**。埋めた瞬間に今と同じ「誰でも読める」状態に戻る。

---

## 0. なぜやるか（今の状態を正確に）

このアプリのデータは Supabase の `students` テーブルに入っている。今このテーブルは
**インターネット上の誰でも読み書きできる**状態になっている。理由は2つ：

1. テーブルのRLS（鍵）が「anon（＝ログインしていない誰でも）」に対して
   読み込み・書き込み・更新をすべて許可している。
2. その anon の合鍵（anonキー）が、公開GitHubリポジトリ `english-app` と、
   配布済みのアプリ本体（JSファイル）の両方に入っている。

この結果、今この瞬間に第三者ができてしまうこと：

| 対象 | できてしまうこと | 深刻度 |
|---|---|---|
| 児童58名の氏名・ふりかえり94件・学習記録 | 全部読める／書き換えられる | 高（個人情報） |
| **`app_settings_v1` 行の Geminiキー・Azureキー（平文）** | **抜き取って自分の用途に使える＝山田に課金が発生** | **最高（生きた鍵・お金）** |
| 全体ロック（`isScreenLocked`）・今日のミッション | 勝手に切り替えられる＝授業妨害 | 中 |
| スタッフ画面のPIN `7777` | コードに直書き＝誰でも教師画面に入れる | 中 |

> ※ 2026-06に対処した class-portal のキーは「もう無効な鍵」だったが、
> **こちらの Gemini／Azure キーは今も生きていて、使われれば課金される**。ここが一番の違い。

この計画のゴールは、上の表を**全部ふさぐ**こと。中心は「ログインした人だけが使える」に切り替えること。

---

## 1. 設計の考え方（なぜ「共通パスワード」なのか）

### 採用する方式
Supabase の「メール＋パスワード」ログインで、**クラス共通のアカウントを1つ**作る
（例：`class56@example.com` ＋ あいことば）。児童はこの1つのあいことばでログインする。
そのうえで、テーブルの鍵を「anon（誰でも）」から「authenticated（ログイン済み）」に付け替える。

### これで何が起きるか
- 鍵を authenticated に付け替えると、**anon には許可が1つも無くなる**。
  → 公開リポジトリに出回っている anonキーだけでは、もう何も読めない・書けない。
  → だから anonキーは出回ったままでも実害が消える（＝キーのローテートを急ぐ必要も下がる）。
- 児童は全員が同じ authenticated ロールなので、**今ある機能が一切壊れない**（後述の理由）。

### なぜ「一人ひとり別ログイン」にしないのか
最初に検討した「匿名サインイン＋自分の行だけ」方式は、このアプリでは**機能が壊れる**：

- 全児童のデータを読む画面が3か所ある：
  - `src/components/auth/Login.tsx`（名前タイルに称号絵文字を表示）
  - `src/components/tree/ClassTree.tsx`（クラスの木）
  - `src/hooks/useLeaderboard.ts`（ランキング）
  「自分の行しか読めない」にすると、これらが全部止まる。
- 匿名サインインはブラウザのデータを消すと別人扱いになり、**記録に戻れなくなる**。
  共用端末（学校のタブレット）では事故る。

→ 共通パスワード方式なら全員が同じ authenticated なので、上の3か所はそのまま動く。

### 割り切る点（承知のうえで採用）
- **児童どうしは互いの記録を触れる**（同じアカウントなので技術的に区別できない）。
  ただしランキングやクラスの木で元々見えているし、現実的な脅威は「ネット越しの第三者」なので、
  ここは実用上許容する。
- 完全な個人保護が要るなら Phase 2（下記）で一人別ログインに進むが、今回の主目的ではない。

---

## 2. 使用感を「今と同じ」に保つ設計（最重要・ここを外さない）

今のログインの流れ：**アプリを開く → 名前タイルをタップ → /home**。これを変えたくない。

そこで「あいことば」と「名前えらび」を**分離**する：

```
[端末で初めて開いたとき だけ]
  アプリを開く
    → 「あいことば」画面（共通パスワードを1回入力）   ← 端末ごとに最初の1回だけ
    → 成功するとログイン状態が端末に保存される（localStorage）
    → 以後この画面はスキップ

[毎回]
  アプリを開く
    → 今まで通り 名前タイルをタップ                   ← 子どもの毎日の操作は不変
    → /home
```

ポイント：
- 「あいことば」は**認証**（この端末は正規の利用者か？）。端末ごとに1回。
- 「名前タイル」は**誰の記録か の選択**（今まで通り・毎回）。認証ではない。
- Supabase のログインセッションは localStorage に自動保存され、期限が切れるまで残る。
  → 学校のタブレットは初回セットアップ時に1回あいことばを入れれば、その学期は聞かれない。
- あいことばは**教室に掲示**する運用（黒板・掲示物）。コードには絶対に書かない。

### 具体の入れ方
- 新規：`src/components/auth/ClassGate.tsx`（あいことば入力画面）
  - `supabase.auth.signInWithPassword({ email: 共通アカウント, password: 入力値 })` を呼ぶ。
  - **共通アカウントのメールアドレスは埋め込んでよい**（メールは秘密ではない）。
    **パスワード（あいことば）だけは絶対に埋め込まない**。児童が入力する。
  - 成功したら `/`（名前えらび）へ。失敗したら「あいことばが ちがうよ」を表示。
- 変更：`src/App.tsx` のルート構成
  - Supabase セッションが無ければ `ClassGate` を出す。あれば今まで通り。
  - セッションの有無は `supabase.auth.getSession()` / `onAuthStateChange` で判定。
- `src/components/auth/ProtectedRoute.tsx`
  - 今は `localStorage.studentId` の有無だけ見ている。ここに
    「Supabaseセッションもあること」の判定を足す（無ければ ClassGate へ）。
- 既存の `studentId` / `studentName` を localStorage に持つ仕組みは**そのまま流用**（壊さない）。

---

## 3. 教師（スタッフ）画面の分離

今の問題：スタッフ画面のPINが `7777` でコードに直書き（`Login.tsx` の `handlePinSubmit`）。
配るファイルに入っているので、実質だれでも教師画面に入れてしまう。

新方式：教師は**別アカウント**でログインする。
- 例：`teacher56@example.com` ＋ 教師用パスワード（山田だけが知る・掲示しない）。
- 教師画面（`/teacher`）を開くときに、このアカウントでのログインを求める。
- テーブルの鍵（RLS）で「`app_settings_v1` の書き換え」と「全児童の管理操作」は
  **教師アカウントのときだけ**許可する（下の SQL 参照）。
- これで、児童アカウントでログインした状態では教師操作ができなくなる。

段階を分けたいなら、Phase 1 ではまず PIN `7777` を
「コードに書かず環境や設定から読む」だけでも今よりマシになるが、
**本命は教師専用アカウントによる分離**。できればここまでやる。

---

## 4. APIキーをアプリから無くす（Phase 2・できれば同じ夏に）

`app_settings_v1` 行に Gemini／Azure のキーが平文で入っている（`TeacherDashboard.tsx` が保存、
`useAppSettings.ts` が全端末へ配信）。共通パスワード認証を入れれば「外部の第三者」からは守れるが、
**ログインした児童からはまだ見える**（アプリを解析すればキーを取れる）。本当に安全にするには、
キーをアプリから完全に無くす必要がある。

正道：**Supabase Edge Function を「代理（プロキシ）」にする**。
- キーは Edge Function 側（サーバー）にだけ置く。アプリはキーを一切持たない。
- アプリは「翻訳して」「発音を判定して」と Edge Function に頼み、Function が裏でキーを使って
  Gemini／Azure を呼び、結果だけ返す。
- 使う箇所：`src/components/dictionary/games/AIAssistant.tsx`、`StoryMode.tsx`、
  発音判定 `src/hooks/usePronunciationAssessment.ts`（Azure）。
- 1日の上限（`src/lib/apiUsage.ts` のキャップ50/80）は Function 側でも持つと、なお安全
  （今は端末ごとの自己申告なので、その気になれば回避できる）。

このとき **Gemini／Azure のキーは必ずローテート（作り直し）する**。今のキーは一度でも
公開状態にさらされているため。新しいキーは Edge Function の環境変数にだけ入れる。

> Phase 2 は工数が要るので、Phase 1（共通パスワード）を先に確実に入れて外部を締め出し、
> その後に着手でよい。ただし「生きたキーが露出している」状態は Phase 1 完了までは続く点は理解しておく
> （Phase 1 で anon を締め出せば、少なくとも“ログインもせず素通しで抜く”経路は消える）。

---

## 5. データベースの鍵の付け替え（実装者向け・Supabase MCP で）

> プロジェクト：`ifaqtjttrjskflgrebnh`（"English Learning Adventure"）。
> **必ず「新しいアプリをデプロイして動作確認 → その後に鍵を付け替え」の順で**（理由は §6）。

### 5-1. 児童データ（`public.students`）
今ある anon 向けポリシー3本（`読み込み許可` `書き込み許可` `更新許可`）を削除し、
authenticated 向けに作り直す。教師専用の書き込みは分ける。

```sql
-- 旧: anon 全開放を撤去
drop policy if exists "読み込み許可" on public.students;
drop policy if exists "書き込み許可" on public.students;
drop policy if exists "更新許可"   on public.students;

-- 新: ログイン済みなら児童行を読める（ランキング・木・名前一覧のため全児童読み取りは維持）
create policy "authed_read" on public.students
  for select to authenticated using (true);

-- 新: ログイン済みなら児童行を追加・更新できる。ただし app_settings_v1 は除外（設定行は教師だけ）
create policy "authed_insert" on public.students
  for insert to authenticated with check (id <> 'app_settings_v1');
create policy "authed_update" on public.students
  for update to authenticated using (id <> 'app_settings_v1') with check (id <> 'app_settings_v1');

-- 新: 設定行 app_settings_v1 の読み書きは「教師アカウント」だけ
--     （メールアドレスは実際に作る教師アカウントに合わせて書き換える）
create policy "teacher_settings_all" on public.students
  for all to authenticated
  using (id = 'app_settings_v1' and auth.jwt()->>'email' = 'teacher56@example.com')
  with check (id = 'app_settings_v1' and auth.jwt()->>'email' = 'teacher56@example.com');
```

> 注意：`app_settings_v1` の**読み取り**は児童アプリも必要（全体ロックや今日のミッションを受け取る）。
> 上のままだと児童が設定行を読めない。**読み取りだけは全 authenticated に許し、書き込みは教師だけ**にする：
>
> ```sql
> create policy "authed_read_settings" on public.students
>   for select to authenticated using (true);   -- ※ authed_read が既に全行select可ならこの行は不要
> ```
>
> 実装時に「児童は app_settings_v1 を **読めるが書けない**、教師は読み書きできる」を満たすこと。
> APIキーの平文が児童から読めるのが嫌なら、キーは Phase 2 で Edge Function に移し、
> 設定行からは消すのが最終形（§4）。

### 5-2. 背景画像（`storage.objects` の `backgrounds`）
2026-07-23 に「誰でも削除」は封じ済み（DELETE ポリシーを外した）。今は role=public のまま。
認証導入にあわせて **public → authenticated** に寄せる：

```sql
drop policy if exists "backgrounds_read"   on storage.objects;
drop policy if exists "backgrounds_insert" on storage.objects;
drop policy if exists "backgrounds_update" on storage.objects;

create policy "bg_read"   on storage.objects for select to authenticated using (bucket_id='backgrounds');
create policy "bg_insert" on storage.objects for insert to authenticated with check (bucket_id='backgrounds');
create policy "bg_update" on storage.objects for update to authenticated
  using (bucket_id='backgrounds') with check (bucket_id='backgrounds');
```

> ただしバケット自体が「public bucket」だと、画像URLを知っていればログイン無しでも画像は見える。
> 児童の背景画像にそこまでの秘匿は不要と判断するならこのままでよい。厳密にするならバケットを
> private にして署名付きURLに変える（`Shop.tsx` の `getPublicUrl` を `createSignedUrl` に変更）が、
> 使用感と工数を考えると Phase 1 では見送ってよい。

### 5-3. バックアップ（`students_snapshots`）
RLS 有効・ポリシー無し（anon も authenticated も触れない）で正しく閉じている。**変更不要**。
pg_cron ジョブ `daily-students-snapshot`（毎日 04:00 JST・45日保持）が稼働中。

---

## 6. 移行の手順と安全策（順番を守る）

授業に影響しない**夏休み中**に、次の順でやる。**順番を逆にするとアプリが止まる**。

1. **手動スナップショットを取る**（作業前の保険）。
   ```sql
   insert into public.students_snapshots (snap_date, id, data)
   select current_date, s.id, to_jsonb(s) from public.students s
   on conflict (snap_date, id) do update set data = excluded.data;
   ```
2. **共通アカウントと教師アカウントを作る**（Supabase の Authentication 画面 or MCP）。
   あいことば・教師パスワードを決める。あいことばは掲示用に控える。
3. **認証を入れた新バージョンを実装**（§2・§3）。ローカルで、共通アカウントでログイン →
   名前えらび → 各機能（辞書・発音・ショップ・木・ランキング・ふりかえり）が動くことを確認。
4. **新バージョンをデプロイ**（`npm run build` → `npm run deploy`＝gh-pages）。
   この時点ではまだ DB の鍵は anon 全開放のまま＝**新旧どちらのアプリも動く**（無停止）。
5. デプロイ後の本番URLで、実機（学校と同じ環境）で**もう一度ひと通り動作確認**。
6. 問題なければ **§5 の SQL で鍵を付け替え**（anon 撤去 → authenticated へ）。
   付け替え後、本番アプリを再読み込みして「あいことば → 名前 → 各機能」を最終確認。
7. うまくいかない場合の**戻し方**：§5 で drop した anon ポリシー3本を作り直せば即座に元に戻る
   （データは消えない）。SQL を手元に控えておく。

> 静的ホスティング（GitHub Pages）なのでサーバー側に秘密を置けない。だから
> 「パスワードを埋め込まない（児童が入力）」という §0 の大原則が、この構成では必須になる。

---

## 7. 実装チェックリスト（実装者が終わったら埋める）

- [ ] `ClassGate.tsx` を追加し、共通アカウントでのログインを実装（**あいことばは非埋め込み**）
- [ ] `App.tsx` / `ProtectedRoute.tsx` を、セッション未ログインなら ClassGate に送るよう変更
- [ ] 名前えらび（`Login.tsx`）と /home 以降の**毎回の操作は不変**であることを実機確認
- [ ] 教師画面を `teacher56@…` 専用アカウントに分離（PIN `7777` 直書きを廃止）
- [ ] §5-1 の SQL で `students` の鍵を authenticated に付け替え（設定行の読/書を分離）
- [ ] §5-2 で `backgrounds` を authenticated に寄せる
- [ ] 児童アプリが `app_settings_v1` を**読めるが書けない**／教師は読み書きできる、を確認
- [ ] 全児童読み取りの3画面（名前一覧・クラスの木・ランキング）が動く
- [ ] ショップの背景アップロード（`Shop.tsx` の upsert）が動く
- [ ] （Phase 2）Gemini／Azure を Edge Function プロキシへ移し、キーをアプリから削除＋**キーをローテート**
- [ ] 作業前スナップショット取得済み／anonポリシー復旧SQLを手元に保管

---

## 付録：関連ファイルの地図（実装者の初動用）

| ファイル | 役割 | この計画での触り方 |
|---|---|---|
| `src/lib/supabase.ts` | Supabaseクライアント生成（anonキー） | 触らない（anonキーはログインAPIを叩くために必要・公開でよい） |
| `src/components/auth/Login.tsx` | 名前えらび＋スタッフPIN(7777直書き) | PIN廃止・名前えらびは維持 |
| `src/components/auth/ProtectedRoute.tsx` | studentId有無でルート保護 | セッション判定を追加 |
| `src/App.tsx` | ルーティング | ClassGate を前段に追加 |
| `src/lib/sync.ts` | 児童データの push/pull（消失対策のマージ有） | **触らない**。過去にふりかえり消失事故あり・デリケート |
| `src/hooks/useAppSettings.ts` | app_settings_v1 の受信・全体ロック等 | 読み取りのまま。書き込みは教師画面のみ |
| `src/components/teacher/TeacherDashboard.tsx` | 設定保存・APIキー保存・児童管理 | 教師アカウント前提に。Phase2でキー保存を廃止 |
| `src/lib/apiUsage.ts` | API使用回数キャップ（端末自己申告） | Phase2でサーバー側に寄せると堅牢 |
| `src/components/shop/Shop.tsx` | 背景アップロード(upsert) | ポリシー変更後も動くことを確認 |
