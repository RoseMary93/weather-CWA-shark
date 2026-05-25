const result = require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// CWA API 設定
const CWA_API_BASE_URL = "https://opendata.cwa.gov.tw/api";
const CWA_API_KEY = process.env.CWA_API_KEY;

// 縣市名稱對照表
const CITY_MAPPING = {
  taipei: "臺北市",
  newtaipei: "新北市",
  keelung: "基隆市",
  taoyuan: "桃園市",
  hsinchu_city: "新竹市",
  hsinchu_county: "新竹縣",
  miaoli: "苗栗縣",
  taichung: "臺中市",
  changhua: "彰化縣",
  nantou: "南投縣",
  yunlin: "雲林縣",
  chiayi_city: "嘉義市",
  chiayi_county: "嘉義縣",
  tainan: "臺南市",
  kaohsiung: "高雄市",
  pingtung: "屏東縣",
  yilan: "宜蘭縣",
  hualien: "花蓮縣",
  taitung: "臺東縣",
  penghu: "澎湖縣",
  kinmen: "金門縣",
  lienchiang: "連江縣",
};

// 縣市對應的 CWA Dataset ID (鄉鎮級別預報)
const CITY_DATASET_MAPPING = {
  taipei: "F-D0047-061",
  newtaipei: "F-D0047-069",
  keelung: "F-D0047-049",
  taoyuan: "F-D0047-005",
  hsinchu_city: "F-D0047-053",
  hsinchu_county: "F-D0047-009",
  miaoli: "F-D0047-013",
  taichung: "F-D0047-073",
  changhua: "F-D0047-017",
  nantou: "F-D0047-021",
  yunlin: "F-D0047-025",
  chiayi_city: "F-D0047-057",
  chiayi_county: "F-D0047-089",
  tainan: "F-D0047-077",
  kaohsiung: "F-D0047-065",
  pingtung: "F-D0047-029",
  yilan: "F-D0047-001",
  hualien: "F-D0047-037",
  taitung: "F-D0047-033",
  penghu: "F-D0047-041",
  kinmen: "F-D0047-085",
  lienchiang: "F-D0047-081",
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * 取得指定縣市/鄉鎮天氣預報（短期）
 */
const getWeather = async (req, res) => {
  try {
    const cityKey = req.params.city;
    const townName = req.query.town;
    const cityName = CITY_MAPPING[cityKey];

    if (!cityName) {
      return res.status(400).json({ error: "參數錯誤", message: "無效的縣市代碼" });
    }

    if (!CWA_API_KEY) {
      return res.status(500).json({ error: "伺服器設定錯誤", message: "請設定 CWA_API_KEY" });
    }

    // --- 若無指定鄉鎮，採用縣市級預報 (F-C0032-001) ---
    if (!townName) {
      const response = await axios.get(`${CWA_API_BASE_URL}/v1/rest/datastore/F-C0032-001`, {
        params: { Authorization: CWA_API_KEY, locationName: cityName }
      });

      const locationData = response.data.records.location[0];
      const weatherData = {
        city: cityName, town: "", cityKey: cityKey,
        updateTime: response.data.records.datasetDescription,
        forecasts: []
      };

      const weatherElements = locationData.weatherElement;
      const timeCount = weatherElements[0].time.length;

      for (let i = 0; i < timeCount; i++) {
        const forecast = {
          startTime: weatherElements[0].time[i].startTime,
          endTime: weatherElements[0].time[i].endTime,
          weather: "未知",
          rain: "0%", minTemp: "", maxTemp: "", comfort: "", windSpeed: ""
        };

        weatherElements.forEach(el => {
          const val = el.time[i].parameter.parameterName;
          switch (el.elementName) {
            case "Wx": forecast.weather = val; break;
            case "PoP": forecast.rain = val + "%"; break;
            case "MinT": forecast.minTemp = val + "°C"; break;
            case "MaxT": forecast.maxTemp = val + "°C"; break;
          }
        });
        weatherData.forecasts.push(forecast);
      }

      // 🌟 在終端機顯示載入的區域 (縣市級備援)
      const source = req.query.source ? `[${req.query.source.toUpperCase()}] ` : '[GET] ';
      console.log(`${source}${cityName} - 載入成功`);

      return res.json({ success: true, data: weatherData });
    }

    // --- 鄉鎮級別預報 ---
    const datasetId = CITY_DATASET_MAPPING[cityKey] || "F-D0047-093";
    const response = await axios.get(`${CWA_API_BASE_URL}/v1/rest/datastore/${datasetId}`, {
      params: { Authorization: CWA_API_KEY, locationName: townName }
    });

    if (!response.data || !response.data.records || !response.data.records.Locations || response.data.records.Locations.length === 0) {
      throw new Error("CWA API 回傳結構異常");
    }

    const locations = response.data.records.Locations[0].Location;
    let locationData = locations.find(l => l.LocationName === townName);

    if (!locationData) {
      // 找不到鄉鎮，降級採縣市預報 (遞迴)
      req.query.town = undefined;
      return getWeather(req, res);
    }

    const weatherData = {
      city: cityName, town: locationData.LocationName, cityKey: cityKey,
      updateTime: response.data.records.datasetDescription, forecasts: [],
    };

    const weatherElements = locationData.WeatherElement || [];
    const timeMap = {};

    // 1. 先收集所有時間點，建立精細的時間刻度
    weatherElements.forEach(el => {
      (el.Time || []).forEach(t => {
        const s = t.StartTime || t.DataTime;
        if (!timeMap[s]) {
          timeMap[s] = {
            startTime: s,
            endTime: t.EndTime || s,
            weather: "未知",
            rain: "0%"
          };
        }
      });
    });
    const sortedTimes = Object.keys(timeMap).sort();

    // 2. 填充資料並處理範圍分派 (讓 6 小時的降雨機率能套用到每個小時)
    weatherElements.forEach(element => {
      const elementName = element.ElementName;
      (element.Time || []).forEach(t => {
        const start = t.StartTime || t.DataTime;
        const end = t.EndTime || start;
        const elementValue = t.ElementValue && t.ElementValue[0];
        if (!elementValue) return;

        const val = elementValue.value || elementValue.Weather || elementValue.WeatherPhenomenon || elementValue.Temperature || elementValue.MinTemperature || elementValue.MaxTemperature || elementValue.ApparentTemperature || elementValue.ProbabilityOfPrecipitation || elementValue.WindSpeed || "";

        // 🌟 核心：將該值分派到所有落在 [start, end) 區間內的刻度
        sortedTimes.forEach(pt => {
          if (pt >= start && (pt < end || pt === start)) {
            switch (elementName) {
              case "天氣現象":
              case "Wx": timeMap[pt].weather = val; break;
              case "12小時降雨機率":
              case "6小時降雨機率":
              case "PoP": timeMap[pt].rain = (val === "-" ? "0" : val) + "%"; break;
              case "最低溫度":
              case "MinT": timeMap[pt].minTemp = val + "°C"; break;
              case "最高溫度":
              case "MaxT": timeMap[pt].maxTemp = val + "°C"; break;
              case "體感溫度":
              case "體感溫度(最大值)": timeMap[pt].comfort = val + "°C"; break;
              case "風速": timeMap[pt].windSpeed = val + " m/s"; break;
              case "溫度":
              case "T":
                if (!timeMap[pt].maxTemp) timeMap[pt].maxTemp = val + "°C";
                if (!timeMap[pt].minTemp) timeMap[pt].minTemp = val + "°C";
                break;
            }
          }
        });
      });
    });

    weatherData.forecasts = Object.values(timeMap).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    // 🌟 修正 2：若鄉鎮天氣顯示為「未知」，則去抓縣市級天氣狀態作為備援
    if (weatherData.forecasts.some(f => f.weather === "未知")) {
      try {
        const cityRes = await axios.get(`${CWA_API_BASE_URL}/v1/rest/datastore/F-C0032-001`, {
          params: { Authorization: CWA_API_KEY, locationName: cityName }
        });
        const cityLoc = cityRes.data.records.location[0];
        if (cityLoc) {
          const cityWx = cityLoc.weatherElement.find(el => el.elementName === "Wx");
          if (cityWx) {
            weatherData.forecasts.forEach(f => {
              if (f.weather === "未知") {
                // 尋找時間重疊的縣市天氣
                const start = new Date(f.startTime);
                const match = cityWx.time.find(ct => {
                  const cStart = new Date(ct.startTime);
                  const cEnd = new Date(ct.endTime);
                  return start >= cStart && start < cEnd;
                });
                if (match) f.weather = match.parameter.parameterName;
              }
            });
          }
        }
      } catch (err) {
        console.warn("[WARN] 縣市級天氣備援讀取失敗:", err.message);
      }
    }

    // 🌟 在終端機顯示載入的區域
    const source = req.query.source ? `[${req.query.source.toUpperCase()}] ` : '[GET] ';
    console.log(`${source}${cityName}${weatherData.town ? ' / ' + weatherData.town : ''} - 載入成功`);

    res.json({ success: true, data: weatherData });
  } catch (error) {
    console.error("取得天氣資料失敗:", error.message);
    res.status(500).json({ error: "伺服器錯誤", message: "無法取得天氣資料", details: error.message });
  }
};

/**
 * 取得一週天氣預報
 */
const getWeeklyWeather = async (req, res) => {
  try {
    const cityKey = req.params.city;
    const townName = req.query.town;
    const cityName = CITY_MAPPING[cityKey];

    if (!cityName) return res.status(400).json({ error: "無效縣市" });

    const response = await axios.get(`${CWA_API_BASE_URL}/v1/rest/datastore/F-D0047-091`, {
      params: { Authorization: CWA_API_KEY, locationName: townName || cityName }
    });

    const locations = response.data.records.Locations[0].Location;

    // 優先精準匹配 townName，若無則尋找包含 cityName 的區域
    let locationData = townName ? locations.find(l => l.LocationName === townName) : locations.find(l => l.LocationName.includes(cityName));

    // 如果還是找不到，嘗試最模糊匹配縣市名稱的任一區域
    if (!locationData) {
      locationData = locations.find(l => l.LocationName.includes(cityName.substring(0, 2))) || (locations.length > 0 ? locations[0] : null);
    }

    if (!locationData) throw new Error("找不到對應的氣象區域資料");

    const weeklyData = {
      city: cityName,
      town: (locationData.LocationName === cityName || cityName.includes(locationData.LocationName)) ? "" : locationData.LocationName,
      cityKey: cityKey, forecasts: [],
    };

    const weatherElements = locationData.WeatherElement;
    const dailyData = {};

    weatherElements.forEach((element) => {
      const elementName = element.ElementName;
      element.Time.forEach((timeData) => {
        const date = (timeData.StartTime || timeData.DataTime).split("T")[0];
        if (!dailyData[date]) {
          const days = ["日", "一", "二", "三", "四", "五", "六"];
          dailyData[date] = { date, dayOfWeek: days[new Date(date + "T00:00:00").getDay()], weather: "", rainProb: "0%", minTemp: "", maxTemp: "", windSpeed: "" };
        }
        const ev = timeData.ElementValue ? timeData.ElementValue[0] : null;
        if (!ev) return;
        switch (elementName) {
          case "天氣現象": dailyData[date].weather = ev.Weather || ev.WeatherPhenomenon || ev.value || ""; break;
          case "最高溫度": dailyData[date].maxTemp = (ev.MaxTemperature || "") + "°C"; break;
          case "最低溫度": dailyData[date].minTemp = (ev.MinTemperature || "") + "°C"; break;
          case "12小時降雨機率":
            if (ev.ProbabilityOfPrecipitation && ev.ProbabilityOfPrecipitation !== "-") dailyData[date].rainProb = ev.ProbabilityOfPrecipitation + "%";
            break;
        }
      });
    });

    weeklyData.forecasts = Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date));

    // 🌟 在終端機顯示載入的區域 (一週預報)
    const source = req.query.source ? `[${req.query.source.toUpperCase()}] ` : '[WEEKLY] ';
    console.log(`${source}${cityName}${weeklyData.town ? ' / ' + weeklyData.town : ''} - 載入成功`);

    res.json({ success: true, data: weeklyData });
  } catch (error) {
    res.status(500).json({ error: "擷取一週預報失敗" });
  }
};

/**
 * 取得鄉鎮列表
 */
const getTowns = async (req, res) => {
  try {
    const cityKey = req.params.city;
    const datasetId = CITY_DATASET_MAPPING[cityKey];
    if (!datasetId) return res.status(400).json({ error: "無效縣市" });

    const response = await axios.get(`${CWA_API_BASE_URL}/v1/rest/datastore/${datasetId}`, {
      params: { Authorization: CWA_API_KEY }
    });
    const locations = response.data.records.Locations[0].Location;
    res.json({ success: true, towns: locations.map(l => l.LocationName) });
  } catch (error) {
    res.status(500).json({ error: "取得鄉鎮列表失敗" });
  }
};

app.get("/", (req, res) => {
  res.json({
    message: "歡迎使用 CWA 天氣預報 API (支援鄉鎮級別)",
    endpoints: {
      weather: "/api/weather/:city?town=xxx",
      weekly: "/api/weekly/:city?town=xxx",
      towns: "/api/towns/:city",
    },
    example: `http://localhost:${PORT}/api/weather/taipei?town=中正區`,
    supported_cities: Object.keys(CITY_MAPPING),
  });
});

app.get("/api/towns/:city", getTowns);
app.get("/api/weather/:city", getWeather);
app.get("/api/weekly/:city", getWeeklyWeather);

app.listen(PORT, () => {
  console.log(`\n=========================================`);
  console.log(`🚀 CWA 天氣後端伺服器已啟動`);
  console.log(`📍 本地網址: http://localhost:${PORT}`);
  console.log(`🔗 API 範例: http://localhost:${PORT}/api/weather/taipei?town=${encodeURIComponent('中正區')}`);
  console.log(`=========================================\n`);
});