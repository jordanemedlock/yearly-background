/// <reference path="./svg.js.d.ts" />

import { Svg } from '@svgdotjs/svg.js';
import { SVG } from '../js/svg.js'

type Size = [number, number];

var frame: Size = [1440, 3200];

var draw: Svg = SVG().addTo('#drawing').viewbox(0,0, ...frame);
draw.rect(...frame).fill('black');



console.log('Hello World!');