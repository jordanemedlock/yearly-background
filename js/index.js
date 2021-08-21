

var draw = SVG('#drawing')

var rotatePoint = function(deg, [x, y]) {
    var rad = deg / 180 * Math.PI;
    return [Math.cos(rad) * x - Math.sin(rad) * y, Math.sin(rad) * x + Math.cos(rad) * y];
}

var randRange = function(r, min, max) {
    return r * (max - min) + min;
}

var perlinRandom = function (i, gridSize, resolution) {
    var x = i * gridSize / resolution;
    return perlin.get(x, x);
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

var depthColor = function(z) {
    var r = z / 32;
    var g = 0;
    var b = 0.5;
    return 'rgb(' + Math.floor(r*255) + ',' + Math.floor(g*255) + ',' + Math.floor(b*255) + ')';
}

var scaleFactor = 0.25;

var makeTree = function(draw, z) {
    var heightR = Math.random();
    var height = randRange(heightR, 0.2, 2);
    var angleCor = 0.25;
    var angleR = (1 - heightR) * angleCor + Math.random() * (1 - angleCor);
    var angle = randRange(angleR, 15, 50);
    var shapeVarCor = 0.1;
    var shapeVarRR = heightR * shapeVarCor + Math.random() * (1 - shapeVarCor);
    var shapeVarR = randRange(shapeVarRR, 20, 50);
    var shapeVarRL = heightR * shapeVarCor + Math.random() * (1 - shapeVarCor);
    var shapeVarL = randRange(shapeVarRL, 20, 50);
    var gravityCor = 0.5;
    var gravityR = angleR * gravityCor + Math.random() * (1 - gravityCor);
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


var makeLayer = function(draw, z, n) {

    var points = []
    var x, y;
    var ys = [];
    for (var i=0; i < n; i++) {
        x = i * window.innerWidth / n + r() * (1 / z * scaleFactor) * 64;
        y = window.innerHeight - (1 * z * 2 - pr(i, z, 64)*16) * 16;
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
    points.push([window.innerWidth,y])
    points.push([window.innerWidth,window.innerHeight])   
    points.push([0,window.innerHeight])    
    var color = depthColor(z);

    draw.polygon(points).stroke(color).fill(color)
}
makeLayer(draw, 20, 120);
makeLayer(draw, 16, 80);
makeLayer(draw, 12, 60);
makeLayer(draw, 8, 30);
makeLayer(draw, 4, 10);
