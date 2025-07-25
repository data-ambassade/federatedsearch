document.addEventListener("DOMContentLoaded", () => {
  // Wait until a specific element is found in DOM (retry until timeout)
  const waitForEl = (selector, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const interval = 50;
      const maxTries = timeout / interval;
      let tries = 0;
      const timer = setInterval(() => {
        const el = document.querySelector(selector);
        if (el) {
          clearInterval(timer);
          resolve(el); // Element found
        } else if (++tries > maxTries) {
          clearInterval(timer);
          reject(new Error(`Element ${selector} not found within ${timeout}ms`)); // Timed out
        }
      }, interval);
    });
  };

  async function init() {
    // Wait for all key elements before initializing
    const searchInput = await waitForEl("#mySearchInput");
    const searchBtn = await waitForEl("#mySearchBtn");
    const resultList = await waitForEl("#searchResultList");
    const desktopCategoryList = await waitForEl("#category-list");
    const mobileCategoryList = document.querySelector("#mobile-category-list");
    const paginationEl = await waitForEl("#pagination");

    // Create skeleton loader if not already added
    let loadingEl = document.querySelector("#loadingSkeleton");
    if (!loadingEl) {
      loadingEl = document.createElement("div");
      loadingEl.id = "loadingSkeleton";
      loadingEl.style.cssText = "display:none;"; // Hidden initially

      // Create 5 skeleton cards
      const skeletonHTML = Array(5).fill(`
        <div class="skeleton-card">
          <div class="skeleton-title"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
          <div class="skeleton-line medium"></div>
        </div>
      `).join("");
      loadingEl.innerHTML = skeletonHTML;
      resultList.parentElement?.insertBefore(loadingEl, resultList); // Add before results

      // Inject skeleton CSS
      const style = document.createElement("style");
      style.textContent = `
        .skeleton-card {
          background: #ffffff;
          padding: 16px;
          margin-bottom: 16px;
          border-radius: 8px;
          min-height: 100px;
        }

        .skeleton-title {
          height: 5vh;
          width: 35vw;
          background: linear-gradient(90deg, #f8f8f8 25%, #eeeeee 50%, #f8f8f8 75%);
          background-size: 200% 100%;
          animation: pulse 1.2s ease-in-out infinite;
          border-radius: 4px;
          margin-bottom: 16px;
        }

        .skeleton-line {
          height: 16vh;
          width: 50vw;
          background: linear-gradient(90deg, #f8f8f8 25%, #eeeeee 50%, #f8f8f8 75%);
          background-size: 200% 100%;
          animation: pulse 1.2s ease-in-out infinite;
          border-radius: 4px;
          margin-bottom: 10px;
        }

        .skeleton-line.short {
          height: 5vh;
          width: 20vw;
        }

        .skeleton-line.medium {
          height: 5vh;
          width: 45vw;
        }

        @keyframes pulse {
          0% { background-position: -150% 0; }
          100% { background-position: 150% 0; }
        }
      `;
      document.head.appendChild(style);
    }

    // State variables
    let currentPage = 1;
    let totalPages = 1;
    let lastSearchKey = null;

    // Collect checked category values from both desktop and mobile lists
    function getSelectedCategories() {
      const checkboxes = document.querySelectorAll(
        '#category-list input[type="checkbox"]:checked, #mobile-category-list input[type="checkbox"]:checked'
      );
      const values = new Set();
      checkboxes.forEach((cb) => values.add(cb.value));
      return Array.from(values);
    }

    // Render pagination navigation
    function renderPagination(page, pages) {
      paginationEl.innerHTML = "";
      const nav = document.createElement("nav");
      const ul = document.createElement("ul");
      ul.className = "pagination";

      const totalVisible = Math.min(pages, 5);
      let start = Math.max(1, page - Math.floor(totalVisible / 2));
      let end = start + totalVisible - 1;
      if (end > pages) {
        end = pages;
        start = Math.max(1, end - totalVisible + 1);
      }

      // Create page buttons
      const createPageItem = (label, pageNumber, isActive, isDisabled = false) => {
        const li = document.createElement("li");
        li.className = `page-item ${isActive ? "active" : ""} ${isDisabled ? "disabled" : ""}`;
        const btn = document.createElement("button");
        btn.className = "page-link";
        btn.textContent = label;
        btn.disabled = isDisabled;
        btn.addEventListener("click", () => {
          if (!isDisabled && pageNumber !== currentPage) {
            executeSearch(searchInput.value.trim(), pageNumber);
          }
        });
        li.appendChild(btn);
        return li;
      };

      ul.appendChild(createPageItem("‹", page - 1, false, page === 1));
      for (let i = start; i <= end; i++) {
        ul.appendChild(createPageItem(i, i, i === page));
      }
      ul.appendChild(createPageItem("›", page + 1, false, page === pages));
      nav.appendChild(ul);
      paginationEl.appendChild(nav);
    }

    // Run the actual API search request
    async function executeSearch(keyword, pageOverride = null, skipUrlUpdate = false) {
      const selectedCategories = getSelectedCategories();
      const categoryParam = selectedCategories.join(",");
      const page = pageOverride !== null ? pageOverride : 1;

      const currentSearchKey = `${keyword}||${categoryParam}||${page}`;
      if (!skipUrlUpdate && currentSearchKey === lastSearchKey) return;

      currentPage = page;
      lastSearchKey = currentSearchKey;

      // Build URL
      const queryParams = new URLSearchParams();
      if (keyword) queryParams.set("keyword", keyword);
      if (categoryParam) queryParams.set("category", categoryParam);
      if (page && page !== 1) queryParams.set("page", page);

      if (!skipUrlUpdate) {
        history.pushState({}, "", `?${queryParams.toString()}`);
      }

      // Begin loading
      const apiUrl = "https://client.data-ambassade.nl/generic_federated_search" + (queryParams.toString() ? "?" + queryParams.toString() : "");
      loadingEl.style.display = "block";
      resultList.innerHTML = "";
      paginationEl.innerHTML = "";

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        loadingEl.style.display = "none";

        // No results
        if (!data.items || data.items.length === 0) {
          resultList.innerHTML = "<p>No results found.</p>";
          totalPages = 1;
          return;
        }

        // Render results
        resultList.innerHTML = data.items.map((item) => {
          const id = item.id || "";
          const title = item.title || item.naam;
          const description = item.description || item.Beschrijving || item.beschrijving;
          const uri = item["schema"]?.url || "#";
          const linkText = item["schema"]?.title || "View Source";
          return `
            <div class="result-item" style="margin-bottom: 15px;">
              <h3>${title}</h3>
              <p>${description}</p>
              <a href="${uri}" target="_blank">${linkText}</a>
              <a href="/detail?id=${id}" class="result-arrow-button" aria-label="View details for ${title}">
                <i class="fas fa-arrow-right"></i>
              </a>
            </div>
          `;
        }).join("");

        totalPages = data.pages || 1;
        renderPagination(currentPage, totalPages);

      } catch (error) {
        console.error("API fetch error:", error);
        loadingEl.style.display = "none";
        resultList.innerHTML = "<p>Error loading results. Please try again.</p>";
      }
    }

    // Load categories and apply existing selections
    async function loadCategories(keyword = "") {
      const queryParams = new URLSearchParams();
      if (keyword) queryParams.set("keyword", keyword);
      const apiUrl = "https://client.data-ambassade.nl/generic_federated_search" + (queryParams.toString() ? "?" + queryParams.toString() : "");

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const catalogs = data.facetable?.["@self"]?.register?.sample_values;
        if (!catalogs) return;

        [desktopCategoryList, mobileCategoryList].forEach((container) => {
          if (!container) return;
          container.innerHTML = "";
          catalogs.forEach((cat) => {
            const label = document.createElement("label");
            label.style.display = "block";
            label.style.marginBottom = "6px";
            label.innerHTML = `
              <input type="checkbox" value="${cat.value}" name="category" />
              ${cat.label}
            `;
            container.appendChild(label);
          });
        });

        const selectedCats = parseQueryParams().category;
        selectedCats.forEach((val) => {
          [desktopCategoryList, mobileCategoryList].forEach((container) => {
            const checkbox = container?.querySelector(`input[value="${val}"]`);
            if (checkbox) checkbox.checked = true;
          });
        });

      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    }

    // Read URL params into structured object
    function parseQueryParams() {
      const params = new URLSearchParams(window.location.search);
      return {
        keyword: params.get("keyword") || "",
        category: (params.get("category") || "").split(",").filter(Boolean),
        page: parseInt(params.get("page") || "1", 10),
      };
    }

    // Search button click handler
    searchBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const keyword = searchInput.value.trim();
      executeSearch(keyword, 1);
    });

    // Search on Enter key
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        searchBtn.click();
      }
    });

    // Category checkbox change triggers search
    [desktopCategoryList, mobileCategoryList].forEach((container) => {
      container?.addEventListener("change", () => {
        const keyword = searchInput.value.trim();
        executeSearch(keyword, 1);
      });
    });

    // Restore state on back/forward nav
    window.addEventListener("popstate", () => {
      const { keyword, page } = parseQueryParams();
      searchInput.value = keyword;
      executeSearch(keyword, page, true);
    });

    // Initial load
    const { keyword, category, page } = parseQueryParams();
    searchInput.value = keyword;

    // Hide filter UI until categories are loaded
    const filterListEl = document.getElementById("filter-list");
    if (filterListEl) {
      filterListEl.style.visibility = "hidden";
      filterListEl.style.pointerEvents = "none";
    }

    // Load filters and show them after
    await loadCategories(keyword);
    if (filterListEl) {
      filterListEl.style.visibility = "visible";
      filterListEl.style.pointerEvents = "auto";
    }

    // Initial search
    executeSearch(keyword, page, true);
  }

  // Kick off initialization
  init().catch((e) => {
    console.error("Page init error:", e);
  });
});
