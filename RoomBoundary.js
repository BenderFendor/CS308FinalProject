
class RoomBoundary {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.debug = true; // Toggle debug visualization
    }

    draw(ctx) {
        // Draw room boundary
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 4;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        if (this.debug) {
            // Draw debug info
            ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    containsPoint(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }
}