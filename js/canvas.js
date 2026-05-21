const BOID_COUNT = 120;
const COLORS = ['#7fb5ff', '#84e6c3', '#c9a0ff', '#ffd166', '#ff7aa2', '#6ef7f1'];
const MAX_SPEED = 2.1;
const MAX_FORCE = 0.045;
const NEIGHBOR_RADIUS = 58;
const SEPARATION_RADIUS = 24;
const TRAIL_DURATION = 3000;

const hexToRgba = (hex, alpha) => {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

class Boid {
  constructor(width, height, color) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.vx = (Math.random() * 2 - 1) * 1.5;
    this.vy = (Math.random() * 2 - 1) * 1.5;
    this.color = color;
    this.trail = [];
  }

  limitSpeed() {
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > MAX_SPEED) {
      this.vx = (this.vx / speed) * MAX_SPEED;
      this.vy = (this.vy / speed) * MAX_SPEED;
    }
  }

  applyRules(boids) {
    let alignmentX = 0;
    let alignmentY = 0;
    let cohesionX = 0;
    let cohesionY = 0;
    let separationX = 0;
    let separationY = 0;

    let alignmentCount = 0;
    let cohesionCount = 0;
    let separationCount = 0;

    for (let i = 0; i < boids.length; i += 1) {
      const other = boids[i];
      if (other === this) continue;

      const dx = other.x - this.x;
      const dy = other.y - this.y;
      const distance = Math.hypot(dx, dy);

      if (distance < NEIGHBOR_RADIUS) {
        alignmentX += other.vx;
        alignmentY += other.vy;
        cohesionX += other.x;
        cohesionY += other.y;
        alignmentCount += 1;
        cohesionCount += 1;
      }

      if (distance > 0 && distance < SEPARATION_RADIUS) {
        separationX -= dx / distance;
        separationY -= dy / distance;
        separationCount += 1;
      }
    }

    if (alignmentCount > 0) {
      alignmentX /= alignmentCount;
      alignmentY /= alignmentCount;
      const steerX = alignmentX - this.vx;
      const steerY = alignmentY - this.vy;
      this.vx += Math.max(-MAX_FORCE, Math.min(MAX_FORCE, steerX)) * 0.9;
      this.vy += Math.max(-MAX_FORCE, Math.min(MAX_FORCE, steerY)) * 0.9;
    }

    if (cohesionCount > 0) {
      const centerX = cohesionX / cohesionCount;
      const centerY = cohesionY / cohesionCount;
      const steerX = centerX - this.x;
      const steerY = centerY - this.y;
      this.vx += Math.max(-MAX_FORCE, Math.min(MAX_FORCE, steerX * 0.01));
      this.vy += Math.max(-MAX_FORCE, Math.min(MAX_FORCE, steerY * 0.01));
    }

    if (separationCount > 0) {
      separationX /= separationCount;
      separationY /= separationCount;
      this.vx += Math.max(-MAX_FORCE, Math.min(MAX_FORCE, separationX)) * 1.4;
      this.vy += Math.max(-MAX_FORCE, Math.min(MAX_FORCE, separationY)) * 1.4;
    }

    this.limitSpeed();
  }

  move(width, height, now) {
    this.trail.push({
      x: this.x,
      y: this.y,
      createdAt: now,
      sparkle: Math.random() < 0.22
    });
    this.trail = this.trail.filter((point) => now - point.createdAt <= TRAIL_DURATION);

    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0) this.x = width;
    if (this.x > width) this.x = 0;
    if (this.y < 0) this.y = height;
    if (this.y > height) this.y = 0;
  }

  drawTrail(ctx, now) {
    if (this.trail.length < 2) {
      return;
    }

    for (let i = 1; i < this.trail.length; i += 1) {
      const previous = this.trail[i - 1];
      const current = this.trail[i];
      const age = now - current.createdAt;
      const opacity = Math.max(0, 1 - age / TRAIL_DURATION);
      const distance = Math.hypot(current.x - previous.x, current.y - previous.y);
      if (distance > 120) continue;

      ctx.beginPath();
      ctx.moveTo(previous.x, previous.y);
      ctx.lineTo(current.x, current.y);
      ctx.lineWidth = 2.6 * opacity;
      ctx.strokeStyle = hexToRgba(this.color, 0.5 * opacity);
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 12 * opacity;
      ctx.stroke();

      if (current.sparkle && opacity > 0.12) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${0.75 * opacity})`;
        ctx.arc(current.x, current.y, 0.8 + Math.random() * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  draw(ctx) {
    const angle = Math.atan2(this.vy, this.vx);
    const size = 6;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size, size * 0.6);
    ctx.lineTo(-size, -size * 0.6);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }
}

export const initCanvas = (canvas) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  resize();
  window.addEventListener('resize', resize);

  const boids = Array.from({ length: BOID_COUNT }, (_, index) => new Boid(canvas.width, canvas.height, COLORS[index % COLORS.length]));

  const animate = () => {
    const now = performance.now();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < boids.length; i += 1) {
      boids[i].applyRules(boids);
      boids[i].move(canvas.width, canvas.height, now);
      boids[i].drawTrail(ctx, now);
      boids[i].draw(ctx);
    }

    window.requestAnimationFrame(animate);
  };

  animate();
};
