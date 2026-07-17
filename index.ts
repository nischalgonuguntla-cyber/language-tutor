import express from 'express';
import Groq from 'groq-sdk'; 
import fs from 'fs';
import path from 'path';
import 'dotenv/config'; // 👈 Added this to read the .env file

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// The API key is now securely pulled from your hidden .env file!
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY 
});

const DB_FILE = path.resolve('database_v2.json');
//way to talk
const systemPrompt = { 
    role: "system", 
    content: "You are an expert Senior Software Engineer and coding tutor. Help the user learn programming concepts, debug errors, and write clean algorithms. You have a strong focus on Python, data science, and machine learning models. Provide clear code examples and explain them step-by-step in a professional, concise tone. Do not use emojis." 
};

function loadMemory() {
    if (fs.existsSync(DB_FILE)) {
        try {
            const data = fs.readFileSync(DB_FILE, 'utf-8');
            const parsedData = JSON.parse(data);
            if (Array.isArray(parsedData) && parsedData.length > 0) return parsedData;
        } catch (error) { console.error("Corrupted memory, starting fresh."); }
    }
    return [systemPrompt];
}

function saveMemory(history: any[]) {
    fs.writeFileSync(DB_FILE, JSON.stringify(history, null, 2));
}

app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        const chatHistory = loadMemory();
        
        const newMessage: any = { role: 'user', content: userMessage };
        
        chatHistory.push(newMessage);

        // Call the Groq API
        const chatCompletion = await groq.chat.completions.create({ 
            model: 'openai/gpt-oss-20b', 
            messages: chatHistory 
        });

        // Extract the response and save it to memory
        const aiMessage = chatCompletion.choices[0]?.message; 
        
        if (aiMessage) {
            chatHistory.push(aiMessage);
            saveMemory(chatHistory);
            res.json({ reply: aiMessage.content }); 
        } else {
            res.status(500).json({ error: "No response from AI." });
        }

    } catch (error: any) {
        console.error("❌ AI Connection Error:", error.message);
        res.status(500).json({ error: "AI Connection Error: Please check your Groq API key." });
    }
});

app.listen(3000, () => {
    console.log('🚀 AI Coding Tutor running at http://localhost:3000');
});