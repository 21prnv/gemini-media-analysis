"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure you have set the GOOGLE_AI_API_KEY in your environment variables
const API_KEY = process.env.GOOGLE_AI_API_KEY!;

const genAI = new GoogleGenerativeAI(API_KEY);

export async function analyzeImage(imageBase64: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-pro" });

    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType: "image/jpeg",
        },
      },
      "Describe this image in detail.",
    ]);

    return result.response.text();
  } catch (error) {
    console.error("Error analyzing image:", error);
    return "Failed to analyze the image.";
  }
}
