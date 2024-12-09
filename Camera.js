class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.target = null;
        this.shakeIntensity = 0;
        this.shakeDecay = 0.9;
    }

    update() {
        if (this.target) {
            // Smooth follow
            this.x = this.target.x;
            this.y = this.target.y;
        }

        // Screen shake
        if (this.shakeIntensity > 0) {
            this.x += (Math.random() - 0.5) * this.shakeIntensity;
            this.y += (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeIntensity *= this.shakeDecay;
        }
    }

    shake(intensity) {
        this.shakeIntensity = intensity;
    }
}