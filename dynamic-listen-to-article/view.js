document.addEventListener( 'DOMContentLoaded', () => {
	const audioPlayers = document.querySelectorAll( '.wp-block-moniify-dynamic-listen-to-article' );
	audioPlayers.forEach( initializeAudioPlayer );
} );

function initializeAudioPlayer( container ) {
	const audio = container.querySelector( '.audio-player' );
	const playButton = container.querySelector( '.bn-play-audio' );
	const rateButton = container.querySelector( '.rate-button' );
	const rewindButton = container.querySelector( '.rewind-play' );
	const forwardButton = container.querySelector( '.forward-play' );
	const timeDisplay = container.querySelector( '#current-time' );
	const durationDisplay = container.querySelector( '#duration' );
	const seekSlider = container.querySelector( '.audio-slider-range' );

	const playbackRates = [ 1, 1.5, 2 ];
	let currentPlaybackRateIndex = 0;

	// Set initial playback rate
	audio.playbackRate = playbackRates[ currentPlaybackRateIndex ];

	// Play/Pause button event listener
	playButton.addEventListener( 'click', () => {
		const playIcon = playButton.querySelector( '.play-icon' );
		const pauseIcon = playButton.querySelector( '.pause-icon' );
		if ( audio.paused ) {
			audio.play();
			playIcon.classList.add( 'bn-hidden' );
			pauseIcon.classList.remove( 'bn-hidden' );
		} else {
			audio.pause();
			playIcon.classList.remove( 'bn-hidden' );
			pauseIcon.classList.add( 'bn-hidden' );
		}
	} );

	// Rewind button event listener
	rewindButton.addEventListener( 'click', () => {
		audio.currentTime = Math.max( audio.currentTime - 10, 0 );
		updateTimeDisplay();
	} );

	// Forward button event listener
	forwardButton.addEventListener( 'click', () => {
		audio.currentTime = Math.min( audio.currentTime + 10, audio.duration );
		updateTimeDisplay();
	} );

	// Update current time display
	audio.addEventListener( 'timeupdate', updateTimeDisplay );

	// Update duration display
	const updateDuration = () => {
		const duration = Math.floor( audio.duration );
		const minutes = Math.floor( duration / 60 );
		const seconds = duration % 60;
		durationDisplay.textContent = `${ minutes }:${ seconds < 10 ? '0' : '' }${ seconds }`;
		seekSlider.max = duration;
	};

	updateDuration();
	audio.addEventListener( 'loadedmetadata', updateDuration );
	audio.addEventListener( 'canplaythrough', updateDuration );

	// Playback rate button event listener
	rateButton.addEventListener( 'click', () => {
		currentPlaybackRateIndex = ( currentPlaybackRateIndex + 1 ) % playbackRates.length;
		audio.playbackRate = playbackRates[ currentPlaybackRateIndex ];
		rateButton.textContent = `${ playbackRates[ currentPlaybackRateIndex ].toFixed( 1 ) }x`;
	} );

	// Seek slider event listener
	seekSlider.addEventListener( 'input', ( event ) => {
		audio.currentTime = event.target.value;
		updateTimeDisplay();
	} );

	function updateTimeDisplay() {
		const currentTime = Math.floor( audio.currentTime );
		const minutes = Math.floor( currentTime / 60 );
		const seconds = currentTime % 60;
		timeDisplay.textContent = `${ minutes }:${ seconds < 10 ? '0' : '' }${ seconds }`;
		seekSlider.value = currentTime;
	}
}
