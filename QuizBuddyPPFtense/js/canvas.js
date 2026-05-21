const BOID_COUNT = 60;
const COLORS = ['#7fb5ff', '#84e6c3', '#c9a0ff', '#ffd166', '#ff7aa2', '#6ef7f1'];
const MAX_SPEED = 2.1;
const MAX_FORCE = 0.045;
const NEIGHBOR_RADIUS = 58;
const SEPARATION_RADIUS = 24;
const TRAIL_DURATION = 1500;
const MAX_TRAIL_POINTS = 90;
const SPARKLE_PROBABILITY = 0.08;
const MAX_TRAIL_SEGMENT_DISTANCE = 120;
const MIN_SPARKLE_OPACITY = 0.12;
const MIN_SPARKLE_RADIUS = 0.8;
const SPARKLE_RADIUS_RANGE = 1.5;
const SHADOW_BLUR = 8;

// Pre-parse hex colors once at module load to avoid per-frame string parsing
const COLORS_RGB = COLORS.map((hex) => {
  const normalized = hex.replace('#', '');
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
});

class Boid {
  constructor(width, height, colorIndex) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.vx = (Math.random() * 2 - 1) * 1.5;
    this.vy = (Math.random() * 2 - 1) * 1.5;
    this.color = COLORS[colorIndex];
    this.rgb = COLORS_RGB[colorIndex];
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
      sparkle: Math.random() < SPARKLE_PROBABILITY,
      sparkleRadius: MIN_SPARKLE_RADIUS + Math.random() * SPARKLE_RADIUS_RANGE
    });

    // Remove expired points from the front without creating a new array
    let expired = 0;
    while (expired < this.trail.length && now - this.trail[expired].createdAt > TRAIL_DURATION) {
      expired += 1;
    }
    if (expired > 0) this.trail.splice(0, expired);

    // Hard-cap to bound memory usage on high-refresh-rate displays
    if (this.trail.length > MAX_TRAIL_POINTS) {
      this.trail.splice(0, this.trail.length - MAX_TRAIL_POINTS);
    }

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

    const { r, g, b } = this.rgb;

    // Set shadow state once per boid instead of per segment
    ctx.save();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = SHADOW_BLUR;

    for (let i = 1; i < this.trail.length; i += 1) {
      const previous = this.trail[i - 1];
      const current = this.trail[i];
      const age = now - current.createdAt;
      const opacity = Math.max(0, 1 - age / TRAIL_DURATION);
      const distance = Math.hypot(current.x - previous.x, current.y - previous.y);
      if (distance > MAX_TRAIL_SEGMENT_DISTANCE) continue;

      ctx.beginPath();
      ctx.moveTo(previous.x, previous.y);
      ctx.lineTo(current.x, current.y);
      ctx.lineWidth = 2.6 * opacity;
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.5 * opacity})`;
      ctx.stroke();

      if (current.sparkle && opacity > MIN_SPARKLE_OPACITY) {
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${0.75 * opacity})`;
        ctx.arc(current.x, current.y, current.sparkleRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = SHADOW_BLUR;
      }
    }

    ctx.restore();
  }

  draw(ctx) {
    const angle = Math.atan2(this.vy, this.vx);
    const size = 6;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);
    ctx.shadowColor = this.color;
    ctx.shadowBlur = SHADOW_BLUR;
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

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  let resizeTimer;
  const resize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }, 100);
  };

  window.addEventListener('resize', resize);

  const boids = Array.from({ length: BOID_COUNT }, (_, index) => new Boid(canvas.width, canvas.height, index % COLORS.length));

  let animationId;

  const animate = () => {
    const now = performance.now();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < boids.length; i += 1) {
      boids[i].applyRules(boids);
      boids[i].move(canvas.width, canvas.height, now);
      boids[i].drawTrail(ctx, now);
      boids[i].draw(ctx);
    }

    animationId = window.requestAnimationFrame(animate);
  };

  // Pause the animation loop when the tab is not visible to save CPU/GPU
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animationId);
    } else {
      // Clear stale trail points accumulated while hidden to avoid
      // incorrect opacity calculations on resume
      for (let i = 0; i < boids.length; i += 1) {
        boids[i].trail.length = 0;
      }
      animate();
    }
  });

  animate();
};
