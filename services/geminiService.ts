
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getHorrorMessage = async (custardsFound: number, total: number) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The player just found custard ${custardsFound} out of ${total} in a dark, foggy forest. Give me a very short, creepy 1-sentence message to display on the screen. Mention "Tinky Winky" or his haunting purple silhouette stalking them.`,
      config: {
        // Fix: When setting maxOutputTokens, thinkingBudget must also be set to ensure output is not blocked by thinking tokens.
        maxOutputTokens: 50,
        thinkingConfig: { thinkingBudget: 25 },
        temperature: 0.9,
      }
    });
    return response.text || "Tinky Winky is getting closer...";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The purple nightmare watches...";
  }
};
