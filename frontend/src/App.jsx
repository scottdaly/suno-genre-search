// src/App.jsx
import { useState, useEffect, useMemo } from "react";

function App() {
  // State for the master list of all tags, including their category
  const [allTags, setAllTags] = useState([]);

  // State for the user's search query
  const [searchTerm, setSearchTerm] = useState("");

  // State to manage the current sorting method
  const [sortMethod, setSortMethod] = useState("az"); // 'az', 'za', or 'category'

  // State for selected categories for filtering
  const [selectedCategories, setSelectedCategories] = useState([]);

  // State to control the visibility of the category dropdown
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  // Fetch the data from your server when the component first loads
  useEffect(() => {
    fetch("/api/genres")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch from server");
        return res.json();
      })
      .then((data) => setAllTags(data))
      .catch((error) => console.error("Failed to fetch tags:", error));
  }, []); // Empty array ensures this runs only once on mount

  // Close category dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isCategoryDropdownOpen &&
        !event.target.closest(".category-dropdown")
      ) {
        setIsCategoryDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCategoryDropdownOpen]);

  // Get unique categories for the multi-select dropdown
  const uniqueCategories = useMemo(() => {
    const categories = [...new Set(allTags.map((tag) => tag.category))];
    return categories.sort();
  }, [allTags]);

  // Helper function to toggle category selection
  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // Helper function to handle select all/deselect all
  const handleSelectAllToggle = () => {
    if (selectedCategories.length === uniqueCategories.length) {
      // All selected, so deselect all
      setSelectedCategories([]);
    } else {
      // Some or none selected, so select all
      setSelectedCategories([...uniqueCategories]);
    }
  };

  // Determine the state of the select all checkbox
  const selectAllState = useMemo(() => {
    if (selectedCategories.length === 0) return "none";
    if (selectedCategories.length === uniqueCategories.length) return "all";
    return "some";
  }, [selectedCategories.length, uniqueCategories.length]);

  // useMemo hook to efficiently filter and sort the displayed tags
  // This logic re-runs only when the underlying data or user inputs change
  const displayedTags = useMemo(() => {
    // 1. Filter the tags based on the search term and selected categories
    const filtered = allTags.filter((tag) => {
      const matchesSearch = tag.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(tag.category);
      return matchesSearch && matchesCategory;
    });

    // 2. Sort the filtered results based on the current sort method
    switch (sortMethod) {
      case "az":
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case "za":
        return filtered.sort((a, b) => b.name.localeCompare(a.name));
      case "category":
        // For category sort, sort by category first, then by name within each category
        return filtered.sort((a, b) => {
          if (a.category < b.category) return -1;
          if (a.category > b.category) return 1;
          // If categories are the same, sort by name
          return a.name.localeCompare(b.name);
        });
      default:
        return filtered;
    }
  }, [allTags, searchTerm, sortMethod, selectedCategories]);

  return (
    <div className="min-h-screen relative">
      {/* Background image layer */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: "url(/bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      ></div>

      <div className="container max-w-4xl mx-auto p-4 sm:p-6">
        <div className="bg-white backdrop-blur-sm rounded-xl shadow-lg p-6 sm:p-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-6">
            Suno Tag Explorer
          </h1>

          {/* Search input */}
          <div className="mb-4">
            <input
              type="text"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200 text-lg"
              placeholder="Search tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Dropdown controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {/* Sort by dropdown */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Sort by
              </label>
              <select
                value={sortMethod}
                onChange={(e) => setSortMethod(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200 bg-white"
              >
                <option value="az">A-Z</option>
                <option value="za">Z-A</option>
                <option value="category">Category</option>
              </select>
            </div>

            {/* Category multi-select dropdown */}
            <div className="flex-1 relative category-dropdown">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Filter by Category
              </label>
              <button
                onClick={() =>
                  setIsCategoryDropdownOpen(!isCategoryDropdownOpen)
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200 bg-white text-left flex justify-between items-center"
              >
                <span className="text-slate-700">
                  {selectedCategories.length === 0
                    ? "All categories"
                    : `${selectedCategories.length} selected`}
                </span>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isCategoryDropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Category dropdown menu */}
              {isCategoryDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg">
                  {/* Smart select all/deselect all header */}
                  <div className="p-3 border-b border-slate-200 bg-slate-50">
                    <label className="flex items-center cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={selectAllState === "all"}
                          ref={(el) => {
                            if (el) {
                              el.indeterminate = selectAllState === "some";
                            }
                          }}
                          onChange={handleSelectAllToggle}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                      <div className="ml-3 flex-1">
                        <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                          {selectAllState === "all"
                            ? "Deselect all categories"
                            : selectAllState === "some"
                            ? "Select all categories"
                            : "Select all categories"}
                        </span>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {selectedCategories.length} of{" "}
                          {uniqueCategories.length} selected
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Individual category options */}
                  <div className="max-h-60 overflow-y-auto">
                    {uniqueCategories.map((category) => (
                      <label
                        key={category}
                        className="flex items-center px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors duration-150"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => toggleCategory(category)}
                          className="w-4 h-4 mr-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="flex-1">{category}</span>
                        <span className="text-xs text-slate-400 ml-2">
                          {
                            allTags.filter((tag) => tag.category === category)
                              .length
                          }
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-slate-500 mb-6">
            Showing {displayedTags.length} of {allTags.length} total tags
            {selectedCategories.length > 0 && (
              <span className="block mt-1 text-sm">
                Filtered by {selectedCategories.length} categor
                {selectedCategories.length === 1 ? "y" : "ies"}:{" "}
                {selectedCategories.join(", ")}
              </span>
            )}
          </p>

          {/* The single, flat list of tags */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <ul className="divide-y divide-slate-200">
              {displayedTags.length > 0 ? (
                displayedTags.map((tag) => (
                  <li
                    key={tag.id}
                    className="p-3 sm:p-4 flex justify-between items-center even:bg-slate-50"
                  >
                    <span className="font-medium text-slate-800">
                      {tag.name}
                    </span>
                    <span className="text-xs bg-slate-200 text-slate-600 font-semibold px-2 py-1 rounded-full">
                      {tag.category}
                    </span>
                  </li>
                ))
              ) : (
                <li className="p-4 text-center text-slate-500">
                  No tags found.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
