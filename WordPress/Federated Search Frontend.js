document.addEventListener("DOMContentLoaded", () => {
  const waitForEl = (selector, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const interval = 50;
      const maxTries = timeout / interval;
      let tries = 0;
      const timer = setInterval(() => {
        const el = document.querySelector(selector);
        if (el) {
          clearInterval(timer);
          resolve(el);
        } else if (++tries > maxTries) {
          clearInterval(timer);
          reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        }
      }, interval);
    });
  };

  async function init() {
    const searchInput = await waitForEl("#mySearchInput");
    const searchBtn = await waitForEl("#mySearchBtn");
    const resultList = await waitForEl("#searchResultList");
    const desktopCategoryList = await waitForEl("#category-list");
    const desktopThemeList = await waitForEl("#theme-list");
    const desktopKeywordList = await waitForEl("#keyword-list");
    const mobileCategoryList = document.querySelector("#mobile-category-list");
    const mobileThemeList = document.querySelector("#mobile-theme-list");
    const mobileKeywordList = document.querySelector("#mobile-keyword-list");
    const paginationEl = await waitForEl("#pagination");
    const sortSelect = document.getElementById("sortSelect");
    const mobileSortSelect = document.getElementById("mobile-sortSelect");

    let fullResultDataset = [];

    const loadingEl = document.createElement("div");
    loadingEl.id = "loadingSkeleton";
    loadingEl.style.display = "none";
    loadingEl.innerHTML = Array(5).fill(`
      <div class="skeleton-card">
        <div class="skeleton-title"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
        <div class="skeleton-line medium"></div>
      </div>
    `).join("");
    resultList.parentElement?.insertBefore(loadingEl, resultList);

    const style = document.createElement("style");
    style.textContent = `
      .skeleton-card { background:#ffffff; margin-bottom:20px; border-radius:8px; min-height:100px; }
      .skeleton-title, .skeleton-line {
        background: linear-gradient(90deg, #f8f8f8 25%, #eeeeee 50%, #f8f8f8 75%);
        background-size: 200% 100%;
        animation: pulse 1.2s ease-in-out infinite;
        border-radius: 4px; margin-bottom: 10px;
      }
      .skeleton-title { height: 30px; width: 70%; margin-bottom: 16px; }
      .skeleton-line { height: 80px; width: 100%; margin-bottom: 16px; }
      .skeleton-line.short { height: 30px; width: 50%; margin-bottom: 16px; }
      .skeleton-line.medium { height: 30px; width: 85%; margin-bottom: 16px; }
      @keyframes pulse { 0% { background-position: -150% 0; } 100% { background-position: 150% 0; } }

      .more-info-btn {
        display:inline-block; padding:6px 12px; border-radius:6px;
        background:#0b5ed7; color:#fff; text-decoration:none; font-weight:600;
      }
      .more-info-btn:hover { filter: brightness(0.95); }
    `;
    document.head.appendChild(style);

    let currentPage = 1;
    let totalPages = 1;
    let lastSearchKey = null;

    function parseQueryParams() {
      const params = new URLSearchParams(window.location.search);
      return {
        query: params.get("query") || "",
        category: (params.get("category") || "").split(",").filter(Boolean),
        page: parseInt(params.get("page") || "1", 10),
      };
    }

    function getSelectedFilterValues(selector) {
      return Array.from(document.querySelectorAll(`${selector} input[type="checkbox"]:checked`)).map(cb => cb.value);
    }

    function extractFacetValues(dataset, path) {
      const values = new Set();
      dataset.forEach(item => {
        const entries = path(item);
        entries?.forEach(val => values.add(val));
      });
      return Array.from(values).sort();
    }

    function renderFacetList(values, containers, groupName) {
      containers.forEach(container => {
        if (!container) return;
        container.innerHTML = "";
        values.forEach(val => {
          const label = document.createElement("label");
          label.style.display = "block";
          label.style.marginBottom = "6px";
          label.innerHTML = `
            <input type="checkbox" value="${val}" name="${groupName}" />
            ${val}
          `;
          container.appendChild(label);
        });
      });
    }

    function bindFilterEvents() {
      const allLists = [
        desktopCategoryList, mobileCategoryList,
        desktopThemeList, mobileThemeList,
        desktopKeywordList, mobileKeywordList
      ];
      allLists.forEach(container => {
        container?.addEventListener("change", applyFiltersAndRenderResults);
      });

      if (sortSelect) sortSelect.addEventListener("change", applyFiltersAndRenderResults);
      if (mobileSortSelect) mobileSortSelect.addEventListener("change", applyFiltersAndRenderResults);
    }

    function getSortOrder() { return sortSelect?.value || "relevant"; }

    function applyFiltersAndRenderResults() {
      const selectedCategories = new Set(getSelectedFilterValues("#category-list").concat(getSelectedFilterValues("#mobile-category-list")));
      const selectedThemes = new Set(getSelectedFilterValues("#theme-list").concat(getSelectedFilterValues("#mobile-theme-list")));
      const selectedKeywords = new Set(getSelectedFilterValues("#keyword-list").concat(getSelectedFilterValues("#mobile-keyword-list")));

      let filtered = fullResultDataset.filter(item => {
        let categories = [];
        if (typeof item["dct:catalog"] === "string") {
          categories = [item["dct:catalog"]];
        } else if (Array.isArray(item["dct:catalog"])) {
          categories = item["dct:catalog"].map(c => c["dct:title"]).filter(Boolean);
        }

        const themes = (item["dcat:theme"] || []).map(t =>
          typeof t === "string" ? t : t["rdfs:label"]
        ).filter(Boolean);

        const keywords = (item["dcat:keyword"] || []).filter(k => typeof k === "string");

        const matchCategory = selectedCategories.size === 0 || categories.some(c => selectedCategories.has(c));
        const matchTheme = selectedThemes.size === 0 || themes.some(t => selectedThemes.has(t));
        const matchKeyword = selectedKeywords.size === 0 || keywords.some(k => selectedKeywords.has(k));

        return matchCategory && matchTheme && matchKeyword;
      });

      const sortOrder = getSortOrder();
      if (sortOrder === "newest") {
        filtered.sort((a, b) => {
          const dateA = new Date(a["dct:modified"]?.["@value"] || 0);
          const dateB = new Date(b["dct:modified"]?.["@value"] || 0);
          return dateB - dateA;
        });
      } else if (sortOrder === "latest") {
        filtered.sort((a, b) => {
          const dateA = new Date(a["dct:modified"]?.["@value"] || 0);
          const dateB = new Date(b["dct:modified"]?.["@value"] || 0);
          return dateA - dateB;
        });
      }

      renderResults(filtered);
    }

    function renderResults(datasets) {
      resultList.innerHTML = datasets.map(item => {
        const id = item["dct:identifier"] || "";
        const title = typeof item["dct:title"] === "string" ? item["dct:title"] : item["dct:title"]?.["@value"] || "Geen titel";
        const description = typeof item["dct:description"] === "string" ? item["dct:description"] : item["dct:description"]?.["@value"] || "Geen beschrijving";
        const uri = item["@id"] || "#";

        // Determine catalog label (what used to be linkText)
        let linkText = "Bekijk";
        const catalog = item["dct:catalog"];
        if (typeof catalog === "string") {
          linkText = catalog;
        } else if (Array.isArray(catalog)) {
          linkText = catalog[0]?.["dct:title"] || "Bekijk";
        }

        // Build the correct More info URL based on the catalog label
        const encodedId = encodeURIComponent(id || "");
        let infoUrl = uri || "#";
        if (linkText === "Dimpact") {
          infoUrl = `https://dimpact.opencatalogi.nl/publicatie/${encodedId}`;
        } else if (linkText === "High value datasets") {
          infoUrl = `/detail?id=${encodeURIComponent(id || "")}`;
        } else if (linkText === "oup_ogc_records") {
          infoUrl = `https://hub.clearly.app/datasets/${encodedId}/information`;
        } 

        return `
          <div class="result-item" style="margin-bottom: 15px;">
            <h3>${title}</h3>
            <p>${description}</p>

            <div class="result-actions" style="display:flex; align-items:center; gap:10px;">
              <a href="${infoUrl}" target="_blank" rel="noopener" class="more-info-btn">More info</a>
            </div>
            <div class="result-arrow-button">
              Calalogus:${linkText}
            </div>
          </div>
        `;
      }).join("");

      if (datasets.length === 0) {
        resultList.innerHTML = "<p>No results found.</p>";
      }
    }

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

    async function executeSearch(query, pageOverride = null, skipUrlUpdate = false) {
      const page = pageOverride !== null ? pageOverride : 1;
      const currentSearchKey = `${query}||${page}`;
      if (!skipUrlUpdate && currentSearchKey === lastSearchKey) return;

      currentPage = page;
      lastSearchKey = currentSearchKey;

      const queryParams = new URLSearchParams();
      if (query) queryParams.set("query", query);
      if (page !== 1) queryParams.set("page", page);

      if (!skipUrlUpdate) {
        history.pushState({}, "", `?${queryParams.toString()}`);
      }

      if (typeof FederatedSearchConfig !== "undefined" && FederatedSearchConfig.sources) {
        queryParams.set("source", FederatedSearchConfig.sources);
      }

      const apiUrl = "https://nodered.fairdays.nl/generic_federated_search?" + queryParams.toString();

      loadingEl.style.display = "block";
      resultList.innerHTML = "";
      paginationEl.innerHTML = "";

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        loadingEl.style.display = "none";

        fullResultDataset = [];
        (data["@graph"] || []).forEach(catalog => {
          if (Array.isArray(catalog["dcat:dataset"])) {
            fullResultDataset.push(...catalog["dcat:dataset"]);
          }
        });

        const categories = extractFacetValues(fullResultDataset, item => {
          const catalog = item["dct:catalog"];
          if (typeof catalog === "string") return [catalog];
          if (Array.isArray(catalog)) {
            return catalog.map(c => c["dct:title"]).filter(Boolean);
          }
          return [];
        });

        const themes = extractFacetValues(fullResultDataset, item =>
          (item["dcat:theme"] || []).map(t => typeof t === "string" ? t : t["rdfs:label"]).filter(Boolean)
        );

        const keywords = extractFacetValues(fullResultDataset, item =>
          (item["dcat:keyword"] || []).filter(k => typeof k === "string")
        );

        renderFacetList(categories, [desktopCategoryList, mobileCategoryList], "category");
        renderFacetList(themes, [desktopThemeList, mobileThemeList], "theme");
        renderFacetList(keywords, [desktopKeywordList, mobileKeywordList], "keyword");

        bindFilterEvents();
        applyFiltersAndRenderResults();

        totalPages = Math.ceil((data["hydra:totalItems"] || 1) / (data["hydra:itemsPerPage"] || 20));
        renderPagination(currentPage, totalPages);

      } catch (error) {
        console.error("API fetch error:", error);
        loadingEl.style.display = "none";
        resultList.innerHTML = "<p>Error loading results. Please try again.</p>";
      }
    }

    searchBtn.addEventListener("click", (e) => {
      e.preventDefault();
      executeSearch(searchInput.value.trim(), 1);
    });

    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        searchBtn.click();
      }
    });

    window.addEventListener("popstate", () => {
      const { query, page } = parseQueryParams();
      searchInput.value = query;
      executeSearch(query, page, true);
    });

    const { query, page } = parseQueryParams();
    searchInput.value = query;
    executeSearch(query, page, true);
  }

  init().catch((e) => {
    console.error("Page init error:", e);
  });
});
