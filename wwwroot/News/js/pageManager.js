class PageManager {
    // Constructor takes IDs of panels, item layout, and the callback function
    constructor(scrollPanelId, itemsPanelId, itemLayout, getItemsCallBack) {
        this.scrollPanel = $(`#${scrollPanelId}`);
        this.itemsPanel = $(`#${itemsPanelId}`);
        this.itemLayout = itemLayout;
        this.currentPage = { limit: -1, offset: -1 };
        this.isLoading = false; // Prevent overlapping updates
        this.endOfData = false; // Track end of data
        this.resizeTimer = null;
        this.resizeEndTriggerDelay = 300; // Debounce delay for resize
        this.getItems = getItemsCallBack;
        this.installViewportResizeEvent();
        this.reset();
    }

    reset() {
        this.resetScrollPosition();
        this.update(false); // Reset and fetch initial data
    }

    installViewportResizeEvent() {
        $(window).on('resize', () => {
            clearTimeout(this.resizeTimer);
            this.resizeTimer = setTimeout(() => {
                this.update(false); // Update layout after resize
            }, this.resizeEndTriggerDelay);
        });
    }

    setCurrentPageLimit() {
        let nbColumns = Math.trunc(this.scrollPanel.innerWidth() / this.itemLayout.width);
        nbColumns = Math.max(nbColumns, 1); // Ensure at least 1 column
        let nbRows = Math.round(this.scrollPanel.innerHeight() / this.itemLayout.height);
        this.currentPage.limit = nbRows * nbColumns + nbColumns; // Overflow buffer
    }

    currentPageToQueryString(append = false) {
        this.setCurrentPageLimit();
        let limit = this.currentPage.limit;
        let offset = this.currentPage.offset;
        if (!append) {
            limit = limit * (offset + 1); // Adjust limit for full reload
            offset = 0;
        }
        return `?limit=${limit}&offset=${offset}`;
    }

    scrollToElem(elemId) {
        let itemToReach = $(`#${elemId}`);
        if (itemToReach.length) {
            let itemsContainer = itemToReach.parent();
            this.scrollPanel.animate({
                scrollTop: itemToReach.offset().top - itemsContainer.offset().top
            }, 500);
        }
    }

    scrollPosition() {
        return this.scrollPanel.scrollTop();
    }

    storeScrollPosition() {
        this.previousScrollPosition = this.scrollPosition();
    }

    resetScrollPosition() {
        this.currentPage.offset = 0;
        this.scrollPanel.scrollTop(0);
    }

    restoreScrollPosition() {
        this.scrollPanel.scrollTop(this.previousScrollPosition);
    }

    async update(append = true) {
        if (this.isLoading || this.endOfData) return; // Prevent overlapping updates
        this.isLoading = true; // Mark as loading
        this.storeScrollPosition();

        if (!append) this.itemsPanel.empty(); // Clear items on reset

        try {
            this.endOfData = await this.getItems(this.currentPageToQueryString(append)); // Fetch items
        } catch (error) {
            console.error("Error fetching items:", error);
        }

        this.restoreScrollPosition();
        this.isLoading = false; // Mark as not loading

        // Reattach scroll listener
        this.scrollPanel.off('scroll').on('scroll', () => this.handleScroll());
    }

    handleScroll() {
        if (this.isLoading || this.endOfData) return;

        if (this.scrollPanel.scrollTop() + this.scrollPanel.outerHeight() >= this.itemsPanel.outerHeight() - this.itemLayout.height / 2) {
            this.currentPage.offset++;
            this.update(true); // Load more items
        }
    }
}
