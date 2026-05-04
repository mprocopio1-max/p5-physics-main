let Engine = Matter.Engine,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Composite = Matter.Composite;

let engine;

let brush;

let brushes = [];
let obstacles = [];

let NUM_BRUSHES = 50;
let MAX_BRUSHES = 130;

let smoothGravityX = 0;
let smoothGravityY = 0;
let smoothZ = 0;
let lastTouchSpawnMs = 0;
let sensorEnabled = false;
let hasOrientationData = false;
let sensorStatusMessage = "Sensors: tap button to enable";
let gravityTiltRange = 3.6;
let gravitySmoothing = 0.16;




function setup() {
  createCanvas(windowWidth, windowHeight);
  engine = Engine.create();

  createObstacles();

  for (let i = 0; i < NUM_BRUSHES; i++) {
    addBrush(createRandomBrush(width / 2 + random(-120, 120), height / 4 + random(-90, 90)));
  }

  Matter.Events.on(engine, "collisionStart", handleCollisionStart);

  window.addEventListener("deviceorientation", (event) => {
    hasOrientationData = hasOrientationData || event.beta !== null;
  }, { passive: true });

  if (typeof SensorPermissions !== "undefined") {
    // Read the helper's result once at startup; iOS may still need a tap button.
    SensorPermissions.ensureSensorPermission({
      buttonText: "Enable Sensors",
      preferP5Button: true,
      onChange: (granted, result) => {
        sensorEnabled = granted;

        if (granted) {
          sensorStatusMessage = "Sensors: active";
          return;
        }

        if (result && result.state === "denied") {
          sensorStatusMessage = "Sensors denied: allow motion/orientation permissions.";
        } else if (!window.isSecureContext) {
          sensorStatusMessage = "Sensors blocked: open via HTTPS (or localhost).";
        } else {
          sensorStatusMessage = "Sensors: tap button to enable";
        }
      }
    });
  } else {
    sensorStatusMessage = "Sensor helper missing: load Permessi sensori/sensor-permissions.js";
  }

}

function draw() {
  background(16, 20, 30, 40);

  const xTilt = constrain(rotationX || 0, -90, 90);
  const yTilt = constrain(rotationY || 0, -90, 90);
  const zTilt = constrain(rotationZ || 0, -90, 90);

  const targetGravityY = map(xTilt, -90, 90, -gravityTiltRange, gravityTiltRange);
  const targetGravityX = map(yTilt, -90, 90, -gravityTiltRange, gravityTiltRange);
  const zNormalized = map(zTilt, -90, 90, -1, 1);

  smoothGravityX = lerp(smoothGravityX, targetGravityX, gravitySmoothing);
  smoothGravityY = lerp(smoothGravityY, targetGravityY, gravitySmoothing);
  smoothZ = lerp(smoothZ, zNormalized, 0.08);

  if (sensorEnabled && hasOrientationData) {
    sensorStatusMessage = "Sensors: active";
  }

  engine.world.gravity.x = smoothGravityX;
  engine.world.gravity.y = smoothGravityY;

  // Sensor Z controls bounce intensity to make phone roll around the Z axis meaningful.
  const restitutionFromZ = map(abs(smoothZ), 0, 1, 0.45, 1.18);
  const sensorStrength = constrain(map(Math.hypot(smoothGravityX, smoothGravityY), 0, 2.8, 0, 0.8) + abs(smoothZ) * 0.2, 0, 1);

  for (let i = 0; i < obstacles.length; i++) {
    obstacles[i].setTilt(smoothZ);
    obstacles[i].draw();
  }

  for (let i = 0; i < brushes.length; i++) {
    brushes[i].applySensorZ(smoothZ, restitutionFromZ, sensorStrength);
    brushes[i].draw();
  }

  push();
  fill(255);
  noStroke();
  textSize(12);
  text(sensorStatusMessage, 10, 48);
  pop();

  Engine.update(engine);
}

function createObstacles() {
  obstacles = [
    new Obstacle(width * 0.25, height * 0.42, width * 0.28, 24, -0.32, {
      label: "left_ramp",
      color: color(70, 230, 170),
      rotateWithZ: true,
      tiltFactor: 0.45,
      friction: 0.9,
      frictionStatic: 1.2
    }),
    new Obstacle(width * 0.73, height * 0.55, width * 0.26, 24, 0.36, {
      label: "right_ramp",
      color: color(250, 120, 90),
      rotateWithZ: true,
      tiltFactor: 0.35,
      friction: 0.8,
      frictionStatic: 1
    }),
    new Obstacle(width * 0.52, height * 0.78, width * 0.34, 22, 0, {
      label: "central_bar",
      color: color(120, 180, 255),
      rotateWithZ: false,
      friction: 0.95,
      frictionStatic: 1.3,
      restitution: 0.02
    })
  ];

  for (let i = 0; i < obstacles.length; i++) {
    Composite.add(engine.world, obstacles[i].body);
  }
}

function createRandomBrush(x, y) {
  const size = random(10, 28);
  const picker = random();

  if (picker < 0.45) {
    return new Brush(x, y, size);
  }
  if (picker < 0.7) {
    return new HeavyBrush(x, y, size + 3);
  }
  if (picker < 0.9) {
    return new ElasticBrush(x, y, size);
  }
  return new SpinnerBrush(x, y, size + 4);
}

function addBrush(newBrush) {
  brush = newBrush;
  brushes.push(brush);
  Composite.add(engine.world, brush.body);

  if (brushes.length > MAX_BRUSHES) {
    const removed = brushes.shift();
    Composite.remove(engine.world, removed.body);
  }
}

function handleCollisionStart(event) {
  const pairs = event.pairs;

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    const ownerA = pair.bodyA.plugin && pair.bodyA.plugin.owner;
    const ownerB = pair.bodyB.plugin && pair.bodyB.plugin.owner;

    if (ownerA && ownerA.onCollisionWith) {
      ownerA.onCollisionWith(ownerB, pair);
    }
    if (ownerB && ownerB.onCollisionWith) {
      ownerB.onCollisionWith(ownerA, pair);
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function mousePressed() {
  addBrush(createRandomBrush(mouseX, mouseY));
}

function touchStarted() {
  if (touches.length > 0) {
    addBrush(createRandomBrush(touches[0].x, touches[0].y));
  }
  return false;
}

function touchMoved() {
  const now = millis();

  if (touches.length > 0 && now - lastTouchSpawnMs > 85) {
    lastTouchSpawnMs = now;
    addBrush(createRandomBrush(touches[0].x, touches[0].y));
  }
  return false;
}

function touchEnded() {
  lastTouchSpawnMs = 0;
  return false;
}
