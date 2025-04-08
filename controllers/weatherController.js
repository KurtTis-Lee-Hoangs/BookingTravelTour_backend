import axios from "axios";

export const weatherAPI = async (req, res) => {
  const { city, district } = req.query; // Nhận thành phố và quận từ query string
  if (!city) {
    return res.status(400).json({ error: "City is required" });
  }
  try {
    // Nếu có district, kết hợp district và city vào tên đầy đủ cho việc truy vấn
    const location = district ? `${district},${city}` : city;
    // Gọi API OpenWeatherMap
    const response = await axios.get(process.env.BASE_WEATHER_URL, {
      params: {
        q: location, // Sử dụng tên location đã kết hợp
        appid: process.env.API_WEATHER_KEY,
        units: "metric", // Đơn vị: Celsius
        cnt: 21, // Lấy thông tin thời tiết trong 7 ngày
      },
    });
    // Lọc và trả về dữ liệu thời tiết trong tuần
    const weeklyWeather = response.data.list.map((item) => ({
      date: item.dt_txt,
      temperature: item.main.temp,
      weather: item.weather[0].description,
    }));
    res.json({
      city: response.data.city.name,
      country: response.data.city.country,
      weeklyWeather,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
