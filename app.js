(function () {
    let allItems = [];
    let currentCategory = "all";
    let searchQuery = "";
    let currentSort = "featured";

    const dealsGrid = document.getElementById("deals-grid");
    const emptyState = document.getElementById("empty-state");
    const updateBadge = document.getElementById("update-badge");
    const weekLabel = document.getElementById("week-label");
    const totalDealCount = document.getElementById("total-deal-count");
    const maxDiscountRate = document.getElementById("max-discount-rate");
    const categoryTabs = document.getElementById("category-tabs");
    const searchInput = document.getElementById("search-input");
    const sortSelect = document.getElementById("sort-select");
    const resetFilterBtn = document.getElementById("reset-filter-btn");

    function formatPrice(num) {
        return Number(num || 0).toLocaleString("ko-KR") + "원";
    }

    function formatNumber(num) {
        return Number(num || 0).toLocaleString("ko-KR");
    }

    async function loadDealsData() {
        // 1순위: 웹서버 환경에서는 최신 deals.json fetch 시도
        try {
            const response = await fetch("./data/deals.json?t=" + Date.now());
            if (response.ok) {
                const json = await response.json();
                applyData(json);
                return;
            }
        } catch (err) {
            // 로컬 file:// 프로토콜에서는 fetch가 차단될 수 있으므로 window.DEALS_DATA 폴백 사용
        }

        // 2순위: data/deals.js 에 내장된 전역 객체 사용
        if (window.DEALS_DATA) {
            applyData(window.DEALS_DATA);
        }
    }

    function applyData(data) {
        allItems = Array.isArray(data.items) ? data.items : [];
        if (data.updated_at) {
            updateBadge.textContent = `📅 최근 업데이트: ${data.updated_at}`;
        }
        if (data.week_title) {
            weekLabel.textContent = `🔥 ${data.week_title}`;
        }

        totalDealCount.textContent = `${allItems.length}개`;
        const maxDisc = allItems.reduce((max, item) => Math.max(max, Number(item.discount_rate || 0)), 0);
        maxDiscountRate.textContent = `최대 ${maxDisc}%`;

        renderDeals();
    }

    function getFilteredAndSortedItems() {
        let filtered = allItems.filter((item) => {
            const matchCat = currentCategory === "all" || item.category === currentCategory;
            const q = searchQuery.trim().toLowerCase();
            const matchSearch =
                !q ||
                (item.title && item.title.toLowerCase().includes(q)) ||
                (item.ai_comment && item.ai_comment.toLowerCase().includes(q)) ||
                (item.category && item.category.toLowerCase().includes(q));
            return matchCat && matchSearch;
        });

        if (currentSort === "discount") {
            filtered.sort((a, b) => (b.discount_rate || 0) - (a.discount_rate || 0));
        } else if (currentSort === "price-asc") {
            filtered.sort((a, b) => (a.sale_price || 0) - (b.sale_price || 0));
        } else if (currentSort === "reviews") {
            filtered.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
        }

        return filtered;
    }

    function renderDeals() {
        const list = getFilteredAndSortedItems();
        dealsGrid.innerHTML = "";

        if (list.length === 0) {
            emptyState.classList.remove("hidden");
            return;
        }
        emptyState.classList.add("hidden");

        list.forEach((item) => {
            const card = document.createElement("article");
            card.className = "deal-card";

            const rocketBadge = item.is_rocket
                ? `<span class="badge-rocket">🚀 로켓배송</span>`
                : "";

            const originalPriceHtml =
                item.original_price && item.original_price > item.sale_price
                    ? `<span class="original-price">${formatPrice(item.original_price)}</span>`
                    : "";

            card.innerHTML = `
                <div class="card-thumb-wrap">
                    <img src="${item.image_url}" alt="${item.title}" class="card-thumb" loading="lazy" onerror="this.src='https://placehold.co/600x400/e2e8f0/475569?text=SMART+HOTDEAL'">
                    <div class="card-badges">
                        <span class="badge-discount">🔥 ${item.discount_rate || 0}% 특가</span>
                        ${rocketBadge}
                    </div>
                    <span class="badge-category">${item.category || "추천특가"}</span>
                </div>
                <div class="card-body">
                    <h2 class="product-title">${item.title}</h2>
                    <div class="price-row">
                        <span class="discount-pct">${item.discount_rate || 0}%</span>
                        <span class="sale-price">${formatPrice(item.sale_price)}</span>
                        ${originalPriceHtml}
                    </div>
                    <div class="rating-row">
                        <span class="stars">★ ${item.rating || "4.8"}</span>
                        <span>(리뷰 ${formatNumber(item.review_count || 100)}+개)</span>
                    </div>
                    <div class="ai-curation-box">
                        <span class="ai-curation-label">💡 에디터 핵심 요약</span>
                        ${item.ai_comment || "주간 판매량 및 할인율 기준 베스트 추천 상품입니다."}
                    </div>
                    <div class="card-footer">
                        <a href="${item.affiliate_url}" target="_blank" rel="noopener sponsored" class="cta-btn">
                            <span>쿠팡 특가 및 상세스펙 확인하기</span>
                            <span>👉</span>
                        </a>
                    </div>
                </div>
            `;

            dealsGrid.appendChild(card);
        });
    }

    // 이벤트 리스너 등록
    if (categoryTabs) {
        categoryTabs.addEventListener("click", (e) => {
            const btn = e.target.closest(".tab-btn");
            if (!btn) return;
            document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            currentCategory = btn.getAttribute("data-category") || "all";
            renderDeals();
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            searchQuery = e.target.value || "";
            renderDeals();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener("change", (e) => {
            currentSort = e.target.value || "featured";
            renderDeals();
        });
    }

    if (resetFilterBtn) {
        resetFilterBtn.addEventListener("click", () => {
            currentCategory = "all";
            searchQuery = "";
            currentSort = "featured";
            if (searchInput) searchInput.value = "";
            if (sortSelect) sortSelect.value = "featured";
            document.querySelectorAll(".tab-btn").forEach((b) => {
                b.classList.toggle("active", b.getAttribute("data-category") === "all");
            });
            renderDeals();
        });
    }

    loadDealsData();
})();
