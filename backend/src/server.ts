import express from 'express';
import { Ollama } from 'ollama';
import fs from 'fs';
import path from 'path';

const app = express();

// Increased JSON limit to handle large, high-res base64 screen streams from the UI
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Initialize the Ollama instance
const ollama = new Ollama();
const DB_FILE = path.resolve('database.json');

// System persona instruction rule block
const systemPrompt = { 
    role: "system", 
    content: "You are an expert Senior Software Engineer and coding tutor named RASIEL. Help the user learn programming concepts, debug errors, and write clean algorithms. Provide clear code examples and explain them step-by-step in a professional, concise tone. Do not use emojis." 
};

// Memory loader wrapper
function loadMemory(): any[] {
    if (fs.existsSync(DB_FILE)) {
        try {
            const data = fs.readFileSync(DB_FILE, 'utf-8');
            const parsedData = JSON.parse(data);
            if (Array.isArray(parsedData) && parsedData.length > 0) return parsedData;
        } catch (error) { 
            console.error("Corrupted memory instance encountered. Spinning up a fresh session."); 
        }
    }
    return [systemPrompt];
}

// Memory persistence writer
function saveMemory(history: any[]): void {
    fs.writeFileSync(DB_FILE, JSON.stringify(history, null, 2));
}

// Unified API processing endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        const chatHistory = loadMemory();
        
        // 1. Structural blueprint construction for user chat message packets
        const newMessage: any = { role: 'user', content: userMessage };
        
        // 2. Decode stream segment arrays if screen telemetry images exist
        if (req.body.image) {
            // Strip the base64 meta tag prefix so the vision library processes standard data strings
            const base64Image = req.body.image.replace(/^data:image\/\w+;base64,/, "");
            newMessage.images = [base64Image];
        }
        
        chatHistory.push(newMessage);

        // 3. Process instructions through the vision AI weights engine
        const response = await ollama.chat({
            model: 'llama3.2-vision', 
            messages: chatHistory
        });

        // 4. Save interactions locally back into DB store
        chatHistory.push(response.message);
        saveMemory(chatHistory);
        
        res.json({ reply: response.message.content });
    } catch (error: any) {
        console.error("❌ AI Core Runtime Failure Error:", error.message);
        res.status(500).json({ 
            error: "Internal Engine Connection Error. Ensure your system engine service is up and active. Check your terminal execution status for: 'ollama pull llama3.2-vision'" 
        });
    }
});

// Port binding allocation execution loop
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 RASIEL Engine Server up and streaming cleanly at http://localhost:${PORT}`);
});