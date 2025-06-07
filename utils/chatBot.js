import dotenv from "dotenv";
import axios from "axios";
import Tour from "../models/Tour.js";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined in .env file");
}

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

// Hàm này dùng để phân tích ý định và trích xuất từ khóa
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
      4. Số ngày (day) phải là số nguyên.
      5. Giá (price) phải là số nguyên (VNĐ).
      6. Chỉ trả về object JSON. Không có text nào khác ngoài JSON.

      Lịch sử trò chuyện:
      ---
      ${history.map(turn => {
        // Đảm bảo chỉ lấy text từ parts đầu tiên nếu có
        const textPart = turn.parts?.find(p => p.text)?.text || '';
        return `${turn.role === "user" ? "User" : "Bot"}: ${textPart}`;
      }).join("\n")}
      ---
      Tin nhắn mới nhất: "${query}"
      ---
      Chỉ trả về object JSON.
    `;

    // Gemini 2.5 Flash hỗ trợ Multi-turn conversations,
    // nên bạn có thể gửi history trực tiếp thay vì ghép vào prompt.
    // Tuy nhiên, nếu bạn muốn AI phân tích intent dựa trên prompt cố định,
    // giữ nguyên cách này cũng được.
    // Đối với mô hình này, việc gửi cả history và prompt có thể làm tăng token count.
    // Tùy chọn 1: Gửi history và user query riêng biệt
    const contents = [
      ...history.map(msg => ({ role: msg.role, parts: msg.parts })), // Đảm bảo cấu trúc parts
      { role: "user", parts: [{ text: prompt }] } // Prompt là user message cuối cùng
    ];

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        contents: contents, // Sử dụng contents đã chuẩn bị
        generationConfig: { responseMimeType: "application/json" },
        // stream: false // Mặc định là false, nhưng có thể thêm vào cho rõ ràng
      },
      { params: { key: apiKey } }
    );

    const rawResponseText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log("Raw AI Response Text:", rawResponseText);

    // Xử lý trường hợp Gemini trả về text không phải JSON hoặc JSON bị bọc trong markdown
    let analysisResult;
    try {
      if (rawResponseText.startsWith('```json') && rawResponseText.endsWith('```')) {
        analysisResult = JSON.parse(rawResponseText.substring(7, rawResponseText.length - 3));
      } else {
        analysisResult = JSON.parse(rawResponseText);
      }
    } catch (parseError) {
      console.error("Lỗi khi parse JSON từ AI:", parseError.message);
      // Fallback nếu không parse được JSON
      return { intent: 'GENERAL', keywords: null };
    }

    console.log("AI Analysis Result:", analysisResult);
    return analysisResult;
  } catch (error) {
    console.error("Lỗi khi phân tích AI:", error.response?.data || error.message);
    return { intent: 'GENERAL', keywords: null };
  }
};


export const getTourByKeywords = async (keywords, res) => {
  try {
    const searchCriteria = { isDelete: false };

    if (keywords.cities && keywords.cities.length > 0) {
      // Dùng $in để tìm các tour có thành phố NẰM TRONG danh sách các thành phố đã chuẩn hóa
      // Hoặc nếu bạn muốn tìm bất kỳ tour nào chứa MỘT TRONG CÁC thành phố
      searchCriteria.city = { $in: keywords.cities.map(city => new RegExp(city, 'i')) };
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

    const tours = await Tour.find(searchCriteria).limit(5); // Giới hạn 5 tour
    
    // Không trả về res.json trực tiếp ở đây, mà trả về object để handleChatRequest xử lý
    return { tours: tours };

  } catch (err) {
    console.error("Search error:", err.message);
    // Trả về một object lỗi để handleChatRequest xử lý
    throw new Error("Lỗi khi tìm kiếm tour.");
  }
};

export const analyzeImageAndGetResponse = async (image, query) => {
  try {
    const model = "gemini-2.5-flash-preview-05-20";

    const promptText = `
      Bạn là một trợ lý du lịch và chuyên gia địa lý. Hãy phân tích hình ảnh được cung cấp.
      1. Nhận diện địa danh, thành phố, hoặc quốc gia trong ảnh.
      2. Nếu trong ảnh có món ăn, hãy cho biết tên món ăn và nó là đặc sản ở đâu.
      3. Nếu người dùng có câu hỏi kèm theo ("${query}"), hãy trả lời dựa trên nội dung ảnh và câu hỏi. Nếu không có câu hỏi kèm theo hoặc câu hỏi không liên quan đến ảnh, không cần mô tả ảnh quá chi tiết mà hãy trả lời ngắn gọn về nội dung ảnh.
      4. Bỏ các tiêu đề 1. 2. Mô tả ngắn gọn, xúc tích. Nếu không có món ăn thì không cần đề cập đến món ăn.
      5. Nếu không thể nhận diện được hoặc không chắc chắn, hãy nói rõ "Rất tiếc, tôi không thể nhận diện được địa điểm trong ảnh này."
      6. Toàn bộ câu trả lời phải bằng tiếng Việt.
    `;

    const requestPayload = {
      contents: [
        {
          parts: [
            { text: promptText },
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
        // Thêm timeout để tránh request bị treo quá lâu
        timeout: 30000 // 30 giây
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
      error.response?.data?.error?.message || error.message
    );
    // Trả về thông báo lỗi cụ thể hơn nếu có
    let errorMessage = "Đã có lỗi xảy ra khi phân tích hình ảnh của bạn.";
    if (error.response?.data?.error?.message.includes("400")) {
        errorMessage = "Ảnh quá lớn hoặc định dạng không hợp lệ. Vui lòng thử ảnh khác.";
    }
    return errorMessage;
  }
};

export const getGeneralAiResponse = async (history, query) => {
  try {
    const model = "gemini-2.5-flash-preview-05-20";

    const conversationHistory = [
      // Lọc bỏ 'error' prop và đảm bảo chỉ có 'role' và 'parts'
      ...history.map(msg => ({ role: msg.role, parts: msg.parts })),
      { role: "user", parts: [{ text: query }] },
    ];

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        contents: conversationHistory,
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
    console.error("Lỗi khi lấy câu trả lời chung:", error.response?.data || error.message);
    return "Hệ thống AI đang gặp sự cố, vui lòng thử lại sau.";
  }
};

export const handleChatRequest = async (req, res) => {
  const { history, query, image } = req.body;

  try {
    // Luồng 1: Xử lý ảnh
    if (image && image.data) {
      console.log("-> Luồng: Xử lý hình ảnh");
      // query có thể rỗng khi chỉ gửi ảnh
      const descriptionText = await analyzeImageAndGetResponse(image, query || '');
      return res.json({ text: descriptionText });
    }

    // Nếu không có ảnh, query phải có
    if (!query) {
      return res.status(400).json({ message: "Thiếu query từ người dùng." });
    }

    // Luồng 2 & 3: Gọi hàm phân tích AI "All-in-One" duy nhất
    // Đảm bảo history được truyền đúng định dạng
    const filteredHistory = history.map(msg => ({ role: msg.role, parts: msg.parts }));
    const analysis = await getAiAnalysis(filteredHistory, query);

    if (analysis.intent === 'TOUR' && analysis.keywords) {
      console.log("-> Luồng: Xử lý Tour");

      const keywordsFromAI = analysis.keywords;
      let normalizedCities = [];

      if (keywordsFromAI.cities && Array.isArray(keywordsFromAI.cities)) {
        const citySet = new Set();
        keywordsFromAI.cities.forEach(cityFromAI => {
          const canonicalName = findCanonicalCity(cityFromAI);
          if (canonicalName) {
            citySet.add(canonicalName);
          }
        });
        normalizedCities = [...citySet];
      }
      
      const normalizedKeywords = {
        ...keywordsFromAI,
        cities: normalizedCities,
      };
      
      console.log("Keywords đã chuẩn hóa để tìm kiếm:", normalizedKeywords);

      // Gọi hàm tìm kiếm và nhận về kết quả tours
      const tourResult = await getTourByKeywords(normalizedKeywords); // Không truyền res trực tiếp
      return res.json({ tours: tourResult.tours }); // Trả về tours
    } else {
      console.log("-> Luồng: Xử lý câu hỏi chung");
      const generalText = await getGeneralAiResponse(filteredHistory, query);
      return res.json({ text: generalText });
    }
  } catch (err) {
    console.error("Lỗi trong handleChatRequest:", err);
    return res.status(500).json({ message: err.message || "Đã xảy ra lỗi không xác định." });
  }
};