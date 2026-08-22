# Fune Gallery (Next.js + Docker版)

WordPressから脱却した、Next.js + Supabase + Cloudflare R2 のギャラリーサイト。
**開発はDocker、公開はVercel**（またはDockerで自前ホスト）。

## 構成

- **Next.js 15 (App Router) + TypeScript** — アプリ本体（表側 + 管理画面）
- **Zod** — 入力バリデーション（画面とAPIで同じスキーマを使う）
- **Supabase** — データベース（作品情報）+ 認証（管理画面ログイン）
- **Cloudflare R2** — 画像ストレージ（転送量無料）
- **Docker** — ローカル開発環境
- **Vercel** — 公開ホスティング（または自前Dockerホスト）

## ディレクトリ構成

```
Dockerfile.dev          開発用（ホットリロード）
Dockerfile              本番用（standalone・自前ホスト時）
compose.yml             開発用Docker Compose
app/
  layout.tsx            <html>/フォント読み込み
  fune-gallery.css      表側のスタイル（旧テーマのSCSSをコンパイルしたもの・編集しない）
  (site)/               表側。旧WordPressテーマ fune-gallery と同じ見た目
    page.tsx            トップ（front-page.php + search.php）
    works/[id]/page.tsx 作品詳細（single-illustration.php）
    not-found.tsx       404（404.php）
  login/page.tsx        管理ログイン
  admin/                管理画面（ログイン必須）
  api/                  作成・更新・削除・画像アップロードAPI
components/             表側のパーツ（ヘッダー/ヒーロー/カード/計器帯 …）
public/fune-gallery.js  表側の動き（旧テーマの assets/js/main.js そのまま）
lib/                    接続・認証・CRUD・ギャラリーの取得と幾何計算
middleware.ts           /admin をログイン必須に
scripts/
  migrate-from-wordpress.ts  WordPress→Supabase+R2 移行
  backfill-image-size.ts     既存作品に画像の実寸を埋める
supabase-setup.sql         DBテーブル作成SQL
supabase-add-image-size.sql 画像サイズ列の追加（既存DB向け）
styles/scss/               表側スタイルの原本（npm run css で app/fune-gallery.css を生成）
docs/DESIGN.md             デザイン仕様書（デザインの唯一の正）
```

## セットアップ手順（Docker前提）

### 1. 環境変数の準備

```bash
cp .env.local.example .env.local
```

`.env.local` を開いて、Supabase・R2の実際の値を埋める（下記2〜4で取得）。

### 2. Supabase を準備

1. Supabaseでプロジェクト作成
2. SQL Editor に `supabase-setup.sql` を貼って実行（テーブル作成）
   既にテーブルがある場合は、代わりに `supabase-add-image-size.sql` を実行して
   画像サイズ列を足す（表側のギャラリーがこの比でカードの高さを決めるため）
3. Authentication → Users → Add user で、自分のメール+パスワードを登録
   （これが管理画面のログイン情報）
4. Project Settings → API から URL・anon・service_role キーを取得し `.env.local` へ

### 3. Cloudflare R2 を準備

1. Cloudflareアカウント作成 → R2を有効化
2. バケット `fune-gallery` を作成
3. バケットを公開設定（Public Development URL を有効化 or 独自ドメイン接続）
4. R2 API トークンを発行し、endpoint・アクセスキーを `.env.local` へ

### 4. Docker で開発サーバー起動

```bash
docker compose up -d --build
```

- 表側: http://localhost:3000
- 管理: http://localhost:3000/admin （未ログインなら /login へ）

ログを見る:

```bash
docker compose logs -f app
```

### 5. データ移行（WordPressから）

WordPress(RDS/EC2)が起動している状態で、コンテナ内で実行:

```bash
docker compose exec app npm run migrate
```

128点の作品と画像が Supabase + R2 に移行される。

移行後（および既存DBに列を足した後）は、画像の実寸を埋める:

```bash
npm run backfill:size
```

R2 の画像のヘッダだけ読んで `image_width` / `image_height` を入れる。
表側のギャラリーはこの比からカードの行数を決めるので、これを入れないと
縦長の作品も横長と同じ高さの枠に収まり、上下が削られる。
（入っていなくても 4:3 として表示されるので、サイトは壊れない）

### 6. Vercelにデプロイ（公開）

1. GitHubリポジトリにpush
2. Vercel → New Project → リポジトリ選択
3. 環境変数（.env.localの中身）をVercelに登録
4. Deploy

※ Vercelはビルド済みを配信するため、Dockerfileは使われない。
ローカル=Docker、本番=Vercel という分担。

### （代替）Vercelを使わず自前Dockerで公開する場合

```bash
docker build -t fune-gallery .
docker run -p 3000:3000 --env-file .env.local fune-gallery
```

本番用 `Dockerfile`（standalone）でビルドされる。
この場合はVercelは不要だが、公開サーバー（VPS等）が別途必要。

### 7. AWS削除

新サイトが安定稼働したら、AWS（EC2・RDS・Elastic IP）を削除。

## よく使うDockerコマンド

```bash
docker compose up -d --build      # 起動（初回・依存変更時）
docker compose up -d              # 起動
docker compose down               # 停止
docker compose logs -f app        # ログ確認
docker compose exec app sh        # コンテナ内シェルに入る
docker compose exec app npm run migrate  # 移行実行
```

## 表側のデザイン

旧WordPressテーマ `fune-gallery`（ゼンレスゾーンゼロ調）をそのまま移植したもの。
設計の根拠と実測値は **`docs/DESIGN.md`** が引き続き正。マークアップのクラス名・DOM構造も
旧テンプレートに合わせてあるので、DESIGN.md を読めばこちらのコードも読める。

> 移植が終わったので、旧WordPress一式（`docker-lamp/`）は 2026-08-22 に削除した。
> SCSS と DESIGN.md だけこのリポジトリに引き取ってある。

- **CSS** — `styles/scss/main.scss` を dart-sass でコンパイルした結果が
  `app/fune-gallery.css`。**生成物なので直接編集しない。** 直すときは SCSS を直して:

  ```bash
  npm run css          # 1回だけ生成
  npm run css:watch    # 書きながら生成し続ける
  ```

- **JS** — `public/fune-gallery.js`。旧テーマの `assets/js/main.js` が出発点だが、
  起動部分の差し替えとSPのスワイプ対応を入れてあるので、もう写しではない。
  ここで保守する。整形すると差分が読みにくくなるので prettier からは外してある。

- **リンク** — 表側は `<Link>` ではなく素の `<a>` を使う。WordPress と同じく毎回
  ページ全体を読み直すことで、読み込みイントロとページ送りのCRT演出が同じように出る。

- **PHP との対応** — `lib/gallery.ts` の関数名は functions.php に合わせてある
  （`fune_gallery_tv_geometry()` → `tvGeometry()` など）。

### ファビコン

旧WordPressの「サイトアイコン」（設定 → 添付ID 11）と同じイラストを使っている。
Next.js の App Router のファイル規約に置いてあるので、`<link rel="icon">` は
自動で出力される（`app/layout.tsx` には書かない）。

| ファイル             | サイズ  | 用途                                                          |
| -------------------- | ------- | ------------------------------------------------------------- |
| `app/favicon.ico`    | 16 + 32 | 素の `/favicon.ico` を取りにくる古いクライアント向け          |
| `app/icon.png`       | 32×32   | ブラウザのタブ                                                |
| `app/icon1.png`      | 192×192 | 高解像度のブラウザ用アイコン（ブックマーク・高DPIのタブなど） |
| `app/apple-icon.png` | 180×180 | iOS のホーム画面（`apple-touch-icon`。iOSはこれだけで効く）   |

**Androidのホーム画面アイコンは、このリポジトリでは保証していない。**
Chrome が正式に見るのは Web App Manifest の `icons` で、`<link rel="icon">` は
あくまでフォールバックでしかない。対応するなら `app/manifest.ts` を足して
192×192 を登録すること（PWAとして扱われるようになるので、`display` の指定は
慎重に）。

元画像は WordPress が生成していた
`migration-data/uploads/2026/07/cropped-無題163_20240526011732*.png`。
**`migration-data/` は .gitignore なので、リポジトリには上の4枚しか無い。**
差し替えるときは元のPNGから作り直すこと（`.ico` は16と32のPNGを
ICO コンテナに詰めただけのもの）。

透過PNGなので、明るいタブでは白い衣装の部分が地に溶ける。髪のピンクで
輪郭は保つが、極小サイズでの視認性を上げたい場合は顔まわりに寄せて
クロップし直すのが早い。

### 画像の配信

R2 に入っているのは**原寸**（4000〜7000px、1枚20MB超のものもある）。カードの実表示は
280px 前後しかないので、原寸のまま出すと1ページで **96MB** を読むことになり、
デコードでメインスレッドが止まる（実測でコマ落ち率 8.5%、最悪フレーム 358ms）。

旧テーマも同じ理由で `fune-gallery-thumb`(600w) と `large`(1024w) を使い分けていた。
移行時に画像URLを1本に集約したときに、その使い分けが落ちていた。

いまは `next/image` を通して表示サイズに合わせて縮めている（1ページ 0.6MB / コマ落ち 0%）。

- `sizes` は `components/WorkImage.tsx` に用途ごとに定義してある。
  **`_gallery.scss` の `--cols` を変えたら、こちらも合わせること。**
  ここがずれると、必要より大きい画像が降ってくる（見た目は変わらないので気付きにくい）
- 変換結果は `minimumCacheTTL` で31日持たせている。ただしキャッシュは
  **URL・幅・品質・形式の組み合わせごと**に分かれるので、「原寸の取得は1回だけ」
  ではない。srcset の候補幅のうち実際に要求されたものと、ズーム用の 2048px が
  それぞれ初回に原寸を取りに行く（最大の24MB画像で1変換あたり初回1.5秒 → 2回目 2.6ms）。
  だから候補幅は `next.config.ts` で必要な分だけに絞ってある
- 拡大表示（CLICK TO ZOOM）も原寸ではなく 2048px の変換結果を渡している

### WordPress から変わった点

- **About は無い**（旧テーマで 2026-08-02 に廃止済み。ナビもギャラリーのみ）
- **ページ送りは `/page/2/` ではなく `?paged=2`**
- **画像の比は DBの `image_width` / `image_height` から取る**（旧テーマは添付メタから取っていた）
- **検索は `title` / `description` の部分一致**（`posts_search` フィルタの置き換え）
- **並び替えは「新しい順 / 古い順」の2つ**。旧テーマにあった SHUFFLE は廃止した
  （seed を URL に固定する仕組みも一緒に落とした）
- **SPではコントロールバーを固定表示しない。** 代わりに同じ操作をヘッダーの検索パネルに置いている

## 認証の仕組み

- 管理画面(`/admin`)は `middleware.ts` でログイン必須
- ログインはSupabase Authのメール+パスワード
- 書き込みAPIは `requireUser()` でログインチェック
- DB書き込みは service_role キーでサーバー側からのみ

## 現行サイトからの引き継ぎ（ACF → 新DB）

| WordPress (ACF)            | 新DB (illustrations)   |
| -------------------------- | ---------------------- |
| title                      | title                  |
| description                | description            |
| main_image (画像ID)        | image_url (R2のURL)    |
| production_date (YYYYMMDD) | production_date (DATE) |
