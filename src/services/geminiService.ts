import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export interface Message {
  role: "user" | "model";
  text: string;
  timestamp: number;
}

export async function* sendMessageStream(prompt: string, history: Message[]) {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: "You are a helpful, friendly, and concise AI assistant. You provide clear and accurate information.",
    },
    // Map history to the format expected by the SDK
    history: history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }))
  });

  const result = await chat.sendMessageStream({ message: prompt });
  
  for await (const chunk of result) {
    const response = chunk as GenerateContentResponse;
    yield response.text || "";
  }
}
