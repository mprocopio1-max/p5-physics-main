class Obstacle {
  constructor(x, y, w, h, angle = 0, options = {}) {
    this.w = w;
    this.h = h;
    this.baseAngle = angle;
    this.tiltFactor = options.tiltFactor ?? 0;
    this.rotateWithZ = options.rotateWithZ ?? false;
    this.color = options.color || color(40, 240, 150);
    this.hitFlash = 0;
    this.kind = "obstacle";
    this.lastShiftMs = 0;
    this.shiftCooldownMs = options.shiftCooldownMs ?? 220;
    const obstacleCategory = 0x0008;

    this.body = Bodies.rectangle(x, y, w, h, {
      isStatic: true,
      angle,
      friction: options.friction ?? 0.8,
      frictionStatic: options.frictionStatic ?? 1,
      restitution: options.restitution ?? 0.05,
      collisionFilter: {
        category: obstacleCategory,
        mask: -1
      },
      label: options.label || "obstacle"
    });

    this.body.plugin = this.body.plugin || {};
    this.body.plugin.owner = this;
  }

  onCollisionWith(other) {
    this.hitFlash = 0.55;

    if (!other || other.kind === "obstacle") {
      return;
    }

    const now = millis();
    if (now - this.lastShiftMs < this.shiftCooldownMs) {
      return;
    }
    this.lastShiftMs = now;

    const newX = constrain(this.body.position.x + random(-110, 110), this.w * 0.5, width - this.w * 0.5);
    const newY = constrain(this.body.position.y + random(-85, 85), this.h * 0.5, height - this.h * 0.5);
    Body.setPosition(this.body, { x: newX, y: newY });

    this.baseAngle += random(-0.14, 0.14);
    Body.setAngle(this.body, this.baseAngle);
  }

  setTilt(zNormalized) {
    if (!this.rotateWithZ) {
      return;
    }
    const targetAngle = this.baseAngle + zNormalized * this.tiltFactor;
    Body.setAngle(this.body, targetAngle);
  }

  draw() {
    this.hitFlash *= 0.85;

    push();
    rectMode(CENTER);
    noStroke();
    fill(lerpColor(this.color, color(255), this.hitFlash));
    translate(this.body.position.x, this.body.position.y);
    rotate(this.body.angle);
    rect(0, 0, this.w, this.h, 8);
    pop();
  }
}