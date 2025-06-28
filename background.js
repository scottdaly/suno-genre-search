// background.js

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "NEW_GENRES_FOUND") {
    sendGenresToServer(message.genres);
  }
});

async function sendGenresToServer(newGenres) {
  const serverUrl = "http://localhost:4000/api/genres";

  console.log(`Sending ${newGenres.length} genres to server...`);

  try {
    const response = await fetch(serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ genres: newGenres }), // Match the expected body shape
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Server response:", result.message);
  } catch (error) {
    console.error(
      "Failed to send genres to server. Is the server running?",
      error
    );
  }
}
