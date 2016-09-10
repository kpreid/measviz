Measviz
=======

Measviz is a library for easily capturing and visualizing performance data within a JavaScript-based game, animation, or simulation in a single Web page.

It also includes a facility for displaying real-time scrolling [sparkline](https://en.wikipedia.org/wiki/Sparkline) graphs, designed for displaying the gathered performance data but usable independently.

Disclaimer: This version of Measviz is a very early draft, freshly extracted from being an inseparable component of [Cubes](https://github.com/kpreid/cubes). The current interface should be considered subject to change. If you depend on this library, make sure you specify the particular revision.

Requirements
------------

The browser must support ECMAScript 5 and the `<canvas>` 2D Context API. `localStorage` is useful but not mandatory.

Usage
-----

TODO: This section should be expanded and refined, perhaps with live demos and complete code samples, but definitely with a complete reference manual.

* Load the CSS stylesheet `src/measviz.css` in your page. All of its rules use class names prefixed with “`measviz-`”, so it should not conflict with your own styles. If you prefer, you can write your own styles, but the requirements are subject to change.

* Load the JavaScript file `src/measviz.js` in your page. It will create a single global variable `measviz`.

* Create a hierarchy of measurement quantities. Example:

        var TopGroup = measviz.TopGroup;
        var ViewGroup = measviz.ViewGroup;
        var TaskGroup = measviz.TaskGroup;
        var Counter = measviz.Counter;
        
        var measuring = {};
        measuring.all = new TopGroup("Performance", [
          measuring.second = new ViewGroup("Per second", [
            measuring.simCount = new Counter("Steps"),
            measuring.frameCount = new Counter("Frames")
          ]),
          measuring.sim = new TaskGroup("Simulation", [
            measuring.collisionTests = new Counter("Collision points")
          ]),
          measuring.frame = new TaskGroup("Frame", [
            measuring.vertices = new Counter("Vertices")
          ])
        ]);
  Always start with a `TopGroup` (this distinction should be removed in the future). A `ViewGroup` is a simple container. A `TaskGroup` defines a recurring task where the quantities of interest are the time taken and counts of individual events during the task.

* Create the HTML display.

        var display = measuring.all.createDisplay(
          document, localStorage, "my-app.measviz");
        
        document.body.appendChild(display.element);
  
  The display will use `localStorage` to store the state of its toggles, under keys which are prefixed with the provided string followed by a “`.`”.

* Measure the quantities of interest. `TaskGroup`s and `Counter`s measure totals accumulated between `.start()` and `.end()`; these operations apply to all children in the hierarchy.

        function drawFrame() {
          measuring.frame.start();
          myObjects.forEach(function (obj) {
            obj.draw();
            measuring.vertices.inc(obj.vertices);
          });
          measuring.frame.end();

* Update the display. Do this only once per frame, since it is the most expensive operation in all of Measviz.

          display.updateIfVisible();
        }

Development
-----------

Measviz has a test suite using the [Jasmine](https://github.com/pivotal/jasmine) test framework, compatible with version v1.2.0-24-g5ca2888.

License
-------

Except as otherwise noted in individual files, all source code and other materials are Copyright © 2011-2012 Kevin Reid, and licensed as follows (the “MIT License”):

> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
> 
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
> 
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
