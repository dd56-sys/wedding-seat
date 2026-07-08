# 婚宴座位編排

兩頁式的婚宴座位工具：一頁給賓客查詢自己的座位，一頁給新人自己編輯座位，並透過 Supabase 跨裝置同步。

## 檔案說明

- `index.html` — **賓客查詢首頁**（GitHub Pages 開啟網址時預設看到的頁面），輸入姓名即可查詢座位，手機瀏覽器最佳化，不需要登入
- `admin.html` — **座位編輯後台**，需要登入才能使用，用來新增/拖曳桌子、匯入賓客、拖曳排位
- `config.example.js` — 設定範本，可安全提交到 Git
- `config.js` — 本機測試用的實際設定值（**已被 .gitignore 排除，不會提交**）
- `.github/workflows/deploy-pages.yml` — 部署到 GitHub Pages 時，自動用 Repository Secrets 產生 `config.js`（`index.html`、`admin.html` 共用同一份）

## 本機測試

1. 複製 `config.example.js` 為 `config.js`，填入 Supabase Project URL、anon public key、活動代碼
2. 用簡易伺服器本機測試（部分瀏覽器對 `file://` 讀取本地 `config.js` 有限制）：
   ```
   python3 -m http.server
   ```
3. 瀏覽器開啟 `http://localhost:8000/index.html`（賓客查詢）或 `http://localhost:8000/admin.html`（後台，需登入）

## 部署到 GitHub Pages（環境變數版）

1. 建立一個 GitHub repo，把所有檔案 push 上去（`config.js` 因為被 gitignore，不會被上傳，這是預期行為）
2. 到 repo 的 **Settings → Secrets and variables → Actions**，新增三個 Repository secrets：
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `EVENT_CODE`
3. 到 **Settings → Pages**，Source 選擇「GitHub Actions」
4. push 到 `main` 分支後，Actions 會自動執行：用你剛剛設的 Secrets 產生 `config.js`，再部署到 GitHub Pages
5. 部署完成後，網站首頁（`/`）就是賓客查詢頁；後台在 `/admin.html`，只給你自己使用，不要把這個連結公開給賓客

## 資料庫與登入帳號建立

第一次使用 Supabase 前，到專案的 SQL Editor 執行一次（也可在 admin.html 裡「查看資料庫建立教學」看到同樣內容）：

```sql
create table wedding_seating_data (
  event_code text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table wedding_seating_data enable row level security;

-- 任何人（含未登入的賓客查詢頁）可以讀取
create policy "public can read"
  on wedding_seating_data for select
  using (true);

-- 只有登入帳號（新人自己）可以新增/修改/刪除
create policy "authenticated can insert"
  on wedding_seating_data for insert
  with check (auth.role() = 'authenticated');
create policy "authenticated can update"
  on wedding_seating_data for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
create policy "authenticated can delete"
  on wedding_seating_data for delete
  using (auth.role() = 'authenticated');
```

建立後記得到 Table Editor 開啟這張表的 Realtime，才能讓多裝置即時同步。

接著建立後台登入帳號：到 Supabase 專案的 **Authentication → Users**，點 **Add user**，輸入 Email／密碼，並勾選 **Auto Confirm User**。這組帳密就是 `admin.html` 的登入帳號。再到 **Authentication → Settings** 把「**Allow new users to sign up**」關閉，避免其他人自行註冊帳號登入你的後台。

## 賓客姓名命名規則（重要）

`index.html` 的查詢頁會把姓名結尾為單一大寫英文字母的賓客，自動歸類成同一組，查詢下拉選單只會顯示去掉字母後的姓名：

- `王小明`、`王小明A`、`王小明B` → 搜尋「王小明」時只會列出一次「王小明」，選取後三個人的座位都會一起標示出來

在 admin.html 新增賓客時，請依照這個規則命名同行賓客。

## 安全性備註

- Supabase 的 anon public key 本質上是設計成可以公開在前端的，不是密鑰；真正的存取控制來自上面的 RLS（Row Level Security）規則
- 這裡用 GitHub Actions + Secrets 的目的是讓設定值不寫進版控歷史、方便管理，而不是「隱藏」金鑰本身
- `admin.html` 的登入是用 Supabase Auth 做真正的帳號密碼驗證（不是前端寫死的假密碼），未登入者即使拿到網址也無法新增/修改/刪除座位資料，因為資料庫層的 RLS 規則會擋下來
- `index.html` 賓客查詢頁只會讀取資料，且畫面上刻意不顯示其他賓客的完整名單或餐點內容，只有搜尋到的人才會顯示，保護賓客隱私
