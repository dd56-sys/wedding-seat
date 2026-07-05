# 婚宴座位編排

單一 HTML 檔案的互動式座位編排工具，可拖曳桌子、拖曳賓客入座，並透過 Supabase 跨裝置同步。

## 檔案說明

- `wedding_seating.html` — 主程式，開啟即可使用
- `config.example.js` — 設定範本，可安全提交到 Git
- `config.js` — 本機測試用的實際設定值（**已被 .gitignore 排除，不會提交**）
- `.github/workflows/deploy-pages.yml` — 部署到 GitHub Pages 時，自動用 Repository Secrets 產生 `config.js`

## 本機測試

1. 複製 `config.example.js` 為 `config.js`
2. 填入你的 Supabase Project URL、anon public key、活動代碼
3. 用瀏覽器直接開啟 `wedding_seating.html`（部分瀏覽器對 `file://` 讀取本地 `config.js` 有限制，建議用 `python3 -m http.server` 之類的簡易伺服器本機測試）

## 部署到 GitHub Pages（環境變數版）

1. 建立一個 GitHub repo，把這些檔案 push 上去（`config.js` 因為被 gitignore，不會被上傳，這是預期行為）
2. 到 repo 的 **Settings → Secrets and variables → Actions**，新增三個 Repository secrets：
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `EVENT_CODE`
3. 到 **Settings → Pages**，Source 選擇「GitHub Actions」
4. push 到 `main` 分支後，Actions 會自動執行：用你剛剛設的 Secrets 產生 `config.js`，再部署到 GitHub Pages
5. 之後每次改動程式碼並 push，都會自動重新部署；Secrets 只存在 GitHub 後台，不會出現在原始碼或 commit 歷史中

## 資料庫建立

第一次使用 Supabase 前，到專案的 SQL Editor 執行一次（也可在網頁內「查看資料庫建立教學」看到同樣內容）：

```sql
create table wedding_seating_data (
  event_code text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table wedding_seating_data enable row level security;
create policy "allow anon all"
  on wedding_seating_data for all
  using (true) with check (true);
```

建立後記得到 Table Editor 開啟這張表的 Realtime，才能讓多裝置即時同步。

## 安全性備註

Supabase 的 anon public key 本質上是設計成可以公開在前端的，不是密鑰；真正的存取控制來自上面的 RLS（Row Level Security）規則。這裡用 GitHub Actions + Secrets 的目的是讓設定值不寫進版控歷史、方便管理，而不是「隱藏」金鑰本身。
