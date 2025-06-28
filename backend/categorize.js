// categorize.js
require("dotenv").config(); // Load environment variables from .env
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- Configuration ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in the .env file.");
}
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const categoriesDescription = `
1. Tempo & Meter: Speed, rhythm pace (e.g., "60 bpm", "fast-paced").
2. Era / Time-Period Vibe: Decades, historical references (e.g., "80s", "90s R&B").
3. Core Genre Family: Broad umbrellas (e.g., "rock", "pop", "hip-hop", "jazz", "house").
4. Sub-Genre & Fusion Styles: Specific cross-breeds (e.g., "dream-pop", "latin house").
5. Instrumentation & Sound Sources: Instruments, synths, vocals (e.g., "808 bassline", "electric guitar").
6. Vocal Characteristics: Descriptions of the voice (e.g., "husky female vocals", "yodeling").
7. Mood / Emotion: Adjectives of feeling (e.g., "uplifting", "dark", "melancholic").
8. Production & Mix Aesthetics: Studio effects, audio quality (e.g., "deep reverb", "vinyl crackle").
9. Rhythmic & Structural Traits: Song arrangement, groove (e.g., "syncopated percussion", "anthem chorus").
10. Cultural / Regional Flavor: Places or cultures (e.g., "cumbia colombiana", "turkish rap", "k-pop").
11. Language & Lyrical Context: Explicit languages (e.g., "português", "japanese lyrics").
12. Themes & Imagery: Conceptual words (e.g., "science fiction", "beach", "road trip").
13. Miscellaneous / Meta: Catch-all for prompts, quality, or unclassifiable tags.
`;

const getPrompt = (tagsToCategorize) => `
You are an expert musicologist and audio engineer tasked with categorizing musical tags.
Analyze the following list of tags and categorize each one into ONLY ONE of the predefined categories.

Here are the categories and their descriptions:
${categoriesDescription}

Your task is to respond with a valid JSON object. The keys of the object should be the original tags, and the values should be the full category name as a string (e.g., "Core Genre Family"). Do not add any extra text, comments, or markdown formatting like \`\`\`json before or after the JSON object.

Example Input: ["heavy metal", "slow build up", "80s"]
Example JSON Output:
{
  "heavy metal": "Core Genre Family",
  "slow build up": "Rhythmic & Structural Traits",
  "80s": "Era / Time-Period Vibe"
}

Now, categorize the following tags:
${JSON.stringify(tagsToCategorize)}
`;

async function categorizeTags(tags) {
  if (tags.length === 0) {
    return {};
  }

  try {
    console.log(`Sending ${tags.length} tags to AI for categorization...`);
    const prompt = getPrompt(tags);
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const cleanedJsonString = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const categorizedData = JSON.parse(cleanedJsonString);
    console.log("Successfully categorized tags via AI.");
    return categorizedData;
  } catch (error) {
    console.error("Error during AI categorization:", error);
    // On error, return an object where each tag maps to the fallback category
    const fallbackData = {};
    for (const tag of tags) {
      fallbackData[tag] = "Miscellaneous / Meta";
    }
    return fallbackData;
  }
}

// Export the main function so server.js can use it
module.exports = { categorizeTags };
