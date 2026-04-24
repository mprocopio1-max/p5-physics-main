class HeavyBrush extends BaseBrush {
  constructor(x, y, r) {
    super(x, y, r, {
      kind: "heavy",
      label: "heavy_brush",
      color: color(95, 130, 255),
      // Higher density makes this brush heavier and less reactive to impacts.
      density: 0.004,
      restitution: 0.25,
      friction: 0.2,
      frictionStatic: 0.6,
      frictionAir: 0.03
    });
  }

  onCollisionWith(other, pair) {
    this.hitFlash = 0.7;

    if (other && other.kind === "obstacle") {
      this.color = color(70, 110, 230);
      this.bounceAndGrowOnObstacle(other, pair, 1.06);
      this.setTemporaryPhysics({ frictionAir: 0.05 }, 450);
      return;
    }

    this.color = color(95 + random(-25, 25), 130 + random(-25, 25), 255);
    Body.setVelocity(this.body, {
      x: this.body.velocity.x + random(-0.45, 0.45),
      y: this.body.velocity.y + random(-0.45, 0.45)
    });
  }
}

class ElasticBrush extends BaseBrush {
  constructor(x, y, r) {
    super(x, y, r, {
      kind: "elastic",
      label: "elastic_brush",
      color: color(255, 130, 75),
      // High restitution gives energetic bounces.
      restitution: 1.15,
      friction: 0.005,
      frictionStatic: 0.02,
      frictionAir: 0.004,
      density: 0.0008
    });
  }

  onCollisionWith(other, pair) {
    this.color = color(255, random(150, 235), random(70, 140));
    this.hitFlash = 0.75;

    // Add spin after impact to make this brush visibly more dynamic.
    Body.setAngularVelocity(this.body, this.body.angularVelocity + random(-0.16, 0.16));

    if (other && other.kind === "obstacle") {
      this.bounceAndGrowOnObstacle(other, pair, 1.15);
      this.setTemporaryPhysics({ restitution: 1.25, frictionAir: 0.002 }, 300);
      return;
    }

    this.setSize(random(12, 34));
    Body.setVelocity(this.body, {
      x: this.body.velocity.x + random(-1.8, 1.8),
      y: this.body.velocity.y + random(-1.8, 1.8)
    });
  }
}

class SpinnerBrush extends BaseBrush {
  constructor(x, y, size) {
    super(x, y, size, {
      kind: "spinner",
      label: "spinner_brush",
      shape: "rectangle",
      width: size * 2,
      height: max(10, size * 0.65),
      color: color(120, 255, 190),
      restitution: 0.92,
      friction: 0.03,
      frictionStatic: 0.12,
      frictionAir: 0.012,
      density: 0.0011
    });

    Body.setAngularVelocity(this.body, random(-0.08, 0.08));
  }

  onCollisionWith(other, pair) {
    this.hitFlash = 0.8;
    this.color = color(120, random(170, 255), random(150, 220));

    // Extra angular velocity keeps this rectangular brush spinning.
    Body.setAngularVelocity(this.body, this.body.angularVelocity + random(-0.26, 0.26));

    if (other && other.kind === "obstacle") {
      this.bounceAndGrowOnObstacle(other, pair, 1.08);
      this.setTemporaryPhysics({ restitution: 0.65, frictionAir: 0.02 }, 420);
      return;
    }

    Body.setVelocity(this.body, {
      x: this.body.velocity.x + random(-1.1, 1.1),
      y: this.body.velocity.y + random(-1.1, 1.1)
    });
  }
}
