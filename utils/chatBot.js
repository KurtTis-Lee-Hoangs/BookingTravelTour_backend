import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import dotenv from "dotenv";
import axios from "axios";
import Tour from "../models/Tour.js";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined in .env file");
}

const cityList = [
  "Hà Nội", "Hồ Chí Minh", "Sài Gòn", "Đà Nẵng", "Đà Lạt", "Nha Trang", "Huế", "Hội An",
  "Vũng Tàu", "Phú Quốc", "Cần Thơ", "Buôn Ma Thuột", "Pleiku", "Quy Nhơn", "Ninh Bình",
  "Sapa", "Hạ Long", "Trung Quốc", "Thái Lan", "Hàn Quốc", "Nhật", "Singapore", "Malaysia"
];


export const getKeywordsFromQuery = async (input) => {
  try {
    const prompt = `
      Bạn là trợ lý chatbot du lịch. Người dùng nhập: "${input}".
      Hãy phân tích và trả về object JSON chứa các trường nếu có: "city", "title", "day", "price".
      Nếu không có giá trị thì để null.
      Ví dụ: { "city": "Trung Quốc", "title": "Du Lịch", "day": 3, "price": null }
    `;

    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      },
      {
        params: {
          key: apiKey,
        },
      }
    );

    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Không nhận được phản hồi văn bản từ Gemini.");
    }

    const jsonMatch = text.match(/{[\s\S]*}/);
    if (!jsonMatch) throw new Error("Không tách được JSON.");

    const result = JSON.parse(jsonMatch[0]);
    if (!result.city && input) {
      for (const city of cityList) {
        if (input.toLowerCase().includes(city.toLowerCase())) {
          result.city = city;
          break;
        }
      }
    }

    return result;
  } catch (error) {
    console.error("Gemini error:", error.response?.data || error.message);
    return null;
  }
};

export const getTourByKeywords = async (req, res) => {
  const { query } = req.body;

  if (!query)
    return res.status(400).json({ message: "Thiếu query từ người dùng." });

  const keywords = await getKeywordsFromQuery(query);

  if (!keywords)
    return res.status(500).json({ message: "Phân tích truy vấn thất bại." });
  const searchCriteria = {
    isDelete: false,
  };

  if (keywords.city)
    searchCriteria.city = { $regex: keywords.city, $options: "i" };
  if (keywords.title)
    searchCriteria.title = { $regex: keywords.title, $options: "i" };
  if (keywords.day) searchCriteria.day = { $eq: parseInt(keywords.day) };
  if (keywords.price) { 
    const targetPrice = parseInt(keywords.price);
    const range = 1100000;
    searchCriteria.price = {
      $gte: targetPrice - range,
      $lte: targetPrice + range,
    };
  }

  try {
    const tours = await Tour.find(searchCriteria).limit(5);
    res.json({ length: tours.length, keywords, tours });
  } catch (err) {
    console.error("Search error:", err.message);
    res.status(500).json({ message: "Lỗi khi tìm kiếm tour." });
  }
};
