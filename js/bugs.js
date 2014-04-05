var Boid = Base.extend({
  initialize: function(position, maxSpeed, maxForce) {
    var strength = Math.random() * 0.5;
    this.acceleration = new Point();
    this.vector = Point.random() * 2 - 1;
    this.position = position.clone();
    this.radius = 30;
    this.maxSpeed = maxSpeed + strength;
    this.maxForce = maxForce + strength;
    this.points = [];
    for (var i = 0, l = strength * 10 + 10; i < l; i++) {
      this.points.push(new Point());
    }
    this.count = 0;
    this.lastAngle = 0;
    this.distances = [];
    this.createItems();
  },

  run: function(boids) {
    this.lastLoc = this.position.clone();
    if (!groupTogether) {
      this.flock(boids);
    } else {
      this.align(boids);
    }
    this.borders();
    this.update();
    this.updateItems();
  },

  createItems: function() {
    this.head = (project.symbols[0]
      ? project.symbols[0]
      : new Symbol(new Path.Ellipse({
        from: [0, 0],
        to: [13, 8],
        fillColor: '#252525'
      }))).place();
    this.path = new Path({
      strokeColor: '#252525',
      strokeWidth: 2,
      strokeCap: 'round'
    });
    this.shortPath = new Path({
      strokeColor: '#252525',
      strokeWidth: 4,
      strokeCap: 'round'
    });
  },

  updateItems: function() {
    this.path.segments = this.points;
    this.shortPath.segments = this.points.slice(0, 3);

    this.head.position = this.position;
    var angle = this.vector.angle;
    this.head.rotate(angle - this.lastAngle);
    this.lastAngle = angle;
  },

  // We accumulate a new acceleration each time based on three rules
  flock: function(boids) {
    this.calculateDistances(boids);
    var separation = this.separate(boids) * 3;
    var alignment = this.align(boids);
    var cohesion = this.cohesion(boids);
    this.acceleration += separation + alignment + cohesion;
  },

  calculateDistances: function(boids) {
    for (var i = 0, l = boids.length; i < l; i++) {
      var other = boids[i];
      this.distances[i] = other.position.getDistance(this.position, true);
    }
  },

  update: function() {
    // Update velocity
    this.vector += this.acceleration;
    // Limit speed (vector#limit?)
    this.vector.length = Math.min(this.maxSpeed, this.vector.length);
    this.position += this.vector;
    // Reset acceleration to 0 each cycle
    this.acceleration = new Point();
  },

  seek: function(target) {
    this.acceleration += this.steer(target, false);
  },

  arrive: function(target) {
    this.acceleration += this.steer(target, true);
  },

  borders: function() {
    var vector = new Point();
    var position = this.position;
    var radius = this.radius;
    var size = view.size;
    if (position.x < -radius) vector.x = size.width + radius;
    if (position.y < -radius) vector.y = size.height + radius;
    if (position.x > size.width + radius) vector.x = -size.width -radius;
    if (position.y > size.height + radius) vector.y = -size.height -radius;
    if (!vector.isZero()) {
      this.position += vector;
      var points = this.points;
      for (var i = 0, l = points.length; i < l; i++) {
        points[i] += vector;
      }
    }
  },

  // A method that calculates a steering vector towards a target
  // Takes a second argument, if true, it slows down as it approaches
  // the target
  steer: function(target, slowdown) {
    var steer,
      desired = target - this.position;
    var distance = desired.length;
    // Two options for desired vector magnitude
    // (1 -- based on distance, 2 -- maxSpeed)
    if (slowdown && distance < 100) {
      // This damping is somewhat arbitrary:
      desired.length = this.maxSpeed * (distance * 0.001);
    } else {
      desired.length = this.maxSpeed;
    }
    steer = desired - this.vector;
    steer.length = Math.min(this.maxForce, steer.length);
    return steer;
  },

  separate: function(boids) {
    var desiredSeperation = 3600;
    var steer = new Point();
    var count = 0;
    // For every boid in the system, check if it's too close
    for (var i = 0, l = boids.length; i < l; i++) {
      var distance = this.distances[i];
      if (distance > 0 && distance < desiredSeperation) {
        // Calculate vector pointing away from neighbor
        var delta = this.position - boids[i].position;
        delta.length = 1 / distance;
        steer += delta;
        count++;
      }
    }
    // Average -- divide by how many
    if (count > 0)
      steer /= count;
    if (!steer.isZero()) {
      // Implement Reynolds: Steering = Desired - Velocity
      steer.length = this.maxSpeed;
      steer -= this.vector;
      steer.length = Math.min(steer.length, this.maxForce);
    }
    return steer;
  },

  // Alignment
  // For every nearby boid in the system, calculate the average velocity
  align: function(boids) {
    var neighborDist = 25;
    var steer = new Point();
    var count = 0;
    for (var i = 0, l = boids.length; i < l; i++) {
      var distance = this.distances[i];
      if (distance > 0 && distance < neighborDist) {
        steer += boids[i].vector;
        count++;
      }
    }

    if (count > 0)
      steer /= count;
    if (!steer.isZero()) {
      // Implement Reynolds: Steering = Desired - Velocity
      steer.length = this.maxSpeed;
      steer -= this.vector;
      steer.length = Math.min(steer.length, this.maxForce);
    }
    return steer;
  },

  // Cohesion
  // For the average location (i.e. center) of all nearby boids,
  // calculate steering vector towards that location
  cohesion: function(boids) {
    var neighborDist = 10000;
    var sum = new Point(0, 0);
    var count = 0;
    for (var i = 0, l = boids.length; i < l; i++) {
      var distance = this.distances[i];
      if (distance > 0 && distance < neighborDist) {
        sum += boids[i].position; // Add location
        count++;
      }
    }
    if (count > 0) {
      sum /= count;
      // Steer towards the location
      return this.steer(sum, false);
    }
    return sum;
  }
});

var pathXOffset = 0;
var pathYOffset = 0;
var point = new Point(pathXOffset, pathYOffset);
var size = new Size(340, 340);
var rectPath = new Path.Rectangle(point, size);
var boids = [];
var groupTogether = false;
var count = 0
// Add the boids:
for (var i = 0; i < 40; i++) {
  var position = Point.random() * view.size;
  boids.push(new Boid(position, 10, 0.05));
}

function updatePoint(event) {
  //TODO
}

function onFrame(event) {
  for (var i = 0, l = boids.length; i < l; i++) {
    if (groupTogether) {
      var length = ((i + event.count / 40) % l) / l * rectPath.length;
      var point = rectPath.getPointAt(length);
      if (point)
        boids[i].arrive(point);
    }
    boids[i].run(boids);
  }
}

// SET LOCATION
$('.twitter').mouseover(function () {
//  pathXOffset = $('.twitter').offset().left;
//  pathYOffset = $('.twitter').offset().top;  
  
  groupTogether = !groupTogether;

}).mouseout(function() {
  groupTogether = !groupTogether;
});

function onKeyDown(event) {
  if (event.key == 'space') {
    var layer = project.activeLayer;
    layer.selected = !layer.selected;
    return false;
  }
}
