// ============================================================
// 這是設定範本，可以安全提交到 Git。
//
// 本機測試方式：
//   1. 複製這個檔案，改名為 config.js（跟這個檔案放在同一層）
//   2. 填入你的實際 Supabase 值
//   3. config.js 已被 .gitignore 排除，不會被提交上去
//
// 部署到 GitHub Pages 時：
//   不需要手動建立 config.js，GitHub Actions 會在部署時
//   自動用 Repository Secrets 產生它（見 .github/workflows/deploy-pages.yml）
// ============================================================
window.APP_CONFIG = {
  SUPABASE_URL: "",        // 例如 https://xxxxxxxx.supabase.co
  SUPABASE_ANON_KEY: "",   // Supabase 專案 Settings → API 裡的 anon public key
  EVENT_CODE: ""           // 自訂代號，例如 wedding2026，跨裝置需輸入相同代碼
};
