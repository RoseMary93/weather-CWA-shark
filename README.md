# 🌤️ CWA 天氣預報應用程式

一個現代化的台灣天氣預報應用，整合中央氣象署 (CWA) 的天氣預測資料，提供實時天氣訊息、每週預報和日落時間計算。

---

## � 專案來源

本專案是 Fork 自 [gonsakon](https://github.com/gonsakon) 的原始專案：
- 🔗 **後端原始倉庫**: [CwaWeather-backend](https://github.com/gonsakon/CwaWeather-backend)
- 🔗 **前端原始倉庫**: [CwaWeather-frontend](https://github.com/gonsakon/CwaWeather-frontend)

### ✨ 新增/改進功能
- 📅 **一周天氣的全部功能** - 完整的每日天氣預報展示
- 📍 **GPS 定位功能** - 自動偵測使用者位置並顯示當地天氣
- 🎨 改進的使用者介面設計
- 📦 增強的功能集設定
- 🎯 優化的樣式與 UX 體驗
- 🔧 改進的配置管理

---

## �📋 專案概述

本應用分為兩個主要部分：
- **後端 (Backend)**: Express.js 伺服器，提供 RESTful API
- **前端 (Frontend)**: HTML/CSS/JavaScript，提供使用者介面

### 主要功能
- ✅ 查詢台灣各縣市當日天氣預報
- ✅ 檢視一週天氣預報
- ✅ 自動計算日落時間
- ✅ 支援全台 22 個縣市
- ✅ 即時天氣資料更新

---

## 🚀 快速開始

### 1️⃣ 環境需求

- **Node.js** v16.0.0 或以上版本
- **npm** 或 **yarn** 套件管理工具
- **CWA API Key** (從 [中央氣象署開放資料平台](https://opendata.cwa.gov.tw/) 申請)

### 2️⃣ 安裝步驟

#### 步驟一：複製專案
```bash
git clone <your-repository-url>
cd weather-2026-PJ
```

#### 步驟二：安裝後端依賴
```bash
cd CwaWeather-backend
npm install
```

#### 步驟三：設定環境變數
在 `CwaWeather-backend` 資料夾建立 `.env` 檔案：

```env
# CWA API 設定
CWA_API_KEY=your_api_key_here

# 伺服器設定 (可選)
PORT=3000
NODE_ENV=development
```

> **重要**: 請將 `your_api_key_here` 替換為您的實際 CWA API Key

#### 步驟四：啟動後端伺服器
```bash
# 開發模式 (with nodemon 自動重啟)
npm run dev

# 或使用生產模式
npm start
```

**預期輸出**: 伺服器將在 `http://localhost:3000` 啟動

#### 步驟五：啟動前端應用
在新的終端視窗中：

```bash
cd ../CwaWeather-frontend
```

然後選擇以下任一方式啟動前端：

**方式 A: 使用 Live Server (推薦)**
- 在 VS Code 中右鍵點擊 `index.html`
- 選擇 "Open with Live Server"

**方式 B: Python 簡易伺服器**
```bash
# Python 3
python -m http.server 8000

# 或 Python 2
python -m SimpleHTTPServer 8000
```

**方式 C: Node.js http-server**
```bash
npx http-server
```

預設會在 `http://localhost:8000` (或 `http://localhost:5500` if using Live Server) 開啟

---

## 📖 使用說明

### 前端操作指南

1. **打開應用**
   - 在瀏覽器中打開應用首頁
   - 應用會自動載入台北市的天氣資訊

2. **選擇縣市**
   - 點擊左側或頂部的城市按鈕
   - 支援的縣市:
     - 台北地區：台北市、新北市、基隆市
     - 桃竹地區：桃園市、新竹市、新竹縣
     - 中部地區：苗栗縣、台中市、彰化縣、南投縣、雲林縣
     - 南部地區：嘉義市、嘉義縣、台南市、高雄市、屏東縣
     - 東部地區：宜蘭縣、花蓮縣、台東縣
     - 外島：澎湖縣、金門縣、馬祖

3. **查看天氣資訊**
   - **當日天氣**: 顯示溫度、濕度、降雨機率等即時資訊
   - **每週預報**: 點擊「週預報」標籤查看 7 天天氣
   - **日落時間**: 自動根據選定城市計算當日日落時間

4. **刷新資料**
   - 點擊「刷新」按鈕獲取最新天氣資訊
   - 應用每 10 分鐘自動更新一次資料

---

## 🛠️ 後端 API 端點

### 當日天氣 API
```
GET /api/weather/:cityCode
```

**範例請求:**
```bash
curl http://localhost:3000/api/weather/taipei
```

**支援的城市代碼:**
- taipei (臺北市)
- newtaipei (新北市)
- keelung (基隆市)
- taoyuan (桃園市)
- hsinchu_city (新竹市)
- hsinchu_county (新竹縣)
- 等等... (完整列表見 server.js)

**回應格式:**
```json
{
  "city": "臺北市",
  "temperature": 28,
  "humidity": 65,
  "rainProbability": 20,
  "weatherDescription": "晴天",
  "timestamp": "2026-05-25T14:30:00Z"
}
```

### 每週預報 API
```
GET /api/weekly/:cityCode
```

**回應格式:**
```json
{
  "city": "臺北市",
  "forecast": [
    {
      "date": "2026-05-25",
      "highTemp": 32,
      "lowTemp": 25,
      "description": "晴天"
    }
    // ... 更多日期資料
  ]
}
```

---

## 📁 專案結構

```
weather-2026-PJ/
├── CwaWeather-backend/          # 後端服務
│   ├── server.js                # Express 伺服器主檔案
│   ├── package.json             # 依賴套件清單
│   ├── .env                     # 環境變數 (本地開發用)
│   └── README.md                # 後端說明文檔
│
├── CwaWeather-frontend/         # 前端應用
│   ├── index.html               # HTML 首頁
│   ├── app.js                   # JavaScript 應用邏輯
│   ├── style.css                # 樣式表
│   └── (assets)                 # 圖片等資源
│
└── README.md                    # 本檔案
```

---

## 🔧 技術堆疊

### 後端
- **Express.js** - Web 框架
- **Axios** - HTTP 客戶端
- **CORS** - 跨域資源共享
- **dotenv** - 環境變數管理
- **nodemon** - 開發工具 (自動重啟)

### 前端
- **Vanilla JavaScript** - 無框架原生 JS
- **Fetch API** - 非同步資料取得
- **CSS Grid / Flexbox** - 響應式設計

### 資料來源
- **CWA 開放資料平台** - 中央氣象署天氣資料

---

## 🔐 環境變數設定

在 `CwaWeather-backend/.env` 中設定：

```env
# 必須
CWA_API_KEY=your_cwa_api_key

# 可選
PORT=3000                    # 伺服器埠號 (預設 3000)
NODE_ENV=development        # 執行環境
```

---

## 🐛 常見問題

### Q1: 啟動後看不到天氣資訊？
**A:** 
- 檢查 `.env` 檔案中的 `CWA_API_KEY` 是否正確
- 確認後端伺服器已啟動 (`http://localhost:3000`)
- 在瀏覽器開發者工具 (F12) 中查看 Console 錯誤訊息

### Q2: "CORS 錯誤" 或 "連線被拒"？
**A:**
- 確認後端伺服器正在執行
- 檢查前端中 `API_BASE_URL` 是否設置正確
- 確保埠號設定無誤 (預設 3000 和 8000)

### Q3: 如何修改伺服器埠號？
**A:**
- 編輯 `.env` 檔案，設定 `PORT=5000` (或其他埠號)
- 同時更新前端 `app.js` 中的 `API_BASE_URL`

### Q4: 如何取得 CWA API Key？
**A:**
1. 前往 [CWA 開放資料平台](https://opendata.cwa.gov.tw/)
2. 點擊「註冊」建立帳號
3. 登入後申請 API Key
4. 複製 Key 到 `.env` 檔案

---

## 📝 開發指南

### 新增城市

編輯 `CwaWeather-backend/server.js` 中的 `CITY_MAPPING` 和 `CITY_DATASET_MAPPING`：

```javascript
CITY_MAPPING = {
  // ... 現有城市
  new_city: "新城市名稱",
};

CITY_DATASET_MAPPING = {
  // ... 現有對應
  new_city: "F-D0047-XXX",  // CWA Dataset ID
};
```

### 修改天氣資訊欄位

編輯 `CwaWeather-frontend/app.js` 中的資料解析邏輯

### 自訂樣式

編輯 `CwaWeather-frontend/style.css` 修改應用外觀

---

## 📄 授權

本專案採用 **MIT 許可證** 授權。詳見 [LICENSE.md](LICENSE.md)

**原始專案**由 [gonsakon](https://github.com/gonsakon) 創建，也採用 MIT 許可證。  
本專案在此基礎上進行改進和擴展。

---

## 🤝 反饋與建議

如有任何問題或改進建議，歡迎聯繫作者。

---

**最後更新**: 2026 年 5 月 27 日  
**應用版本**: 1.0.0
**開發者**: Jing ( RoseMary93 )