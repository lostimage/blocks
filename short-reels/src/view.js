import { PlayerControls } from './player-controls';
import { Lightbox } from './lightbox';
import NewBlockLoader from "./blockLoader";
import {ShareManager} from "./share";

export class JWReelsPlayer {
    constructor(containerElement) {
        this.containerElement = containerElement;
        this.isOpen = false;
        this.loadMoreObserver = null;
        this.initializedPlayers = new Set();
        this.lightbox = new Lightbox();
        this.playerControls = new Map();
        this.shareManager = new ShareManager();
        this.currentPlayer = null;
        this.observer = null;
        this.downloadClickHandler = null;

        this.isLoading = false;
        this.offset = this.containerElement.querySelectorAll('.bn-video-tile-item').length;
        const attrs = JSON.parse(this.containerElement.dataset.attr || '{}');
        this.postsPerPage = parseInt(attrs.posts_per_page) || 6;
        this.order = attrs.order || 'DESC';
        this.orderby = attrs.orderby || 'date';
        this.category = this.containerElement.dataset.queryCategory || '';
        this.currentFilter = null;
        this.currentVideoId = null;
        this.players = new Map();
        this.totalShortsItems = 0;
        this.currentShortIndex = -1;
        this.prevButtonHandler = null;
        this.nextButtonHandler = null;

        this.initializeHandlers();
        this.handleURLParameters();
    }

    initializeHandlers() {
        this.attachFigureClickHandlers();
        this.attachLightboxHandlers();
        this.attachKeyboardHandlers();
    }

    attachFigureClickHandlers() {
        const figures = this.containerElement.querySelectorAll('.bn-video-tile-item figure');
        figures.forEach(figure => {
            figure.addEventListener('click', (event) => {
                event.preventDefault();
                const articleElement = figure.closest('.bn-video-tile-item');
                if (articleElement) {
                    this.openPopup(articleElement);
                }
            });
        });
    }

    attachLightboxHandlers() {
        this.lightbox.addCloseHandler(() => this.closePopup());
    }

    attachKeyboardHandlers() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closePopup();
            }
        });
    }

    openPopup(clickedArticle) {
        this.isOpen = true;
        const container = clickedArticle.closest('.bn-w-100');
        const allArticles = Array.from(container.querySelectorAll('.bn-video-tile-item'));
        const clickedId = clickedArticle.dataset.id;
        const clickedIndex = allArticles.findIndex(article => article.dataset.id === clickedId);
        const remainingItems = allArticles.length - clickedIndex;
        if (remainingItems <= 4 && !this.isLoading) {
            this.handleLoadMore();
        }

        this.updateURLWithShortId(clickedId);
        this.setupShortsList(allArticles, clickedId);
        this.lightbox.show();
        this.setupVideoObserver(clickedId);
        this.setupNavigation();
    }

    setupShortsList(articles, activeId) {
        const shortsList = this.lightbox.getShortsContainer();
        shortsList.innerHTML = '';

        this.totalShortsItems = articles.length;

        const activeShortItem = this.createInitialShortItems(articles, activeId, shortsList);
        activeShortItem.dataset.firstinit = 'true';

        const items = Array.from(shortsList.querySelectorAll('.jwplayer-short-item'));
        this.currentShortIndex = items.findIndex(item => item.dataset.id === activeId);

        this.initializeActiveVideo(activeShortItem, articles, activeId);
        this.setupVideoObservers(shortsList, articles, activeId);
        this.scrollToActiveItem(activeShortItem);
    }

    createInitialShortItems(articles, activeId, shortsList) {
        let activeShortItem = null;

        articles.forEach((article) => {
            const shortItem = this.createShortItem(article);
            shortItem.dataset.initialized = 'false';
            shortsList.appendChild(shortItem);

            const currentId = article.dataset.id;
            if (currentId === activeId) {
                activeShortItem = shortItem;
            }
        });

        return activeShortItem;
    }

    initializeActiveVideo(activeShortItem, articles, activeId) {
        if (!activeShortItem) return;

        const activeArticle = articles.find(article => article.dataset.id === activeId);
        if (!activeArticle) return;

        const player = this.initializePlayer(activeArticle, activeShortItem, true);
        if (player) {
            this.handleActivePlayerSetup(player, activeShortItem, activeArticle, activeId);

            this.players.forEach((p, id) => {
                if (id !== activeId) {
                    p.setMute(true);
                } else {
                    //p.setMute(this.playerControls.get(`jwplayer-${id}`).globalMuted);
                }
            });

            this.currentPlayer = player;
        }
    }

    handleActivePlayerSetup(player, activeShortItem, activeArticle, activeId) {
        activeShortItem.dataset.initialized = 'true';
        this.currentVideoId = activeId;
        this.players.set(activeId, player);
        this.setupPlayerControls(player, activeShortItem, activeArticle);

        player.on('play', () => {
            this.preRenderNextVideo();
        });
    }

    scrollToActiveItem(activeShortItem) {
        if (activeShortItem) {
            requestAnimationFrame(() => {
                activeShortItem.scrollIntoView({
                    behavior: 'instant',
                    block: 'start'
                });
            });
        }
    }

    setupVideoObservers(shortsList, articles, activeId) {
        const initObserver = this.createIntersectionObserver(articles, activeId);
        const loadMoreObserver = this.createLoadMoreObserver();

        shortsList.querySelectorAll('.jwplayer-short-item').forEach(item => {
            initObserver.observe(item);
        });

        this.observePreLastItem(loadMoreObserver, shortsList);

        this.initObserver = initObserver;
        this.loadMoreObserver = loadMoreObserver;
    }

    observePreLastItem(observer, shortsList) {
        const items = shortsList.querySelectorAll('.jwplayer-short-item');
        if (items.length < 4) return; // Need at least 2 items to have a pre-last item

        const preLastItem = items[items.length - 4];
        if (preLastItem) {
            observer.observe(preLastItem);
        }
    }

    createLoadMoreObserver() {
        return new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isLoading) {
                    this.handleLoadMore();
                }
            });
        }, {
            rootMargin: '0px',
            threshold: 0.1
        });
    }

    async handleLoadMore() {
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            const params = {
                posts_per_page: this.postsPerPage,
                offset: this.containerElement.querySelectorAll('.bn-video-tile-item').length,
                order: this.order,
                orderby: this.orderby,
                category: this.containerElement.dataset.queryCategory || '',
                filter: this.currentFilter
            };

            const response = await fetch(shortReelsSettings.rest_url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params)
            });

            const data = await response.json();
            if (data.success) {

                await this.appendNewArticles(data.html);

                if (this.isOpen) {
                    await this.appendNewPopupItems();
                }

                this.offset += this.postsPerPage;

                this.refreshLoadMoreObserver();

                if (!data.hasMore) {
                    this.loadMoreObserver?.disconnect();
                }
            }
        } catch (error) {
            console.error('Error loading more videos:', error);
        } finally {
            this.isLoading = false;
        }
    }

    async appendNewArticles(html) {
        const container = this.containerElement.querySelector('.js-jw-reels-container');
        const loader = container.querySelector('.jw-reels-loader');
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = html;

        while (tempContainer.firstChild) {
            container.insertBefore(tempContainer.firstChild, loader);
        }

        this.attachClickHandlersToNewArticles(container);
    }

    async appendNewPopupItems() {
        const shortsList = this.lightbox.getShortsContainer();
        const container = this.containerElement.querySelector('.js-jw-reels-container');

        const existingIds = new Set(
            Array.from(shortsList.querySelectorAll('.jwplayer-short-item'))
                .map(item => item.dataset.id)
        );

        const newArticles = Array.from(container.querySelectorAll('.bn-video-tile-item'))
            .filter(article => !existingIds.has(article.dataset.id));

        for (const article of newArticles) {
            const shortItem = this.createShortItem(article);
            shortsList.appendChild(shortItem);
            shortItem.dataset.initialized = 'false';
            shortItem.dataset.preload = 'false';
            this.initObserver?.observe(shortItem);
        }

        this.totalShortsItems = shortsList.querySelectorAll('.jwplayer-short-item').length;

        if (this.navigationHandlers?.refreshItems) {
            this.navigationHandlers.refreshItems();
        }
    }

    attachClickHandlersToNewArticles(container) {
        const newFigures = container.querySelectorAll('.bn-video-tile-item figure:not([data-handler-attached])');
        newFigures.forEach(figure => {
            figure.dataset.handlerAttached = 'true';
            figure.addEventListener('click', (event) => {
                event.preventDefault();
                const articleElement = figure.closest('.bn-video-tile-item');
                if (articleElement) {
                    this.openPopup(articleElement);
                }
            });
        });
    }

    refreshLoadMoreObserver() {
        if (this.loadMoreObserver) {
            this.loadMoreObserver.disconnect();
            const shortsList = this.lightbox.getShortsContainer();
            this.observePreLastItem(this.loadMoreObserver, shortsList);
        }
    }

    createIntersectionObserver(articles, activeId) {
        return new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                this.handleIntersectionChange(entry, articles, activeId);
            });
        }, {
            threshold: 0.75,
            rootMargin: '50% 0px'
        });
    }

    handleIntersectionChange(entry, articles, activeId) {
        const shortItem = entry.target;
        const articleId = shortItem.dataset.id;

        if (entry.isIntersecting) {
            const items = Array.from(this.lightbox.getShortsContainer().querySelectorAll('.jwplayer-short-item'));
            const index = items.findIndex(item => item.dataset.id === articleId);

            this.currentShortIndex = index;
            this.currentVideoId = articleId;
            this.updateURLWithShortId(articleId);

            this.lightbox.updateNavigationButtons(index, this.totalShortsItems);

            this.handleVideoEnteringView(shortItem, articleId, articles, activeId);
        } else {
            this.handleVideoLeavingView(shortItem, articleId, activeId);
        }
    }

    handleVideoEnteringView(shortItem, articleId, articles) {
		// Dispatch custom event when video enters view
		const videoViewEvent = new CustomEvent('shorts:video:enter', {
			detail: {
				shortItem,
				articleId,
				videoTitle: shortItem.dataset.title,
				player: this.players.get(articleId)
			}
		});
		document.dispatchEvent(videoViewEvent);

        let article = articles.find(a => a.dataset?.id === articleId);
        if (!article) {
            article = this.containerElement.querySelector(`.bn-video-tile-item[data-id="${articleId}"]`);
        }
        shortItem.classList.add('jwplayer-short-item-active');
        if (shortItem.dataset.initialized === 'true') {
            const player = this.players.get(articleId);
            if (player) {
                this.currentVideoId = articleId;
                if(shortItem.dataset.preload === 'true') {
                    this.setupPlayerControls(player, shortItem, article);
                }
                // in iphone, the stage is buffering for first video but idle for android.
                player.play();
                player.setMute(false);
                player.play(); //fix autoplay for load more video
                setTimeout(() => {
                    if(player.getState() === 'paused') {
                        player.play();
                        console.log('remain paused');
                    }
                }, 500)
                this.preRenderNextVideo();
                return;
            }
        }

        if (article) {
            const player = this.initializePlayer(article, shortItem, true);
            if (player) {
                shortItem.dataset.initialized = 'true';
                this.currentVideoId = articleId;
                this.players.set(articleId, player);
                this.setupPlayerControls(player, shortItem, article);

                player.on('play', () => {
                    this.preRenderNextVideo();
                });

                this.players.forEach((p, id) => {
                    if (id !== articleId) {
                        p.setMute(true);
                    } else {
                        //p.setMute(this.playerControls.get(`jwplayer-${id}`).globalMuted);
                    }
                });
            }
        }
    }

    muteOtherPlayers(){

    }

    handleVideoLeavingView(shortItem, articleId, activeId) {
        shortItem.classList.remove('jwplayer-short-item-active');
        if (shortItem.dataset.initialized === 'true' && articleId !== activeId) {
            const player = this.players.get(articleId);
            if(player) {
                player.pause();
            }
        }
    }

    cleanupPreviousPlayer(activeId) {
        const shortsList = this.lightbox.getShortsContainer();
        const items = Array.from(shortsList.querySelectorAll('.jwplayer-short-item'));
        const currentIndex = items.findIndex(item => item.dataset.id === activeId);

        items.forEach((item, index) => {
            const itemId = item.dataset.id;
            if (Math.abs(index - currentIndex) > 2 && itemId !== activeId) {
                const player = this.players.get(itemId);
                if (player) {
                    this.cleanupPlayer(player, item);
                    this.players.delete(itemId);
                }
            }
        });
    }

    initializeNewPlayer(shortItem, articleId, articles) {
        const article = articles.find(a => a.dataset.id === articleId);
        if (!article) return null;

        const player = this.initializePlayer(article, shortItem, true);
        if (player) {
            shortItem.dataset.initialized = 'true';
            this.currentVideoId = articleId;
            this.players.set(articleId, player);
            this.setupPlayerControls(player, shortItem, article);

            player.on('play', () => {
                this.preRenderNextVideo();
            });
        }
        return player;
    }

    cleanupPlayer(player, shortItem) {
        try {
            if (player) {
                player.remove();
                shortItem.dataset.initialized = 'false';
                shortItem.dataset.preload = 'false';
                this.cleanupPlayerControls(shortItem);
                this.recreatePlayerContainer(shortItem);
            }
        } catch (e) {
            console.error('Error destroying player:', e);
        }
    }

    cleanupPlayerControls(shortItem) {
        const controls = shortItem.querySelector('.player-mute-button');
        if (controls) {
            controls.replaceWith(controls.cloneNode(true));
        }

        const downloadEl = shortItem.querySelector('.lightbox-download-button');
        if (downloadEl) {
            downloadEl.replaceWith(downloadEl.cloneNode(true));
        }

        const centerPlayButton = shortItem.querySelector('.center-play-button');
        if (centerPlayButton) {
            centerPlayButton.replaceWith(centerPlayButton.cloneNode(true));
        }
    }

    recreatePlayerContainer(shortItem) {
        const playerDiv = shortItem.querySelector(`[id^="jwplayer-"]`);
        if (playerDiv) {
            const newPlayerDiv = document.createElement('div');
            newPlayerDiv.id = playerDiv.id;
            playerDiv.parentNode.replaceChild(newPlayerDiv, playerDiv);
        }
    }

    createShortItem(article) {
		const shortItem = document.createElement('div');

		// Safely extract values with defaults
		const id = article?.dataset?.id || article?.id || '';
		const videoUrl = article?.dataset?.videoUrl || article?.videoUrl || '';
		const mediaId = article?.dataset?.mediaId || article?.mediaId || '';
		const title = article?.dataset?.title || article?.title || '';
		const ctaUrl = article?.dataset?.ctaUrl || article?.ctaUrl || '';
		const videoCats = article?.dataset?.category || article?.category || '';
		const videoCatIDs = article?.dataset?.categoryIds || article?.categoryIds || '';
		const videoDuration = article?.dataset?.duration || article?.duration || '';
		const link = article?.dataset?.link || article?.link || '';
		const ctaTitle = article?.dataset?.ctaTitle || article?.ctaTitle || 'Click Here';
		const ctaTitleLength = 30;
		const truncatedCtaTitle = (ctaTitle || '').trim().length > ctaTitleLength
			? ctaTitle.slice(0, ctaTitleLength) + '...'
			: ctaTitle.trim();
		const ctaTarget = article?.dataset?.ctaTarget || article?.ctaTarget || '_self';

		// Set dataset values with safe defaults
		shortItem.dataset.id = id;
		shortItem.dataset.videoUrl = videoUrl;
		shortItem.dataset.mediaId = mediaId;
		shortItem.dataset.title = title;
		shortItem.dataset.ctaUrl = ctaUrl;
		shortItem.dataset.category = videoCats;
		shortItem.dataset.categoryIds = videoCatIDs;
		shortItem.dataset.duration = videoDuration;
		shortItem.dataset.ctaTitle = truncatedCtaTitle;
		shortItem.dataset.ctaTarget = ctaTarget;
		shortItem.dataset.initialized = 'false';
		shortItem.dataset.preload = 'false';
		shortItem.className = 'jwplayer-short-item';

		// Create HTML with safe values
		shortItem.innerHTML = `
			<div id="jwplayer-${id}"></div>
			<div class="gradient-overlay"></div>
			<div class="jw-video-title-cta">
				${this.createDescriptionHTML({ dataset: { title: title } })}
				${this.createCTAHTML(ctaUrl, truncatedCtaTitle, ctaTarget)}
			</div>
			${this.createCenterPlayButtonHTML()}
			${this.createControlsHTML()}
			${this.createShareButtonHTML(id, title)}
		`;

		const shareWrapper = shortItem.querySelector('.jw-sharing-wrapper');
		if (shareWrapper) {
			this.shareManager.setupEventListeners(shareWrapper, id);
		}

		// Add event listeners for gradient overlay
		const titleElement = shortItem.querySelector('.video-info__title');
		const gradientOverlay = shortItem.querySelector('.gradient-overlay');

		if (gradientOverlay) {
			const showGradient = () => {
				gradientOverlay.style.display = 'block';
				requestAnimationFrame(() => {
					gradientOverlay.style.opacity = '1';
				});
			};

			const hideGradient = () => {
				gradientOverlay.style.opacity = '0';
				setTimeout(() => {
					gradientOverlay.style.display = 'none';
				}, 300);
			};

			const hasSelectedText = () => {
				const selection = window.getSelection();
				return selection?.toString().length > 0;
			};

			shortItem.addEventListener('mouseup', () => {
				if (hasSelectedText()) {
					showGradient();
				}
			});

			const titleCtaArea = shortItem.querySelector('.jw-video-title-cta');
			if (titleCtaArea) {
				titleCtaArea.addEventListener('click', (e) => {
					if (!e.target.closest('.video-cta-button')) {
						showGradient();
					}
				});
			}

			if (titleElement) {
				titleElement.addEventListener('focus', showGradient);
				titleElement.addEventListener('blur', (e) => {
					if (!hasSelectedText()) {
						hideGradient();
					}
				});
			}
		}

		return shortItem;
	}

    createDescriptionHTML(article) {
        const title = article.dataset?.title || '';
        const description = article.dataset?.description || '';
        return `
            <div class="video-info">
                    <div class="video-info__title">
                        ${title}
                    </div>
            </div>
        `;
    }

    createControlsHTML() {
        return `
            <div class="custom-video-controls">
            ${this.createPlayPauseButtonHTML()}
             ${this.createMuteButtonHTML()}
            </div>
            ${this.createDownloadButtonHTML()}
        `;
    }

    createMuteButtonHTML() {
        return `
            <button class="player-mute-button">
                <span class="player-mute-icon volume-icon">
                 <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <path fill-rule="evenodd" clip-rule="evenodd" d="M5.94723 3.51109C7.11136 1.76489 9.83325 2.58901 9.83325 4.68768L9.83325 11.3125C9.83325 13.4112 7.11136 14.2353 5.94723 12.4891C5.39648 11.663 4.46928 11.1668 3.47639 11.1668H3.2528C1.91652 11.1668 0.833252 10.0835 0.833252 8.74723V7.25299C0.833252 5.91671 1.91652 4.83344 3.2528 4.83344H3.47639C4.46928 4.83344 5.39647 4.33722 5.94723 3.51109ZM12.4163 3.3763C12.0719 3.14626 11.6062 3.23902 11.3761 3.58349C11.1461 3.92795 11.2388 4.39368 11.5833 4.62371C12.553 5.2713 13.2498 6.51951 13.2498 8C13.2498 9.4805 12.553 10.7287 11.5833 11.3763C11.2388 11.6063 11.1461 12.0721 11.3761 12.4165C11.6062 12.761 12.0719 12.8538 12.4163 12.6237C13.8378 11.6744 14.7498 9.93797 14.7498 8C14.7498 6.06204 13.8378 4.32557 12.4163 3.3763ZM11.7497 6.04296C11.4052 5.81293 10.9395 5.90569 10.7094 6.25015C10.4794 6.59462 10.5722 7.06034 10.9166 7.29038C11.0893 7.40568 11.2498 7.659 11.2498 8C11.2498 8.34101 11.0893 8.59433 10.9166 8.70963C10.5722 8.93967 10.4794 9.40539 10.7094 9.74986C10.9395 10.0943 11.4052 10.1871 11.7497 9.95705C12.3741 9.54006 12.7498 8.79848 12.7498 8C12.7498 7.20153 12.3741 6.45995 11.7497 6.04296Z" fill="currentColor"/>
                 </svg>
                 <span>Mute</span>
                </span>
                <span class="player-mute-icon mute-icon">
                 <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M2.53001 1.46935C2.23711 1.17646 1.76224 1.17646 1.46934 1.46935C1.17645 1.76224 1.17645 2.23712 1.46935 2.53001L3.52235 4.58301H3.52139H3.52039H3.51939H3.51839H3.51739H3.51639H3.51539H3.51439H3.5134H3.5124H3.5114H3.5104H3.50941H3.50841H3.50741H3.50642H3.50542H3.50442H3.50343H3.50243H3.50144H3.50044H3.49945H3.49845H3.49746H3.49646H3.49547H3.49448H3.49348H3.49249H3.4915H3.4905H3.48951H3.48852H3.48753H3.48653H3.48554H3.48455H3.48356H3.48257H3.48158H3.48059H3.4796H3.47861H3.47761H3.47662H3.47564H3.47465H3.47366H3.47267H3.47168H3.47069H3.4697H3.46871H3.46773H3.46674H3.46575L3.43755 4.58301H3.43753C3.08848 4.583 2.78244 4.58298 2.52936 4.60367C2.2607 4.62563 1.98645 4.67459 1.72053 4.81008C1.32852 5.00982 1.00982 5.32853 0.810079 5.72053C0.674566 5.98649 0.625621 6.26083 0.603666 6.52954C0.582981 6.78271 0.582994 7.08889 0.583009 7.43815L0.583009 7.46635L0.58301 8.53301L0.583009 8.56121C0.582994 8.91047 0.582981 9.21665 0.603666 9.46982C0.625621 9.73853 0.674567 10.0129 0.81008 10.2788C1.00982 10.6708 1.32853 10.9895 1.72053 11.1893C1.98649 11.3248 2.26082 11.3737 2.52954 11.3957C2.78271 11.4164 3.08888 11.4164 3.43813 11.4163H3.46634H4.32746C4.64321 11.4163 4.69578 11.4199 4.73593 11.4281L4.88571 10.6932L4.73593 11.4281C4.84735 11.4508 4.9497 11.5056 5.0304 11.5857C5.05948 11.6146 5.0916 11.6563 5.26675 11.919L5.28065 11.9399C5.66794 12.5208 5.97664 12.9839 6.22872 13.3198C6.46069 13.6289 6.73493 13.9609 7.07409 14.1291C8.05995 14.618 9.25603 14.2558 9.80512 13.3022C9.99403 12.9741 10.0381 12.5458 10.0596 12.1599C10.0751 11.8817 10.0804 11.5431 10.0821 11.1428L13.4693 14.53C13.7622 14.8229 14.2371 14.8229 14.53 14.53C14.8229 14.2371 14.8229 13.7622 14.53 13.4693L9.86334 8.80268L5.73031 4.66966L2.53001 1.46935ZM9.80512 2.69717C9.25603 1.74352 8.05995 1.38138 7.07409 1.87028C6.81137 2.00057 6.60114 2.21946 6.43224 2.42131C6.25253 2.63607 6.05397 2.91394 5.82896 3.24309C5.62847 3.53639 5.66126 3.93012 5.90752 4.1862L8.79241 7.1862C9.00452 7.40678 9.32938 7.47637 9.61323 7.36203C9.89709 7.24769 10.083 6.97236 10.083 6.66635L10.083 5.53856V5.51344C10.083 4.81528 10.083 4.25876 10.0596 3.83945C10.0381 3.45356 9.99402 3.02525 9.80512 2.69717ZM12.4162 3.37597C12.0717 3.14593 11.606 3.23869 11.376 3.58316C11.1459 3.92762 11.2387 4.39335 11.5832 4.62339C12.5529 5.27098 13.2497 6.51918 13.2497 7.99968C13.2497 8.61746 13.1278 9.19773 12.9138 9.71109C12.8311 9.90945 12.7348 10.0976 12.6265 10.274C12.4098 10.6271 12.5204 11.0889 12.8734 11.3056C13.2264 11.5222 13.6882 11.4117 13.9049 11.0587C14.0543 10.8152 14.1861 10.5576 14.2983 10.2883C14.5888 9.59137 14.7497 8.81488 14.7497 7.99968C14.7497 6.06171 13.8377 4.32525 12.4162 3.37597ZM11.7495 6.04264C11.4051 5.8126 10.9393 5.90536 10.7093 6.24983C10.4793 6.59429 10.572 7.06002 10.9165 7.29005C11.0891 7.40535 11.2497 7.65867 11.2497 7.99968C11.2497 8.1398 11.222 8.26782 11.1762 8.37776C11.0168 8.76009 11.1976 9.19922 11.5799 9.3586C11.9622 9.51798 12.4014 9.33725 12.5607 8.95493C12.6831 8.66145 12.7497 8.33722 12.7497 7.99968C12.7497 7.2012 12.3739 6.45963 11.7495 6.04264Z" fill="currentColor"/>
                 </svg>
                 <span>Unmute</span>
                </span>
            </button>
        `;
    }

    createCenterPlayButtonHTML() {
        return `
        <button class="center-play-button" style="opacity: 1">
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none">
                <path d="M8 5V19L19 12L8 5Z" fill="white"/>
            </svg>
        </button>
    `;
    }

    createCTAHTML(url, title, target = '_self') {
        if (!url || !title) {
            return '';
        }

        return `
            <div class="video-cta-wrapper">
                <a href="${url}" class="video-cta-button bn-rounded-lg bn-bg-[var(--text-brand-primary)] bn-px-3 bn-py-2 bn-text-\[14px\] bn-font-semibold bn-w-full bn-justify-center bn-text-theme-8 bn-no-underline" target="${target}">
                    ${title}
                </a>
            </div>
        `;
    }


    createPlayPauseButtonHTML() {
        return `
            <button class="play-pause-button">
                <svg class="play-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M8 5V19L19 12L8 5Z" fill="white"/>
                </svg>
                <svg class="pause-icon" style="display:none;" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M6 4H10V20H6V4ZM14 4H18V20H14V4Z" fill="white"/>
                </svg>
            </button>
        `;
    }

    createDownloadButtonHTML() {
        return `
            <button class="lightbox-download-button">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g id="align-bottom-rec">
                    <path id="Vector" fill-rule="evenodd" clip-rule="evenodd" d="M3.98005 1.79497C5.04961 1.25 6.44974 1.25 9.25 1.25H14.75C17.5503 1.25 18.9504 1.25 20.02 1.79497C20.9608 2.27433 21.7257 3.03924 22.205 3.98005C22.75 5.04961 22.75 6.44974 22.75 9.25V14.75C22.75 17.5503 22.75 18.9504 22.205 20.02C21.7257 20.9608 20.9608 21.7257 20.02 22.205C18.9504 22.75 17.5503 22.75 14.75 22.75H9.25C6.44974 22.75 5.04961 22.75 3.98005 22.205C3.03924 21.7257 2.27433 20.9608 1.79497 20.02C1.25 18.9504 1.25 17.5503 1.25 14.75V9.25C1.25 6.44974 1.25 5.04961 1.79497 3.98005C2.27433 3.03924 3.03924 2.27433 3.98005 1.79497ZM12.75 6C12.75 5.58579 12.4142 5.25 12 5.25C11.5858 5.25 11.25 5.58579 11.25 6V10.4645C11.25 11.101 10.4804 11.4198 10.0303 10.9697C9.73745 10.6768 9.26257 10.6768 8.96968 10.9697C8.67679 11.2626 8.67679 11.7374 8.96968 12.0303L11.4697 14.5303C11.6103 14.671 11.8011 14.75 12 14.75C12.1989 14.75 12.3897 14.671 12.5303 14.5303L14.9919 12.0688C15.2848 11.7759 15.2848 11.301 14.9919 11.0081C14.699 10.7152 14.2241 10.7152 13.9312 11.0081C13.4953 11.444 12.75 11.1353 12.75 10.5189V6ZM7 17.25C6.58579 17.25 6.25 17.5858 6.25 18C6.25 18.4142 6.58579 18.75 7 18.75H17C17.4142 18.75 17.75 18.4142 17.75 18C17.75 17.5858 17.4142 17.25 17 17.25H7Z" fill="currentColor"/>
                    </g>
                </svg>
                <span>
                    Download
                </span>
            </button>
        `;
    }

    createShareButtonHTML(shortId, title) {
        if (!shortId) return '';

        return this.shareManager.createShareButton(shortId, title).outerHTML;
    }

    preRenderNextVideo() {
        const shortsList = this.lightbox.getShortsContainer();
        const items = Array.from(shortsList.querySelectorAll('.jwplayer-short-item'));
        const currentIndex = items.findIndex(item => item.dataset.id === this.currentVideoId);

        if (currentIndex === -1) return;

        const keepIndices = new Set([
            currentIndex,
            currentIndex + 1,
            currentIndex - 1
        ]);

        for (const index of keepIndices) {
            if (index >= 0 && index < items.length) {
                const item = items[index];
                this.preRenderItem(item);
            }
        }

        items.forEach((item, index) => {
            if (!keepIndices.has(index) && item.dataset.initialized === 'true') {
                const player = this.players.get(item.dataset.id);
                if (player) {
                    this.cleanupPlayer(player, item);
                    this.players.delete(item.dataset.id);
                }
            }
        });
    }

    preRenderItem(item) {
        if (!item || item.dataset.initialized === 'true') return;

        const articleId = item.dataset.id;
        const article = this.containerElement.querySelector(`.bn-video-tile-item[data-id="${articleId}"]`);

        if (!article) return;

        const player = this.initializePlayer(article, item, false);
        if (player) {
            item.dataset.initialized = 'true';
            item.dataset.preload = 'true';
        }
    }


    initializePlayer(article, shortItem, autoplay) {
        const _playerControls = new PlayerControls();
        const player = _playerControls.initializePlayer(article.dataset, autoplay);
        this.playerControls.set(player.id, _playerControls);
        this.players.set(article.dataset.id, player);
        return player;
    }

    setupPlayerControls(player, shortItem, article) {
        const controls = this.getControlElements(shortItem);
        const centerPlayButton = shortItem.querySelector('.center-play-button');
        const playerContainer = shortItem.querySelector('.jw-video');

        this.setupPlayPauseControl(player, controls.playPauseButton);
        const localMuteButton = shortItem.querySelector('.player-mute-button');
        const localDownloadButton = shortItem.querySelector('.lightbox-download-button');
        this.setupMuteControl(player, localMuteButton);
        this.setupDownloadControl(article, localDownloadButton);
        this.setupCenterPlayButton(player, centerPlayButton);
        const excludedSelectors = [
            '.custom-video-controls',
            '.center-play-button',
            '.video-cta-button',
            '.player-mute-button',
            '.lightbox-download-button',
            '.jw-sharing-wrapper',
            // '.jw-video-title-cta'
        ];
        const clickHandler = (e) => {
            const isExcluded = excludedSelectors.some(selector =>
                e.target.closest(selector)
            );

            if (!isExcluded) {
                e.preventDefault();
                e.stopPropagation();
                this.togglePlayPause(player);
            }
        };

        shortItem.playerClickHandler = clickHandler;
        shortItem.addEventListener('click', clickHandler);
        this.setupPlayerEventListeners(player, controls, centerPlayButton);
    }

    setupCenterPlayButton(player, button) {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePlayPause(player);
        });
    }

    getControlElements(shortItem) {
        const controls = shortItem.querySelector('.custom-video-controls');
        return {
            playPauseButton: controls.querySelector('.play-pause-button'),
            muteButton: controls.querySelector('.player-mute-button'),
            downloadButton: shortItem.querySelector('.lightbox-download-button')
        };
    }

    setupPlayPauseControl(player, button) {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePlayPause(player, button);
        });
    }

    togglePlayPause(player, button) {
        if(!player) return;
        const isPlaying = player.getState() === 'playing';
        const shortItem = this.getShortItemFromPlayer(player);

        if (!shortItem) return;

        const playPauseButton = shortItem.querySelector('.play-pause-button');
        const centerPlayButton = shortItem.querySelector('.center-play-button');

        if (isPlaying) {
            player.pause();
            this.updatePlayPauseState(false, centerPlayButton);
        } else {
            player.play();
            this.updatePlayPauseState(true, centerPlayButton);
        }
    }

    getShortItemFromPlayer(player) {
        return document.querySelector(`#${player.id}`).closest('.jwplayer-short-item');
    }

    setupMuteControl(player, muteButton) {
        if (!muteButton) return;
        muteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMute(player , muteButton);
        });

        player.on('mute', () => {
            this.playerControls.get(player.id).updateMuteIcon(player, muteButton);
        });
        this.playerControls.get(player.id).updateMuteIcon(player, muteButton);
    }

    toggleMute(player, button) {
        if(!player || !button) return;
        const isMuted = player.getMute();
        player.setMute(!isMuted);
        this.playerControls.get(player.id).updateMuteIcon(player, button);

        //this.playerControls.get(player.id).setGlobalMute(!isMuted);
        this.players.forEach((p, playerId) => {
            if (player !== p) {
                p.setMute(true);
                const otherMuteButton = document
                    .querySelector(`[data-id="${playerId}"] .player-mute-button`);
                if (otherMuteButton) {
                    this.playerControls.get(p.id).updateMuteIcon(p, otherMuteButton);
                }
            }
        });
    }

    setupDownloadControl(article, button) {
        const downloadClickHandler = (e) => {
            e.stopPropagation();
            this.handleDownload(article);
        }
        button.addEventListener('click', downloadClickHandler);
    }

    handleDownload(article) {
        const mediaId = article.dataset.mediaId;
        const reelLink = article.dataset.link;
        const title = article.dataset.title;

        if (mediaId) {
            const baseUrl = window.location.origin;
            const downloadUrl = `${baseUrl}/wp-json/jwp/v1/dw-video?media_id=${mediaId}${reelLink ? `&reel_link=${reelLink}` : ''}`;
            const downloadLink = document.createElement('a');
            downloadLink.href = downloadUrl;
            downloadLink.target = '_blank';
            downloadLink.style.display = 'none';
            downloadLink.click();
            downloadLink.remove();
        }
    }


    setupPlayerEventListeners(player, controls, centerPlayButton) {
        const shortItem = this.getShortItemFromPlayer(player);
        player.on('play', () => {
            shortItem.classList.add('jw-video-playing');
            this.players.forEach((p) => {
                if (p !== player) {
                    p.pause();
                }
            });
            this.updatePlayPauseState(true, controls.playPauseButton, centerPlayButton);
        });

        player.on('pause', () => {
            shortItem.classList.remove('jw-video-playing');
            this.updatePlayPauseState(false, controls.playPauseButton, centerPlayButton);
        });
    }


    updatePlayPauseState(isPlaying, playPauseButton, centerPlayButton) {
        if (playPauseButton) {
            const playIcon = playPauseButton.querySelector('.play-icon');
            const pauseIcon = playPauseButton.querySelector('.pause-icon');

            if(playIcon){
                playIcon.style.display = isPlaying ? 'none' : 'block';
                pauseIcon.style.display = isPlaying ? 'block' : 'none';
            }
        }

        if (centerPlayButton) {
            centerPlayButton.style.opacity = isPlaying ? '0' : '1';
            centerPlayButton.style.pointerEvents = isPlaying ? 'none' : 'auto';
        }
    }

    setupVideoObserver(clickedId) {
        this.observer = this.playerControls.get(`jwplayer-${clickedId}`).setupVideoObserver(
            this.lightbox.popupContainer,
            (player) => { this.currentPlayer = player; }
        );
    }

    closePopup() {
        if (!this.isOpen) return;

        if (this.originalURL) {
            const url = new URL(this.originalURL);
            url.searchParams.delete('open-popup');
            url.searchParams.delete('short_post_id');
            window.history.replaceState({}, '', url);
            this.originalURL = null;
        }

        this.isOpen = false;
        this.destroyPlayers();
        this.cleanupLightbox();
    }

    destroyPlayers() {
        this.lightbox.getShortsContainer()
            .querySelectorAll('.jwplayer-short-item div[id^="jwplayer-"]')
            .forEach(playerDiv => {
                try {
                    const player = jwplayer(playerDiv.id);
                    if (player && typeof player.destroy === 'function') {
                        player.destroy();
                    }
                } catch (e) {
                    console.error('Error destroying player:', e);
                }
            });
    }

    setupNavigation() {
        const shortsList = this.lightbox.getShortsContainer();
        let items = Array.from(shortsList.querySelectorAll('.jwplayer-short-item'));
        this.totalShortsItems = items.length;
        this.currentShortIndex = items.findIndex(item => item.dataset.id === this.currentVideoId);

        const navigateToVideo = (targetIndex) => {
            if (targetIndex < 0 || targetIndex >= this.totalShortsItems) return;

            const targetItem = items[targetIndex];
            if (!targetItem) return;

            targetItem.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });

            this.currentShortIndex = targetIndex;
            this.lightbox.updateNavigationButtons(targetIndex, this.totalShortsItems);
        };

        this.prevButtonHandler = () => navigateToVideo(this.currentShortIndex - 1);
        this.nextButtonHandler = () => navigateToVideo(this.currentShortIndex + 1);

        this.navigationHandlers = {
            refreshItems: () => {
                items = Array.from(shortsList.querySelectorAll('.jwplayer-short-item'));
                this.totalShortsItems = items.length;
                this.lightbox.updateNavigationButtons(this.currentShortIndex, this.totalShortsItems);
            },
            navigateToVideo
        };

        this.lightbox.addNavigationHandlers(this.prevButtonHandler, this.nextButtonHandler);
        this.lightbox.updateNavigationButtons(this.currentShortIndex, this.totalShortsItems);

        const handleKeyDown = (e) => {
            if (this.isOpen) {
                if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                    navigateToVideo(this.currentShortIndex - 1);
                } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                    navigateToVideo(this.currentShortIndex + 1);
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
    }

    cleanupNavigationControls() {
        const prevButton = this.lightbox.popupContainer.querySelector('.prev-button');
        const nextButton = this.lightbox.popupContainer.querySelector('.next-button');

        if (prevButton) {
            prevButton.replaceWith(prevButton.cloneNode(true));
        }

        if (nextButton) {
            nextButton.replaceWith(nextButton.cloneNode(true));
        }
    }

    cleanupLightbox() {
        this.lightbox.hide();
        this.lightbox.getShortsContainer().innerHTML = '';
        this.observer?.disconnect();
        this.initObserver?.disconnect();
        this.loadMoreObserver?.disconnect();

        if (this.prevButtonHandler || this.nextButtonHandler) {
            const prevButton = this.lightbox.popupContainer.querySelector('.prev-button');
            const nextButton = this.lightbox.popupContainer.querySelector('.next-button');

            if (prevButton && this.prevButtonHandler) {
                prevButton.removeEventListener('click', this.prevButtonHandler);
            }
            if (nextButton && this.nextButtonHandler) {
                nextButton.removeEventListener('click', this.nextButtonHandler);
            }
            this.cleanupNavigationControls();

            this.prevButtonHandler = null;
            this.nextButtonHandler = null;
            this.navigationHandlers = null;

        }

        this.players.clear();
        this.currentVideoId = null;
        this.currentPlayer = null;
        this.playerControls.clear();
        this.navigationHandlers = null;
    }

    handleURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const shortId = urlParams.get('short_post_id');
        const openPopup = urlParams.get('open-popup');

        if (shortId) {
            this.handleShortIdParam(shortId);
        } else if (openPopup === 'true') {
            this.handleOpenPopupParam();
        }
    }

    handleShortIdParam(shortId) {
        const article = this.containerElement.querySelector(`.bn-video-tile-item[data-id="${shortId}"]`);
        if (article) {
            this.openPopup(article);
        }
    }

    handleOpenPopupParam() {
        const firstArticle = this.containerElement.querySelector('.bn-video-tile-item');
        if (firstArticle) {
            this.openPopup(firstArticle);

            const url = new URL(window.location.href);
            url.searchParams.delete('open-popup');
            window.history.replaceState({}, '', url.toString());
        }
    }

    updateURLWithShortId(shortId) {
        if (!this.isOpen) return;

        if (!this.originalURL) {
            this.originalURL = window.location.href;
        }

        const url = new URL(window.location.href);
        url.searchParams.set('short_post_id', shortId);

        window.history.replaceState({ shortId }, '', url.toString());
    }
}

function initWhenJWPlayerReady() {
    if (typeof jwplayer === 'undefined') {
        setTimeout(initWhenJWPlayerReady, 100);
        return;
    }

    document.querySelectorAll('.wp-block-short-reels-short-reels').forEach(container => {
        if (!container.classList.contains('jw-initialized')) {
            container.classList.add('jw-initialized');
            const player = new JWReelsPlayer(container);
            console.log(container.jwReelsPlayer)
            container.jwReelsPlayer = player;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initWhenJWPlayerReady();
    document.querySelectorAll('.wp-block-short-reels-short-reels').forEach(container => {
        if (!container.classList.contains('blockloader-initialized')) {
            container.classList.add('blockloader-initialized');
            new NewBlockLoader(container);
        }
    });
});

