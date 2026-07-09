import express from 'express';
import { Ollama } from 'ollama';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

const ollama = new Ollama();
const DB_FILE = path.resolve('database.json');

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
        
        if (req.body.image) {
            const base64Image = req.body.image.replace(/^data:image\/\w+;base64,/, "");
            newMessage.images = [base64Image];
        }
        
        chatHistory.push(newMessage);

        const response = await ollama.chat({
            model: 'llava', // ✨ Switched to llava to fix the mllama crash
            messages: chatHistory
        });

        chatHistory.push(response.message);
        saveMemory(chatHistory);
        
        res.json({ reply: response.message.content });
    } catch (error: any) {
        console.error("❌ AI Connection Error:", error.message);
        res.status(500).json({ error: "AI Connection Error: Make sure you ran 'ollama pull llava' in your terminal." });
    }
});

app.listen(3000, () => {
    console.log('🚀 AI Coding Tutor running at http://localhost:3000');
});