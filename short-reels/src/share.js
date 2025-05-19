export class ShareManager {
    constructor() {
        this.isWebShareSupported = typeof navigator !== 'undefined' && 'share' in navigator;
    }

    createShareButton(shortId, title) {
        const shareContainer = document.createElement('div');
        shareContainer.className = 'jw-sharing-wrapper';
        shareContainer.innerHTML = this.getShareButtonHTML(shortId, title);
        return shareContainer;
    }

    getShareButtonHTML(shortId, title) {
        return `
            <button class="jw-share-button" aria-label="Open sharing menu" data-short-id="${shortId}" data-title="${title}">
                <svg class="share-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M8.53025 0.802998C8.23735 0.510105 7.76248 0.510105 7.46959 0.802998L4.80292 3.46966C4.51003 3.76256 4.51003 4.23743 4.80292 4.53033C5.09581 4.82322 5.57069 4.82322 5.86358 4.53033L7.24992 3.14399V6.16666H5.33325C4.86891 6.16666 4.63674 6.16666 4.44118 6.18592C2.54208 6.37297 1.03956 7.87548 0.852513 9.77459C0.833252 9.97015 0.833252 10.2023 0.833252 10.6667C0.833252 11.131 0.833252 11.3632 0.852513 11.5587C1.03956 13.4578 2.54208 14.9604 4.44118 15.1474C4.63674 15.1667 4.86891 15.1667 5.33325 15.1667H10.6666C11.1309 15.1667 11.3631 15.1667 11.5587 15.1474C13.4578 14.9604 14.9603 13.4578 15.1473 11.5587C15.1666 11.3632 15.1666 11.131 15.1666 10.6667C15.1666 10.2023 15.1666 9.97015 15.1473 9.77459C14.9603 7.87548 13.4578 6.37297 11.5587 6.18592C11.3631 6.16666 11.1309 6.16666 10.6666 6.16666H8.74992V3.14399L10.1363 4.53032C10.4291 4.82322 10.904 4.82322 11.1969 4.53032C11.4898 4.23743 11.4898 3.76256 11.1969 3.46966L8.53025 0.802998ZM8.74992 6.16666H7.24992V10.6667C7.24992 11.0809 7.5857 11.4167 7.99992 11.4167C8.41413 11.4167 8.74992 11.0809 8.74992 10.6667V6.16666Z" fill="currentColor"/>
                </svg>
                <span>Share</span>
            </button>
            ${this.isWebShareSupported ? '' : this.getShareMenuHTML(shortId, title)}
        `;
    }

    getShareMenuHTML(shortId, title) {
        return `
            <div class="jw-share-menu" style="display: none;">
                <div class="jw-share-menu-inner">
                    <button class="jw-share-menu-close" aria-label="Close sharing menu">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
                        </svg>
                    </button>
                    <h3>Share this video</h3>
                    <div class="jw-share-options">
                        ${this.getSocialShareOptions(shortId, title)}
                        ${this.getCopyLinkButton(shortId)}
                    </div>
                </div>
            </div>
        `;
    }

    getCurrentUrlWithShortId(shortId) {
        const url = new URL(window.location.href);
        url.searchParams.set('short_post_id', shortId);
        return url.toString();
    }

    async handleWebShare(shareUrl, title) {
        try {
            await navigator.share({
                title: title,
                text: title,
                url: shareUrl
            });
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error sharing:', error);
                return false;
            }
        }
        return true;
    }

    getSocialShareOptions(shortId, title) {
        const shareUrl = this.getCurrentUrlWithShortId(shortId);
        const shareOptions = [
            {
                name: 'Facebook',
                url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
                color: '#1877f2',
                icon: `<path d="M12 2C6.5 2 2 6.5 2 12c0 5 3.7 9.1 8.4 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7C18.3 21.1 22 17 22 12c0-5.5-4.5-10-10-10z"/>`
            },
            {
                name: 'Twitter',
                url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`,
                color: '#1da1f2',
                icon: `<path d="M22.23 5.924a8.212 8.212 0 01-2.357.646 4.115 4.115 0 001.804-2.27 8.221 8.221 0 01-2.606.996 4.103 4.103 0 00-6.991 3.742 11.647 11.647 0 01-8.457-4.287 4.103 4.103 0 001.27 5.477A4.089 4.089 0 012.5 9.722v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.615 11.615 0 006.29 1.84"/>`
            },
            {
                name: 'WhatsApp',
                url: `https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + shareUrl)}`,
                color: '#25d366',
                icon: `<path d="M20.1 3.9C17.9 1.7 15 .5 12 .5 5.8.5.7 5.6.7 11.9c0 2 .5 3.9 1.5 5.6L.6 23.4l6-1.6c1.6.9 3.5 1.3 5.4 1.3 6.3 0 11.4-5.1 11.4-11.4-.1-2.8-1.2-5.7-3.3-7.8zM12 21.4c-1.7 0-3.3-.5-4.8-1.3l-.4-.2-3.5 1 1-3.4L4 17c-1-1.5-1.4-3.2-1.4-5.1 0-5.2 4.2-9.4 9.4-9.4 2.5 0 4.9 1 6.7 2.8 1.8 1.8 2.8 4.2 2.8 6.7-.1 5.2-4.3 9.4-9.5 9.4z"/>`
            },
            {
                name: 'Telegram',
                url: `https://telegram.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`,
                color: '#0088cc',
                icon: `<path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>`
            }
        ];

        return shareOptions.map(platform => `
            <a href="${platform.url}" class="jw-share-option" target="_blank" rel="noopener noreferrer">
                <svg width="24" height="24" viewBox="0 0 24 24">
                    ${platform.icon.replace('fill="currentColor"', `fill="${platform.color}"`)}
                </svg>
                ${platform.name}
            </a>
        `).join('');
    }

    getCopyLinkButton(shortId) {
        return `
            <button class="jw-share-option jw-copy-link" data-url="${shortId}">
                <svg width="24" height="24" viewBox="0 0 24 24">
                    <path fill="#666" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
                </svg>
                Copy Link
            </button>
        `;
    }

    setupEventListeners(container, shortId) {
        const shareButton = container.querySelector('.jw-share-button');
        if (!shareButton) return;

        const title = shareButton.dataset.title;
        const shareUrl = this.getCurrentUrlWithShortId(shortId);

        if (this.isWebShareSupported) {
            shareButton.addEventListener('click', () => {
                this.handleWebShare(shareUrl, title);
            });
            return;
        }

        // Fallback sharing mechanism
        const shareMenu = container.querySelector('.jw-share-menu');
        const closeButton = container.querySelector('.jw-share-menu-close');
        const copyLinkButton = container.querySelector('.jw-copy-link');

        if (shareButton && shareMenu) {
            shareButton.addEventListener('click', () => {
                shareMenu.style.display = 'flex';
            });
        }

        if (closeButton && shareMenu) {
            closeButton.addEventListener('click', () => {
                shareMenu.style.display = 'none';
            });

            shareMenu.addEventListener('click', (e) => {
                if (e.target === shareMenu) {
                    shareMenu.style.display = 'none';
                }
            });
        }

        if (copyLinkButton) {
            copyLinkButton.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(shareUrl);
                    const originalText = copyLinkButton.textContent;
                    copyLinkButton.textContent = 'Copied!';
                    setTimeout(() => {
                        copyLinkButton.innerHTML = `
                            <svg width="24" height="24" viewBox="0 0 24 24">
                                <path fill="#666" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
                            </svg>
                            Copy Link
                        `;
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy:', err);
                }
            });
        }
    }
}
