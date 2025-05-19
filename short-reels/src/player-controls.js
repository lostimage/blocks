import { VideoProgressBorder } from './video-progress-bar';
export class PlayerControls {
    constructor() {
        this.currentPlayer = null;
        this.videoTag = null;
        this.progressBars = new Map();
        this.globalMuted = false;
    }

    initializePlayer(article , autoplay = false) {
        if (typeof jwplayer === 'undefined') {
            console.error('JWPlayer not loaded');
            return null;
        }
        const playerId = `jwplayer-${article.id}`;
        const videoUrl = article.videoUrl;
        const mediaId = article.mediaId;
        const container = document.getElementById(playerId);
        if (container) {
            // container.style.opacity = '0';
        }
        this.setupProgressBar(playerId);

        const playerInstance = jwplayer(playerId).setup({
            file: videoUrl,
            width: '100%',
            height: '100%',
            //image: article.thumbnail || `https://cdn.jwplayer.com/v2/media/${mediaId}/poster.jpg?width=720`,
            aspectratio: '9/16',
            autostart: "viewable",
            mute: true,
            controls: true,
            primary: 'html5',
            stretching: 'uniform',
            playbackRateControls: false,
            preload: 'auto',
            bufferlength: 20,
            visualplaylist: false,
            displaydescription: false,
            displaytitle: false,
            pipIcon: 'disabled',
            androidhls: true,
            startparam: 'start',
            bufferPercent: 5,
        });

        playerInstance.on('ready', () => {
            playerInstance.play();// ensuring play here when ready as it is more reliable for iphone.
            if(!autoplay) {
                playerInstance.pause();
                playerInstance.seek(0);
            }
            this.setupVideoAttributes();
        });

        playerInstance.on('firstFrame', () => {
            setTimeout(() => {
                playerInstance.setMute(this.globalMuted);
            }, 100);
        });

        playerInstance.on('time', (e) => {
            const progress = this.progressBars.get(playerId);
            if (!progress?.border || !e.duration) return;

            const percentage = (e.position / e.duration) * 100;
            if (progress.border) {
                progress.border.setProgress(percentage);
            }
            if (progress.bar) {
                progress.bar.style.width = `${percentage}%`;
            }
        });

        playerInstance.on('complete', () => {
            playerInstance.seek(0);
            const progress = this.progressBars.get(playerId);
            if (!progress) return;

            if (progress.border) {
                progress.border.setProgress(0);
            }
            if (progress.bar) {
                progress.bar.style.width = '0%';
            }
        });

        return playerInstance;
    }

    updateMuteIcon(player, muteButton) {
        const isMuted = player.getMute();
        const volumeIcon = muteButton.querySelector('.volume-icon');
        const muteIcon = muteButton.querySelector('.mute-icon');

        if (volumeIcon && muteIcon) {
            volumeIcon.style.display = isMuted ? 'none' : 'block';
            muteIcon.style.display = isMuted ? 'block' : 'none';
        }
    }

    setGlobalMute(muted) {
        this.globalMuted = muted;

        if (this.currentPlayer) {
            this.currentPlayer.setMute(muted);
        }
    }

    setupProgressBar(playerId) {
        const playerContainer = document.getElementById(playerId).closest('.jwplayer-short-item');
        if (!playerContainer) return;

        // Remove existing progress elements if any
        const existingProgress = playerContainer.querySelector('.video-progress-border');
        const existingBar = playerContainer.querySelector('.progress-bar-container');
        if (existingProgress) existingProgress.remove();
        if (existingBar) existingBar.remove();

        const progressContainer = document.createElement('div');
        progressContainer.className = 'video-progress-border';
        progressContainer.style.position = 'absolute';
        progressContainer.style.inset = '0';
        progressContainer.style.pointerEvents = 'none';
        playerContainer.appendChild(progressContainer);

        const progressBarContainer = document.createElement('div');
        progressBarContainer.className = 'progress-bar-container';

        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBarContainer.appendChild(progressBar);

        playerContainer.appendChild(progressBarContainer);

        const progressBorder = new VideoProgressBorder(progressContainer, {
            cornerRadius: 24,
            strokeWidth: 2,
            strokeColor: '#FF5500'
        });

        this.progressBars.set(playerId, {
            border: progressBorder,
            container: progressContainer,
            bar: progressBar,
            barContainer: progressBarContainer
        });

        return progressBorder;
    }


    setupVideoAttributes() {
        if (!this.videoTag) return;
        this.videoTag.setAttribute('playsinline', '');
        this.videoTag.setAttribute('webkit-playsinline', '');
        this.videoTag.setAttribute('x-webkit-airplay', 'allow');
        this.videoTag.setAttribute('preload', 'auto');
        this.videoTag.muted = true;
    }

    attemptAutoplay(playerInstance) {
        if (!this.videoTag) return;

        let playAttempt = setInterval(() => {
            this.videoTag.play()
                .then(() => {
                    clearInterval(playAttempt);
                    setTimeout(() => {
                        this.videoTag.muted = false;
                        playerInstance.setMute(false);
                    }, 100);
                })
                .catch(error => {
                    console.log("Autoplay error:", error);
                    if (!this.videoTag.muted) {
                        this.videoTag.muted = true;
                    }
                });
        }, 300);
    }

    setupVideoObserver(popupContainer, onPlayerChange) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const playerId = entry.target.querySelector('div').id;
                const player = jwplayer(playerId);

                if (entry.isIntersecting) {
                    const progressBar = this.progressBars.get(playerId);
                    if (progressBar) {
                        progressBar.style.width = '0%';
                    }
                    this.currentPlayer = player;
                    onPlayerChange?.(player);

                    const videoElement = document.querySelector(`#${playerId} video`);
                    if (videoElement && !videoElement.played.length) {
                        this.videoTag = videoElement;
                    }
                } else {
                    player.pause();
                    if (this.currentPlayer === player) {
                        this.currentPlayer = null;
                        onPlayerChange?.(null);
                    }
                }
            });
        }, {
            threshold: 0.7,
            rootMargin: '0px'
        });

        popupContainer.querySelectorAll('.jwplayer-short-item').forEach(item => {
            observer.observe(item);
        });

        return observer;
    }

    togglePlayback() {
        if (this.currentPlayer) {
            const state = this.currentPlayer.getState();
            state === 'playing' ? this.currentPlayer.pause() : this.currentPlayer.play();
        }
    }

    cleanupPlayers() {
        Array.from(this.progressBars.entries()).forEach(([playerId, progress]) => {
            if (progress?.border?.destroy) {
                progress.border.destroy();
            }
            if (progress?.container) {
                progress.container.remove();
            }
            try {
                const player = jwplayer(playerId);
                if (player && typeof player.destroy === 'function') {
                    player.destroy();
                }
            } catch (e) {
                console.error('Error destroying player:', e);
            }
        });
        this.progressBars.clear();
        this.currentPlayer = null;
    }
}
