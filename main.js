const { GoogleGenAI } = require("@google/genai");
require('dotenv').config();
const ai = new GoogleGenAI(process.env.GOOGLE_API_KEY);

async function main() {
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: "What is 2+2? in simple words",
    });
    console.log(response.text);
}

main();