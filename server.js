const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// তোমার API Key
const genAI = new GoogleGenerativeAI("AIzaSyDwvU2mry9Jr3oXg5aipN-fRv3ZftXlE7w");

// 1. Crop Prediction Route (Text-only: Using gemini-pro for better stability)
app.post('/api/predict-crop', async (req, res) => {
    try {
        console.log("🌱 Crop Prediction Request:", req.body);
        const { soilType, phLevel, humidity, temperature } = req.body;
        
        // টেক্সটের জন্য gemini-pro মডেলটি বেশি স্টেবল
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
  Act as a super friendly and expert agricultural assistant named "CropMate" 🌾.
  
  Based on the following soil data, recommend the best crop to grow:
  - Soil Type: ${soilType}
  - pH Level: ${phLevel}
  - Humidity: ${humidity}%
  - Temperature: ${temperature}°C

  Please provide the response in a **cute, structured, and detailed format** using emojis! 🌸
  
  Follow this structure:
  1. 🏆 **Best Crop Choice:** [Name of the crop]
  2. 🧐 **Why this crop?** [Explain simply why it fits this soil/weather]
  3. 🚜 **Farming Tips:** [Give 3 bullet points on watering, fertilizer, and care]
  4. 🌟 **Fun Fact:** [A short interesting fact about this crop]
  
  Keep the tone encouraging and happy! ✨
`;



        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean markdown if present
        text = text.replace(/```json|```/g, '').trim();
        
        console.log("✅ Gemini Response:", text);
        res.json({ prediction: text });

    } catch (error) {
        console.error("❌ Prediction Error:", error);
        res.status(500).json({ error: "Failed to fetch prediction. Check server console." });
    }
});
// server.js এর উপরের দিকে বা মাঝখানে কোথাও এটা বসাও
app.get('/', (req, res) => {
    res.send("🌾 Crop Mate Server is Running! 🚀");
});

// 2. Disease Detection Route (Multimodal: Using gemini-1.5-flash)
app.post('/api/detect-disease', upload.single('image'), async (req, res) => {
    try {
        console.log("🍂 Disease Detection Request");
        if (!req.file) return res.status(400).json({ error: "No image uploaded" });

        // ইমেজের জন্য 1.5-flash বা gemini-pro-vision ব্যবহার করতে হবে
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        
        const imagePart = {
            inlineData: {
                data: req.file.buffer.toString('base64'),
                mimeType: req.file.mimetype,
            },
        };

        const prompt = `
  Act as a caring "Plant Doctor" 🩺🌿. Identify the disease from the image.
  
  If the plant is healthy, say "Your plant looks happy and healthy! 🎉".
  If there is a disease, provide a detailed and cute report:

  1. 🦠 **Disease Name:** [Name of the disease]
  2. 🤒 **Symptoms:** [What does the plant look like?]
  3. 💊 **Cure & Treatment:** [2-3 easy steps to fix it]
  4. 🛡️ **Prevention:** [How to stop it from happening again]

  Use emojis like 🍂, 💧, 🌞 to make it look nice. Avoid complex jargon.
`;

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        console.log("✅ Analysis Complete");
        res.json({ analysis: text });

    } catch (error) {
        console.error("❌ Disease Error:", error);
        res.status(500).json({ error: "Failed to analyze image. Check server console." });
    }
});

const PORT = 5004;

// লোকাল কম্পিউটারে চালানোর জন্য এটা থাকবে

    app.listen(PORT, () => {
        console.log(`🚀 Server running locally on port ${PORT}`);
    });


// Vercel এর জন্য এটা জরুরি
module.exports = app;