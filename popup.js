document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const genreList = document.getElementById("genreList");
  const statusDiv = document.getElementById("status");
  const exportButton = document.getElementById("exportButton");
  let allGenres = [];

  // Load the genres from storage
  chrome.storage.local.get(["sunoGenres"], (result) => {
    allGenres = result.sunoGenres || [];
    statusDiv.textContent = `Collected ${allGenres.length} unique genres.`;
    renderList(allGenres);
  });

  // Filter the list as the user types
  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredGenres = allGenres.filter((genre) =>
      genre.toLowerCase().includes(searchTerm)
    );
    renderList(filteredGenres);
  });

  // --- NEW EXPORT LOGIC ---
  exportButton.addEventListener("click", () => {
    // Create a Blob from the JSON data
    const dataStr = JSON.stringify(allGenres, null, 2); // Pretty-prints the JSON
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    // Create a temporary link to trigger the download
    const a = document.createElement("a");
    a.href = url;
    a.download = "suno_genres.json";
    document.body.appendChild(a);
    a.click();

    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Function to display genres in the list
  function renderList(genres) {
    genreList.innerHTML = "";
    if (genres.length === 0) {
      genreList.innerHTML = "<li>No matches found.</li>";
    }
    genres.forEach((genre) => {
      const li = document.createElement("li");
      li.textContent = genre;
      genreList.appendChild(li);
    });
  }
});
