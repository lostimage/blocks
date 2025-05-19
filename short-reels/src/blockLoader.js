class NewBlockLoader {
    constructor(container) {
        this.container = container;
        this.loader = container.querySelector('.jw-reels-loader');
        this.isMobile = window.innerWidth <= 1024;
        this.observer = null;
        this.isLoading = false;
        this.offset = container.querySelectorAll('.bn-video-tile-item').length;
        const attrs = JSON.parse(container.dataset.attr || '{}');
        this.postsPerPage = parseInt(attrs.posts_per_page) || 6;
        this.order = attrs.order || 'DESC';
        this.orderby = attrs.orderby || 'date';
        this.category = container.dataset.queryCategory || '';
        this.reelsPlayer = null;

        this.init();
    }

    init() {
        if (!this.container || !this.loader) {
            return;
        }
        this.reelsPlayer = this.findReelsPlayerInstance();
        this.attachFilterHandlers();

        this.setupObserver();
    }

    attachFilterHandlers() {
        const filtersContainer = document.querySelector('.short-reels-filters');
        if (filtersContainer) {
            filtersContainer.addEventListener('click', async (event) => {
                event.preventDefault();
                const filterElement = event.target.closest('.js-filter-reels');
                if (!filterElement) return;

                const taxonomyId = filterElement.getAttribute('data-tax-id');
                this.updateCategoryInUrl(taxonomyId);
                this.updateSelectedFilter(filterElement);
                this.updateCategory(taxonomyId);

                await this.reloadItems();
            });
        }
    }

    async reloadItems() {
        if (!this.container) return;

        const contentContainer = this.container.querySelector('.js-jw-reels-container');
        if (!contentContainer) return;

        this.container.classList.add('bn_loading');

        this.offset = 0;

        try {
            const params = {
                posts_per_page: this.postsPerPage,
                offset: this.offset,
                order: this.order,
                orderby: this.orderby,
                category: this.category,
            };

            const response = await this.fetchMoreItems(params);

            if (response.success) {

                contentContainer.innerHTML = response.html;
                contentContainer.appendChild(this.loader);
                this.container.classList.remove('bn_loading');
                this.offset += this.postsPerPage;
                this.attachClickHandlersToNewCards(contentContainer);

                if (!response.hasMore) {
                    this.loader.style.display = 'none';
                    if (this.observer) {
                        this.observer.disconnect();
                    }
                } else {
                    this.loader.style.display = '';
                    if (this.observer) {
                        this.observer.disconnect();
                        this.setupObserver();
                    }
                }
            }
        } catch (error) {
            console.error('Error reloading items:', error);
        } finally {
            contentContainer.querySelector('.loading-spinner')?.remove();
        }
    }

    updateCategoryInUrl(taxonomyId) {
        const url = new URL(window.location);
        const params = url.searchParams;

        if (!taxonomyId) {
            params.delete('reels-category');
        } else {
            params.set('reels-category', taxonomyId);
        }

        window.history.replaceState({}, '', `${url.pathname}?${params}`);
    }

    updateCategory(taxonomyId) {
        this.category = taxonomyId;
        if (this.container) {
            this.container.setAttribute('data-query-category', taxonomyId); // Update in DOM
        }
    }

    updateSelectedFilter(activeFilter) {
        const filtersContainer = this.container.querySelector('.short-reels-filters');
        if (!filtersContainer) return;

        const filters = filtersContainer.querySelectorAll('.js-filter-reels');
        filters.forEach((filter) => {
            filter.classList.remove('selected');
        });

        activeFilter.classList.add('selected');
    }

    findReelsPlayerInstance() {
        const containerElements = document.querySelectorAll('.wp-block-short-reels-short-reels');
        for (let element of containerElements) {
            if (element === this.container) {
                return element.jwReelsPlayer;
            }
        }
        return null;
    }

    setupObserver() {
        const options = {
            root: null,
            rootMargin: '200px',
            threshold: 0.1,
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && !this.isLoading && this.isMobile) {
                    this.loadMoreItems();
                }
            });
        }, options);

        this.observer.observe(this.loader);
    }

    attachClickHandlersToNewCards(container) {
        const newFigures = container.querySelectorAll('.bn-video-tile-item figure:not([data-handler-attached])');
        newFigures.forEach(figure => {
            figure.dataset.handlerAttached = 'true';
            figure.addEventListener('click', (event) => {
                event.preventDefault();
                const articleElement = figure.closest('.bn-video-tile-item');
                if (articleElement && this.reelsPlayer) {
                    this.reelsPlayer.openPopup(articleElement);
                }
            });
        });
    }

    async loadMoreItems() {
        if (this.isLoading) {
            return;
        }
        this.isLoading = true;

        try {
            // Define parameters sent to REST API
            const params = {
                posts_per_page: this.postsPerPage,
                offset: this.container.querySelectorAll('.bn-video-tile-item').length,
                order: this.order,
                orderby: this.orderby,
                category: this.category,
            };

            // Fetch data from server
            const response = await this.fetchMoreItems(params);

            if (response.success) {
                const container = this.container.querySelector('.js-jw-reels-container');
                const tempContainer = document.createElement('div');
                tempContainer.innerHTML = response.html;

                while (tempContainer.firstChild) {
                    container.insertBefore(tempContainer.firstChild, this.loader);
                }

                this.attachClickHandlersToNewCards(container);

                this.offset += this.postsPerPage;
                if (!response.hasMore) {
                    this.loader.style.display = 'none';
                    this.observer.disconnect();
                }
            }
        } catch (error) {
            console.error('Error loading more items:', error);
        } finally {
            this.isLoading = false;
        }
    }

    async fetchMoreItems(params) {
        const response = await fetch(shortReelsSettings.rest_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

export default NewBlockLoader;
