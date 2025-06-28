// categorize.js
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- 1. Define the Single Source of Truth for Categories ---
const CATEGORIES = [
  "Tempo & Meter",
  "Era / Time-Period Vibe",
  "Core Genre Family",
  "Sub-Genre & Fusion Styles",
  "Instrumentation & Sound Sources",
  "Vocal Characteristics",
  "Mood / Emotion",
  "Production & Mix Aesthetics",
  "Rhythmic & Structural Traits",
  "Cultural / Regional Flavor",
  "Language & Lyrical Context",
  "Themes & Imagery",
  "Miscellaneous / Meta",
];

// --- Configuration ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in the .env file.");
}
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- 2. Create a Numbered List for the Prompt ---
const categoriesNumberedList = CATEGORIES.map(
  (cat, index) => `${index + 1}. ${cat}`
).join("\n");

const getPrompt = (tagsToCategorize) => `
You are an expert musicologist. Your task is to categorize musical tags from a list.
Respond with a valid JSON object where keys are the original tags and values are the **corresponding category NUMBER** from the list below.

CATEGORIES:
${categoriesNumberedList}

RULES:
- The value for each tag in your JSON response MUST be an integer between 1 and ${
  CATEGORIES.length
}.
- Do NOT use the category name, only the number.
- Do NOT include any extra text, comments, or markdown formatting like \`\`\`json.

Example Input: ["heavy metal", "slow build up", "80s"]
Example JSON Output:
{
  "heavy metal": 3,
  "slow build up": 9,
  "80s": 2
}

Now, categorize the following tags:
${JSON.stringify(tagsToCategorize)}
`;

// --- 3. Create a Normalization Function (The Safety Net) ---
function normalizeCategory(aiResponseValue) {
  // If the AI correctly returned a number, use it.
  if (
    typeof aiResponseValue === "number" &&
    aiResponseValue >= 1 &&
    aiResponseValue <= CATEGORIES.length
  ) {
    return CATEGORIES[aiResponseValue - 1];
  }

  // If the AI made a mistake and returned a string, try to map it.
  if (typeof aiResponseValue === "string") {
    const lowerCaseResponse = aiResponseValue.toLowerCase();
    // This is where we handle the exact problem you saw
    if (lowerCaseResponse.includes("lyrical")) {
      return "Language & Lyrical Context";
    }
    // Add more fuzzy matching here if needed in the future
  }

  // If all else fails, return the default fallback category.
  return "Miscellaneous / Meta";
}

async function categorizeTags(tags) {
  if (tags.length === 0) return {};

  try {
    console.log(`Sending ${tags.length} tags to AI for categorization...`);
    const prompt = getPrompt(tags);
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const cleanedJsonString = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const aiResponseObject = JSON.parse(cleanedJsonString);

    // Normalize the entire response object
    const finalCategorizedData = {};
    for (const tag in aiResponseObject) {
      finalCategorizedData[tag] = normalizeCategory(aiResponseObject[tag]);
    }

    console.log("Successfully categorized and normalized tags via AI.");
    return finalCategorizedData;
  } catch (error) {
    console.error("Error during AI categorization:", error);
    const fallbackData = {};
    for (const tag of tags) {
      fallbackData[tag] = "Miscellaneous / Meta";
    }
    return fallbackData;
  }
}

// Export the main function
module.exports = { categorizeTags };
