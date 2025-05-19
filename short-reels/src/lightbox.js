export class Lightbox {
	constructor() {
		this.popupContainer = null;
		this.createLightbox();
	}

	createLightbox() {
		// Check if the container already exists in the DOM
		const existingContainer = document.querySelector( '.jwplayer-popup-container' );
		if ( existingContainer ) {
			this.popupContainer = existingContainer;
			return;
		}

		const popupHTML = `
            <div class="jwplayer-popup-container">
                <div class="jwplayer-popup-inner">
                    <div class="jwplayer-popup-content">
                        <div class="jwplayer-shorts-wrapper">
                            <div class="jwplayer-shorts-list"></div>
                        </div>
                    </div>
                    <button class="jwplayer-popup-close">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<g id="x">
							<path id="Icon" d="M17 7L7 17M7 7L17 17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							</g>
						</svg>
					</button>
                     <button class="navigation-button prev-button" aria-label="Previous video">
                        <svg viewBox="0 0 24 24">
                            <path d="M15 6L9 12L15 18" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <button class="navigation-button next-button" aria-label="Next video">
                        <svg viewBox="0 0 24 24">
                            <path d="M9 6L15 12L9 18" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>`;

		document.body.insertAdjacentHTML( 'beforeend', popupHTML );
		this.popupContainer = document.querySelector( '.jwplayer-popup-container' );

		if ( ! this.popupContainer ) {
			return;
		}
	}
	show() {
		this.popupContainer.classList.add( 'active' );
		document.body.style.overflow = 'hidden';
		document.body.classList.add('js-reels-popup-active');
	}

	hide() {
		this.popupContainer.classList.remove( 'active' );
		document.body.style.overflow = '';
		document.body.classList.remove('js-reels-popup-active');
	}

	getShortsContainer() {
		if ( ! this.popupContainer ) {
			return null;
		}

		const shortsContainer = this.popupContainer.querySelector( '.jwplayer-shorts-list' );
		if ( ! shortsContainer ) {
			return null;
		}

		return shortsContainer;
	}

	addCloseHandler( handler ) {
		this.popupContainer.querySelector( '.jwplayer-popup-close' )
			.addEventListener( 'click', handler );
	}

	updateNavigationButtons( currentIndex, totalItems ) {
		const prevButton = this.popupContainer.querySelector( '.prev-button' );
		const nextButton = this.popupContainer.querySelector( '.next-button' );

		if ( prevButton && nextButton ) {
			prevButton.classList.toggle( 'hidden', currentIndex === 0 );
			nextButton.classList.toggle( 'hidden', currentIndex === totalItems - 1 );
		}
	}

	addNavigationHandlers( onPrev, onNext ) {
		const prevButton = this.popupContainer.querySelector( '.prev-button' );
		const nextButton = this.popupContainer.querySelector( '.next-button' );

		if ( prevButton && nextButton ) {
			prevButton.addEventListener( 'click', onPrev );
			nextButton.addEventListener( 'click', onNext );
		}
	}
}
