// server.js
const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const cors = require("cors");
const { categorizeTags } = require("./categorize.js"); // Import the AI logic

const app = express();
const PORT = 3001;

// --- Middleware ---
app.use(cors({ origin: "http://localhost:5173, https://suno.rsdaly.com" })); // Allow requests from your Vite app
app.use(express.json()); // Allow the server to parse JSON request bodies

// --- Database Setup ---
let db;
(async () => {
  try {
    // Open the database file (it will be created if it doesn't exist)
    db = await open({
      filename: "./suno_tags.db", // Using a more accurate name
      driver: sqlite3.Database,
    });

    // Create the 'tags' table if it doesn't already exist.
    // The 'UNIQUE' constraint is crucial for preventing duplicate tags.
    // The 'category' column will store the AI's classification.
    await db.exec(`
            CREATE TABLE IF NOT EXISTS tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                category TEXT DEFAULT "Miscellaneous / Meta"
            )
        `);
    console.log("Database is ready and schema is up to date.");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    process.exit(1); // Exit if the database can't be set up
  }
})();

// --- API Endpoints ---

// GET: Fetch all tags with their categories
app.get("/api/genres", async (req, res) => {
  try {
    // The frontend now expects an array of objects: [{ id, name, category }]
    const tags = await db.all(
      "SELECT id, name, category FROM tags ORDER BY category, name ASC"
    );
    res.json(tags);
  } catch (err) {
    console.error("Error fetching tags:", err);
    res.status(500).json({ error: "Failed to fetch tags" });
  }
});

// POST: Receive new tags, categorize them, and add to the database
app.post("/api/genres", async (req, res) => {
  const { genres: incomingTags } = req.body;

  if (
    !incomingTags ||
    !Array.isArray(incomingTags) ||
    incomingTags.length === 0
  ) {
    return res.status(400).json({
      error: 'Request body must be an object with a non-empty "genres" array.',
    });
  }

  try {
    // Find which tags are truly new to avoid wasting AI calls
    const placeholders = incomingTags.map(() => "?").join(",");
    const existingTagsResult = await db.all(
      `SELECT name FROM tags WHERE name IN (${placeholders})`,
      incomingTags
    );
    const existingTagNames = new Set(existingTagsResult.map((t) => t.name));
    const newTagsToProcess = incomingTags.filter(
      (t) => !existingTagNames.has(t)
    );

    if (newTagsToProcess.length === 0) {
      console.log("Received tags, but all already exist in the database.");
      return res
        .status(200)
        .json({ message: "All received tags already exist." });
    }

    // Categorize only the new tags using the AI module
    const categorizedTags = await categorizeTags(newTagsToProcess);

    // --- THE FIX IS HERE ---
    // Use a single, more robust SQL statement with ON CONFLICT
    const statement = await db.prepare(
      "INSERT INTO tags (name, category) VALUES (?, ?) ON CONFLICT(name) DO NOTHING"
    );

    let insertedCount = 0;

    // This loop is now safe from race conditions at the database level
    for (const tagName of newTagsToProcess) {
      const category = categorizedTags[tagName] || "Miscellaneous / Meta";
      const result = await statement.run(tagName, category);
      if (result.changes > 0) {
        insertedCount++;
      }
    }
    await statement.finalize();

    console.log(
      `Processed ${incomingTags.length} tags. Added ${insertedCount} new categorized tags to the database.`
    );
    res
      .status(201)
      .json({ message: `Successfully added ${insertedCount} new tags.` });
  } catch (err) {
    // This catch block will now only be triggered by unexpected errors, not simple conflicts.
    console.error("An unexpected error occurred while processing tags:", err);
    res.status(500).json({ error: "An internal error occurred." });
  }
});

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log("Ready to receive data from the Chrome Extension.");
  console.log("Ready to serve data to the React app.");
});
