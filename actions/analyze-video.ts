"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure you have set the GOOGLE_AI_API_KEY in your environment variables
const API_KEY = process.env.GOOGLE_AI_API_KEY!;
const genAI = new GoogleGenerativeAI(API_KEY);

export async function analyzeMedia(
  mediaType: "photo" | "video",
  mediaData: string
) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    if (mediaType === "photo") {
      const result = await model.generateContent([
        {
          inlineData: {
            data: mediaData,
            mimeType: "image/jpeg",
          },
        },
        "Describe this image in detail.",
      ]);
      return result.response.text();
    } else if (mediaType === "video") {
      // For video analysis, we'll extract frames and analyze them
      try {
        const result = await model.generateContent([
          {
            inlineData: {
              data: mediaData,
              mimeType: "video/webm",
            },
          },
          "Analyze this video content and describe what you see. Focus on the main actions and events.",
        ]);
        return result.response.text();
      } catch (videoError) {
        console.error("Error analyzing video:", videoError);
        return "Video analysis is currently not supported. Please try with an image instead.";
      }
    }

    throw new Error("Invalid media type");
  } catch (error) {
    console.error("Error analyzing media:", error);
    if (error instanceof Error) {
      return `Failed to analyze the media: ${error.message}`;
    }
    return "Failed to analyze the media.";
  }
}
