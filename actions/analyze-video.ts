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
          `Task: Analyze the content of a video review to determine if it complies with strict community guidelines. The video must not contain any of the following:

    Vulgar Language: Offensive or crude language, including profanity or obscenities.
    Hate Speech or Discrimination: Comments that promote hate or violence based on race, ethnicity, gender, religion, sexual orientation, or disability.
    Illegal Activities: Promotion, depiction, or endorsement of illegal activities, including drugs, violence, theft, hacking, or fraud.
    Sexually Explicit Content: Any form of sexual content, nudity, or sexually suggestive material.
    Bullying or Harassment: Direct or indirect attacks on individuals, including threats, personal insults, or attempts to intimidate others.
    Misinformation: False or misleading claims, especially those related to health, safety, or any topic that can cause harm to others.
    Promoting Dangerous Behavior: Encouragement of dangerous activities such as self-harm, violence, reckless driving, or unsafe stunts.
    Arrogance, Rudeness, or Aggressive Tone: Displays of excessive arrogance, rudeness, or a hostile attitude that could negatively affect others.
    Malicious Content: Videos containing malware, spyware, or attempts to defraud viewers.
    Spam or Advertising: Content that is purely promotional or used to deceive viewers into buying products/services without proper context or permission.

    Response:

    If the video contains any of the above prohibited content, return the following response: 'This video has not been published because it violates our strict community guidelines.'

    If the video is appropriate and complies with the guidelines, return the following response: 'This video is good and complies with our strict community guidelines.'`,
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
