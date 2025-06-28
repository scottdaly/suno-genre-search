const originalFetch = window.fetch;
const targetURL = "https://studio-api.prod.suno.com/api/tags/recommend";

window.fetch = async (...args) => {
  const url = args[0] instanceof Request ? args[0].url : args[0];

  // --- The Key Change: Check the URL FIRST! ---
  // If this is NOT the URL we care about, don't touch it.
  // Just pass it along to the original fetch and return immediately.
  if (String(url) !== targetURL) {
    return originalFetch(...args);
  }

  // --- If we reach this point, it IS our target URL ---
  // Now we can safely do our special processing.
  const response = await originalFetch(...args);
  const clonedResponse = response.clone();

  clonedResponse
    .json()
    .then((data) => {
      if (
        data &&
        Array.isArray(data.recommended_tags) &&
        data.recommended_tags.length > 0
      ) {
        const genreNames = data.recommended_tags
          .map((tag) => {
            if (typeof tag === "string") return tag;
            if (typeof tag === "object" && tag.name) return tag.name;
            return null;
          })
          .filter(Boolean);

        if (genreNames.length > 0) {
          console.log(
            "%cSUCCESS: Found and dispatched genres!",
            "color: #00FF00; font-weight: bold;",
            genreNames
          );
          window.dispatchEvent(
            new CustomEvent("SunoGenresFound", { detail: genreNames })
          );
        }
      }
    })
    .catch((err) => {
      console.error(
        "Genre Collector: Error parsing JSON for the target URL.",
        err
      );
    });

  return response;
};
