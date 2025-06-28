// This script runs at document_start in the "content script world".
// Its only job is to inject our real script into the page ("main world")
// and listen for messages back from it.

function injectScript(filePath) {
  const script = document.createElement("script");
  script.setAttribute("type", "text/javascript");
  script.setAttribute("src", filePath);
  (document.head || document.documentElement).appendChild(script);
  script.onload = () => script.remove();
}

// Inject our main logic
injectScript(chrome.runtime.getURL("injector.js"));

// Listen for the custom event from our injected script
window.addEventListener("SunoGenresFound", (event) => {
  const genres = event.detail;
  console.log("Content Script received genres:", genres);
  chrome.runtime.sendMessage({ type: "NEW_GENRES_FOUND", genres: genres });
});
