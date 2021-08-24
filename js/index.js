
// import { SVG } from '@svgdotjs/svg.js'


var frameWidth = 1440;
var frameHeight = 3200;

var draw = SVG().addTo('#drawing').viewbox(0,0,frameWidth, frameHeight);

var rotatePoint = function(deg, [x, y]) {
    var rad = deg / 180 * Math.PI;
    return [Math.cos(rad) * x - Math.sin(rad) * y, Math.sin(rad) * x + Math.cos(rad) * y];
}

var randRange = function(r, min, max) {
    return r * (max - min) + min;
}
/**
 * Box Muller transform, creates a pair of normally distributed random numbers from unifrom
 * @param {Number} r1 Uniform random variable #1 [0-1]
 * @param {Number} r2 Univrom random variable #2 [0-1]
 * @returns {[Number, Number]} a pair of normally distributed random numbers
 */
var boxMuller = function(r1, r2) {
    var z1 = Math.sqrt(-2 * Math.log(r1)) * Math.cos(2 * Math.PI * r2)
    var z2 = Math.sqrt(-2 * Math.log(r1)) * Math.sin(2 * Math.PI * r2)
    return [z1, z2];
}

var perlinRandom = function (i, gridSize, resolution) {
    var x = i * gridSize / resolution;
    return perlin.get(x, x);
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Correlates to random variables based on a correlation factor
 * @param {Number} rat Correlation factor [0-1] (lower prefers left, higher prefers right)
 * @param {Number} r1 Random value 1 [0-1]
 * @param {Number} r2 Random value 2 [0-1]
 * @param {Bool?} i1 Invert random value 1 (default false)
 * @param {Bool?} i2 Invert random value 2 (default false)
 * @returns {Number} a value related to the two input [0-1]
 */
var correlate = function (rat, r1, r2, i1, i2) {
    var r1_ = i1 ? 1 - r1 : r1
    var r2_ = i2 ? 1 - r2 : r2
    return (1 - rat) * r1_ + rat * r2_;
}

var makeLine = function(gridSize, resolution, shapeVar, gravity) {
    perlin.seed();
    var points = [];
    var x = 0, y = 0;
    for (var i=0; i < gridSize * resolution; i++) {
        x = 5 * i + Math.random() * 2 - 1;
        y = Math.random() * Math.pow(i, 0.8); // leaves
        x += y * gravity; // gravity
        y += perlinRandom(i, gridSize, resolution) * shapeVar; // tree shape
        points.push([x, y]);
    }
    points.push([(gridSize * resolution + 10) * 5, 0]);
    // console.log(points);
    return points;
}

var makeTreePoly = function(draw, height, angle, shapeVarL, shapeVarR, gravity, scale) {
    var right = makeLine(height, 64, shapeVarR, gravity).map(([x,y]) => rotatePoint(90 - angle / 2, [x, -y]));
    var left = makeLine(height, 64, shapeVarL, gravity).map((xy) => rotatePoint(90 + angle / 2, xy));
    var points = _.chain(right).concat(left.reverse()).map(([x,y]) => [x*scale,y*scale]).value();
    console.log(scale);
    return draw.polygon(points);
}

var sigmoid = function(z) {
    return 1 / (Math.exp(-z) + 1);
}

// var colors = [
//     '#110077',
//     '#FF4499'
// ]


var depthColor = function(z) {
    var r = z / 32;
    var g = 0 + (z > 16 ? z - 16 : 0) / 64;
    var b = 0.5 + z / 128;
    return 'rgb(' + Math.floor(r*255) + ',' + Math.floor(g*255) + ',' + Math.floor(b*255) + ')';
}

var scaleFactor = 0.25;

var makeTree = function(draw, z) {
    var heightR = Math.random();
    var height = randRange(heightR, 0.2, 2);
    var angleR = correlate(0.75, heightR, Math.random(), true); 
    var angle = randRange(angleR, 15, 50);
    var shapeVarRR = correlate(0.9, heightR, Math.random());
    var shapeVarR = randRange(shapeVarRR, 20, 50);
    var shapeVarRL = correlate(0.9, heightR, Math.random());
    var shapeVarL = randRange(shapeVarRL, 20, 50);
    var gravityR = correlate(0.5, angleR, Math.random());
    var gravity = randRange(gravityR, 0.5, 1);
    var g = draw.group();
    var scale = 1 / (z * scaleFactor);
    var color = depthColor(z);
    console.log(height, angle, shapeVarL, shapeVarR, gravity, color);
    var p = makeTreePoly(g, height, angle, shapeVarL, shapeVarR, gravity, scale);
    p.fill(color);
    // g.circle(10).fill('white').stroke('black');
    p.transform({
        translateX: 0,
        translateY: - height * 60 * 5 * 1 / (z * scaleFactor)
    });
    return g;

}

// var right = makeLine(16, 64).map((xy) => rotatePoint(70, xy));
// var left = makeLine(16, 64).map((xy) => rotatePoint(110, xy));
// var points = right + left.reverse();

// var r = () => 0;
// var pr = (i,z,h) => 0;
var r = () => Math.random();
var pr = (i,z,h) => -Math.cos(i / z);


var makeLayer = function(draw, z, n, width, height) {
    var points = []
    var x, y;
    var ys = [];
    for (var i=0; i < n; i++) {
        x = i * width / n + r() * (1 / z * scaleFactor) * 64;
        y = height - (1 * Math.pow(z, 0.85) * 2 - pr(i, z, 64)*16) * 16;
        if (ys.length == 3) {
            ys = _.tail(ys);
        }
        ys.push(y);
        var m = _.mean(ys);
        points.push([x,m]);
        var g = draw.group();
        makeTree(g, z)
        g.transform({
            translateX: x,
            translateY: _.max([y,m])
        });
    }
    points.push([width,y])
    points.push([width,height])   
    points.push([0,height])    
    var color = depthColor(z);
    console.log(color)
    draw.polygon(points).stroke(color).fill(color)
}
draw.size(frameWidth, frameHeight)
draw.rect(frameWidth, frameHeight).fill('black')
makeLayer(draw, 32, 120, frameWidth, frameHeight);
makeLayer(draw, 28, 120, frameWidth, frameHeight);
makeLayer(draw, 24, 120, frameWidth, frameHeight);
makeLayer(draw, 20, 120, frameWidth, frameHeight);
makeLayer(draw, 16, 80, frameWidth, frameHeight);
makeLayer(draw, 12, 60, frameWidth, frameHeight);
makeLayer(draw, 8, 30, frameWidth, frameHeight);
makeLayer(draw, 4, 10, frameWidth, frameHeight);
