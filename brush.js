class BaseBrush {
  constructor(x, y, size, options = {}) {
    this.size = size;
    this.kind = options.kind || "brush";
    this.shape = options.shape || "circle";
    this.width = options.width || size * 1.6;
    this.height = options.height || size;
    this.color = options.color || color(random(255), random(255), random(255));
    this.hitFlash = 0;
    this.tempPhysicsUntil = 0;
    this.baseRestitution = options.restitution ?? 0.75;
    this.baseFrictionAir = options.frictionAir ?? 0.01;

    const bodyOptions = {
      restitution: this.baseRestitution,
      friction: options.friction ?? 0.02,
      frictionStatic: options.frictionStatic ?? 0.1,
      frictionAir: this.baseFrictionAir,
      density: options.density ?? 0.0012,
      angle: options.angle ?? random(-0.2, 0.2)
    };

    this.body = this.shape === "rectangle"
      ? Bodies.rectangle(x, y, this.width, this.height, bodyOptions)
      : Bodies.circle(x, y, this.size, bodyOptions);

    this.body.label = options.label || this.kind;
    this.body.plugin = this.body.plugin || {};
    this.body.plugin.owner = this;
  }

  draw() {
    this.update();

    push();
    noStroke();
    fill(lerpColor(this.color, color(255), this.hitFlash));
    translate(this.body.position.x, this.body.position.y);
    rotate(this.body.angle);

    if (this.shape === "circle") {
      circle(0, 0, this.body.circleRadius * 2);
    } else {
      beginShape();
      for (const v of this.body.vertices) {
        vertex(v.x - this.body.position.x, v.y - this.body.position.y);
      }
      endShape(CLOSE);
    }
    pop();
  }

  update() {
    this.keepInBounds();

    if (this.tempPhysicsUntil > 0 && millis() > this.tempPhysicsUntil) {
      this.tempPhysicsUntil = 0;
      this.body.restitution = this.baseRestitution;
      this.body.frictionAir = this.baseFrictionAir;
    }

    this.hitFlash *= 0.88;
  }

  onCollisionWith(other) {
    this.color = color(random(255), random(255), random(255));
    this.hitFlash = 0.65;

    if (other && other.kind === "obstacle") {
      this.setTemporaryPhysics({ restitution: this.body.restitution * 0.8, frictionAir: 0.03 }, 350);
      Body.setAngularVelocity(this.body, this.body.angularVelocity + random(-0.03, 0.03));
    } else {
      this.setSize(random(10, 30));
      Body.setVelocity(this.body, {
        x: this.body.velocity.x + random(-1.2, 1.2),
        y: this.body.velocity.y + random(-1.2, 1.2)
      });
    }
  }

  setSize(newRadius) {
    if (this.shape !== "circle") {
      return;
    }
    const ratio = constrain(newRadius / this.body.circleRadius, 0.55, 1.6);
    Body.scale(this.body, ratio, ratio);
  }

  setTemporaryPhysics(physics, durationMs) {
    if (physics.restitution !== undefined) {
      this.body.restitution = physics.restitution;
    }
    if (physics.frictionAir !== undefined) {
      this.body.frictionAir = physics.frictionAir;
    }
    this.tempPhysicsUntil = millis() + durationMs;
  }

  applySensorZ(zNormalized, targetRestitution) {
    this.body.restitution = lerp(this.body.restitution, targetRestitution, 0.06);
    this.body.frictionAir = lerp(this.body.frictionAir, map(abs(zNormalized), 0, 1, this.baseFrictionAir, this.baseFrictionAir + 0.03), 0.05);
  }

  keepInBounds() {
    const bounds = this.body.bounds;
    const halfW = (bounds.max.x - bounds.min.x) * 0.5;
    const halfH = (bounds.max.y - bounds.min.y) * 0.5;
    const pos = this.body.position;
    let newX = pos.x;
    let newY = pos.y;
    let clamped = false;

    if (pos.x > width - halfW) {
      newX = width - halfW;
      clamped = true;
    }
    if (pos.x < halfW) {
      newX = halfW;
      clamped = true;
    }
    if (pos.y > height - halfH) {
      newY = height - halfH;
      clamped = true;
    }
    if (pos.y < halfH) {
      newY = halfH;
      clamped = true;
    }

    if (clamped) {
      Body.setPosition(this.body, { x: newX, y: newY });
      Body.setVelocity(this.body, {
        x: this.body.velocity.x * 0.8,
        y: this.body.velocity.y * 0.8
      });
    }
  }
}

class Brush extends BaseBrush {
  constructor(x, y, r) {
    super(x, y, r, {
      kind: "brush",
      label: "brush",
      restitution: 0.8,
      friction: 0.02,
      frictionStatic: 0.08,
      frictionAir: 0.01,
      density: 0.001
    });
  }
}