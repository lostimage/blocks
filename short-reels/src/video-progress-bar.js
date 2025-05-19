export class VideoProgressBorder {
    constructor(container, options = {}) {
        this.cornerRadius = options.cornerRadius || 24;
        this.strokeWidth = options.strokeWidth || 2;
        this.strokeColor = options.strokeColor || '#FF5500';
        this.container = container;
        this.progress = 0;
        this.initialized = false;

        this.init();
    }

    init() {
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.style.position = 'absolute';
        this.svg.style.inset = '0';
        this.svg.style.width = '100%';
        this.svg.style.height = '100%';
        this.svg.style.pointerEvents = 'none';
        this.svg.style.opacity = '0'; // Start hidden

        this.path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.path.setAttribute('fill', 'none');
        this.path.setAttribute('stroke', this.strokeColor);
        this.path.setAttribute('stroke-width', this.strokeWidth);
        // Initially set full dash
        this.path.style.strokeDasharray = '1';
        this.path.style.strokeDashoffset = '1';
        this.path.style.transition = 'stroke-dasharray 0.3s linear, stroke-dashoffset 0.3s linear';

        this.svg.appendChild(this.path);
        this.container.appendChild(this.svg);

        // Initial setup with a slight delay
        requestAnimationFrame(() => {
            this.updatePath();
            // Fade in the SVG after initial setup
            requestAnimationFrame(() => {
                this.svg.style.transition = 'opacity 0.2s';
                this.svg.style.opacity = '1';
                this.initialized = true;
            });
        });

        let resizeTimeout;
        window.addEventListener('resize', () => {
            if (resizeTimeout) clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.updatePath(), 100);
        });
    }

    createFullPath(width, height) {
        const r = this.cornerRadius;
        const halfWidth = width / 2;

        return [
            `M ${halfWidth},0`, // Start at top center
            `H ${width - r}`, // Right half of top line
            `A ${r},${r} 0 0 1 ${width},${r}`, // Top-right corner
            `V ${height - r}`, // Right line
            `A ${r},${r} 0 0 1 ${width - r},${height}`, // Bottom-right corner
            `H ${r}`, // Bottom line
            `A ${r},${r} 0 0 1 0,${height - r}`, // Bottom-left corner
            `V ${r}`, // Left line
            `A ${r},${r} 0 0 1 ${r},0`, // Top-left corner
            `H ${halfWidth}` // Left half of top line
        ].join(' ');
    }

    updatePath() {
        const rect = this.container.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

        const pathData = this.createFullPath(width, height);
        this.path.setAttribute('d', pathData);

        // Only update dash properties after path is set
        const pathLength = this.path.getTotalLength();

        if (!this.initialized) {
            // On first run, set initial state without animation
            this.path.style.transition = 'none';
            this.path.style.strokeDasharray = `${pathLength}`;
            this.path.style.strokeDashoffset = `${pathLength}`;

            // Re-enable transitions on next frame
            requestAnimationFrame(() => {
                this.path.style.transition = 'stroke-dasharray 0.3s linear, stroke-dashoffset 0.3s linear';
                this.setProgress(this.progress);
            });
        } else {
            this.path.style.strokeDasharray = `${pathLength}`;
            this.path.style.strokeDashoffset = pathLength * (1 - (this.progress / 100));
        }
    }

    setProgress(progress) {
        this.progress = Math.min(100, Math.max(0, progress));
        if (this.initialized) {
            this.updatePath();
        }
    }

    destroy() {
        this.svg.remove();
        window.removeEventListener('resize', () => this.updatePath());
    }
}
