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

// Đặt ở đầu file controller của bạn
const cityList = [
  { name: "Thailand", aliases: ["thailand", "thái", "thái lan"] },
  { name: "China", aliases: ["china", "trung", "trung quốc"] },
  { name: "Hàn Quốc", aliases: ["korea", "corea", "hàn"] },
  { name: "Nhật Bản", aliases: ["japan", "nhật"] },
  { name: "Đà Nẵng", aliases: ["da nang"] },
  { name: "Hà Nội", aliases: ["ha noi"] },
  { name: "Malaysia", aliases: ["malay", "malai"] },
  { name: "Singapore", aliases: ["sing"] },
  { name: "Indonesia", aliases: ["indo"] },
  { name: "Hồ Chí Minh", aliases: ["hcm"] },
  { name: "Huế", aliases: ["hue"] },
];

const findCanonicalCity = (text) => {
  if (!text) return null;
  const lowerText = text.toLowerCase();
  for (const city of cityList) {
    if (lowerText.includes(city.name.toLowerCase())) {
      return city.name;
    }
    for (const alias of city.aliases) {
      if (lowerText.includes(alias)) {
        return city.name;
      }
    }
  }
  return null;
};

export const getAiAnalysis = async (history, query) => {
  try {
    const model = "gemini-2.5-flash-preview-05-20";
    const prompt = `
      Bạn là AI xử lý ngôn ngữ cho chatbot du lịch. Phân tích tin nhắn người dùng và trả về một object JSON DUY NHẤT có cấu trúc:
      {
        "intent": "TOUR" | "GENERAL",
        "keywords": { "cities": string[]|null, "day": number|null, "price": number|null } | null
      }

      QUY TẮC:
      1. 'intent' là "TOUR" nếu người dùng hỏi về tour du lịch. Nếu không, 'intent' là "GENERAL".
      2. Nếu 'intent' là "TOUR", trích xuất 'keywords' (cities là một mảng).
      3. Nếu 'intent' là "GENERAL", 'keywords' PHẢI là null.

      Lịch sử trò chuyện:
      ---
      ${history.map(turn => `${turn.role === "user" ? "User" : "Bot"}: ${turn.parts[0].text}`).join("\n")}
      ---
      Tin nhắn mới nhất: "${query}"
      ---
      Chỉ trả về object JSON.
    `;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      },
      { params: { key: apiKey } }
    );
    
    const analysisResult = JSON.parse(response.data.candidates?.[0]?.content?.parts?.[0]?.text);
    console.log("AI Analysis Result:", analysisResult);
    return analysisResult;
  } catch (error) {
    console.error("Lỗi khi phân tích AI:", error.message);
    return { intent: 'GENERAL', keywords: null };
  }
};

export const getTourByKeywords = async (keywords, res) => {
  try {
    const searchCriteria = { isDelete: false };

    // Logic này giờ sẽ hoạt động trên mảng cities đã được chuẩn hóa
    if (keywords.cities && keywords.cities.length > 0) {
      const cityRegex = new RegExp(`^${keywords.cities.map(city => `(?=.*${city})`).join('')}.*$`, 'i');
      searchCriteria.city = cityRegex;
    }
    if (keywords.day) {
      searchCriteria.day = { $eq: parseInt(keywords.day) };
    }
    if (keywords.price) {
      const targetPrice = parseInt(keywords.price);
      const range = 1100000;
      searchCriteria.price = {
        $gte: targetPrice - range,
        $lte: targetPrice + range,
      };
    }

    const tours = await Tour.find(searchCriteria).limit(5);
    
    let responseText = `🔍 Tìm thấy ${tours.length} tour phù hợp.\n`;
    if (tours.length > 0) {
      responseText += tours.map(
        (tour, idx) => `\n${idx + 1}. 🧭 *${tour.title}* - 📍 ${tour.city} - 💵 ${tour.price.toLocaleString()} VNĐ`
      ).join("\n");
    }
    return res.json({ text: responseText });

  } catch (err) {
    console.error("Search error:", err.message);
    return res.status(500).json({ message: "Lỗi khi tìm kiếm tour." });
  }
};

export const analyzeImageAndGetResponse = async (image, query) => {
  try {
    const model = "gemini-2.5-flash-preview-05-20";

    const prompt = `
      Bạn là một trợ lý du lịch và chuyên gia địa lý. Hãy phân tích hình ảnh được cung cấp.
      1.  Nhận diện địa danh, thành phố, hoặc quốc gia trong ảnh.
      2.  Nếu trong ảnh có món ăn, hãy cho biết tên món ăn và nó là đặc sản ở đâu.
      3.  Nếu người dùng có câu hỏi kèm theo ("${query}"), hãy trả lời dựa trên nội dung ảnh. Nếu không có, không cần mô tả ảnh.
      4.  Bỏ các tiêu đề 1. 2. Mô tả ngắn gọn, xúc tích. Nếu không có món ăn thì không cần đề cập đến món ăn.
      5.  Nếu không thể nhận diện được hoặc không chắc chắn, hãy nói rõ "Rất tiếc, tôi không thể nhận diện được địa điểm trong ảnh này."
      6.  Toàn bộ câu trả lời phải bằng tiếng Việt.
    `;

    // Cấu trúc payload cho Gemini Vision
    const requestPayload = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: image.mime_type,
                data: image.data,
              },
            },
          ],
        },
      ],
    };

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      requestPayload,
      {
        params: { key: apiKey },
      }
    );

    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Không nhận được phản hồi từ Gemini Vision.");
    }
    return text;
  } catch (error) {
    console.error(
      "Lỗi khi gọi Gemini Vision API:",
      error.response?.data?.error || error.message
    );
    return "Đã có lỗi xảy ra khi phân tích hình ảnh của bạn.";
  }
};

export const getGeneralAiResponse = async (history, query) => {
  try {
    const model = "gemini-2.5-flash-preview-05-20";

    // Ghép nối lịch sử và câu hỏi mới để tạo ngữ cảnh hoàn chỉnh
    const conversationHistory = [
      ...history,
      { role: "user", parts: [{ text: query }] },
    ];

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        // Gửi toàn bộ lịch sử để có câu trả lời theo ngữ cảnh
        contents: conversationHistory,
        // Thêm một chỉ dẫn hệ thống (tùy chọn nhưng nên có)
        systemInstruction: {
          parts: [
            {
              text: "Bạn là một trợ lý AI thân thiện và hữu ích tên là TravelBot. Hãy trả lời người dùng một cách tự nhiên và ngắn gọn bằng tiếng Việt.",
            },
          ],
        },
      },
      { params: { key: apiKey } }
    );

    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return "Xin lỗi, tôi chưa nghĩ ra câu trả lời. Bạn có thể hỏi khác được không?";
    }
    return text;
  } catch (error) {
    console.error("Lỗi khi lấy câu trả lời chung:", error.message);
    return "Hệ thống AI đang gặp sự cố, vui lòng thử lại sau.";
  }
};

export const handleChatRequest = async (req, res) => {
  const { history, query, image } = req.body;

  // Luồng 1: Xử lý ảnh (không đổi)
  if (image && image.data) {
    console.log("-> Luồng: Xử lý hình ảnh");
    const descriptionText = await analyzeImageAndGetResponse(image, query);
    return res.json({ text: descriptionText });
  }

  if (!query) {
    return res.status(400).json({ message: "Thiếu query từ người dùng." });
  }

  // Luồng 2 & 3: Gọi hàm phân tích AI "All-in-One" duy nhất
  const analysis = await getAiAnalysis(history, query);

  if (analysis.intent === 'TOUR' && analysis.keywords) {
    console.log("-> Luồng: Xử lý Tour");

    // ===== BƯỚC CHUẨN HÓA DỮ LIỆU (ĐẶT TẠI ĐÂY) =====
    const keywordsFromAI = analysis.keywords;
    let normalizedCities = [];

    if (keywordsFromAI.cities && Array.isArray(keywordsFromAI.cities)) {
      const citySet = new Set();
      keywordsFromAI.cities.forEach(cityFromAI => {
        const canonicalName = findCanonicalCity(cityFromAI); // Sử dụng hàm trợ giúp
        if (canonicalName) {
          citySet.add(canonicalName);
        }
      });
      normalizedCities = [...citySet];
    }
    
    // Tạo một object keywords mới đã được chuẩn hóa để truyền đi
    const normalizedKeywords = {
      ...keywordsFromAI, // Copy các key khác như day, price
      cities: normalizedCities, // Ghi đè bằng mảng đã chuẩn hóa
    };
    
    console.log("Keywords đã chuẩn hóa để tìm kiếm:", normalizedKeywords);

    // Gọi hàm tìm kiếm với dữ liệu đã được làm sạch
    return getTourByKeywords(normalizedKeywords, res);
  } else {
    // Luồng GENERAL (không đổi)
    console.log("-> Luồng: Xử lý câu hỏi chung");
    const generalText = await getGeneralAiResponse(history, query);
    return res.json({ text: generalText });
  }
};
