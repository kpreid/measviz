// Copyright 2011-2012 Kevin Reid under the terms of the MIT License as detailed
// in the accompanying file README.md or <http://opensource.org/licenses/MIT>.

var measviz;
(function () {
  "use strict";
  
  // --- Imports and utilities ---
  
  var max = Math.max;
  var min = Math.min;
  
  var classPrefix = "measviz-";
  
  function numberWithCommas(x) {
    // source: http://stackoverflow.com/a/2901298/99692
    return (+x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  
  // Tests whether an element may be visible to the user.
  function elementIsVisible(element) {
    // Note: The offsetWidth test tests for display:none; it does not test for obscuration.
    return element.offsetWidth > 0;
  }
  
  // Helper for constructing DOM.
  function mkelement(name, classes/* , child, child, ... */) {
    var element = document.createElement(name);
    classes.forEach(function (c) {
      element.classList.add(classPrefix + c);
    })
    var i;
    for (i = 2; i < arguments.length; i++) {
      var childDes = arguments[i];
      if (typeof childDes === "string") {
        childDes = document.createTextNode(childDes);
      }
      element.appendChild(childDes);
    }
    return element;
  }
  
  // list of names obtained from game-shim
  var requestAnimationFrame =
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    function (callback) {
      setTimeout(callback, 1000/60);
    };
  requestAnimationFrame = requestAnimationFrame.bind(window);
  
  // --- Implementation ---
  
  function createToggle(storage, storageName, callback) {
    var toggleState = true;
    try {
      toggleState = !!JSON.parse(storage.getItem(storageName));
    } catch (e) {}
    var toggler = mkelement("button", ["toggle"]);
    function update() {
      if (toggleState) {
        toggler.textContent = "[−]" /* minus sign */;
      } else {
        toggler.textContent = "[+]";
      }
      callback(toggleState);
      return true;
    }
    update();
    toggler.addEventListener("click", function () {
      toggleState = !toggleState;
      try {
        storage.setItem(storageName, JSON.stringify(toggleState));
      } catch (e) {}
      update();
      return false;
    }, false);
    return toggler;
  }
  
  function ViewGroup(label, elements) {
    this.label = label;
    this.elements = elements;
  }
  ViewGroup.prototype.createDisplay = function (document, storage, stateContext) {
    var subContext = stateContext + "." + this.label;
    var container = mkelement("div", ["item", "group"]);
    var list = mkelement("ul", ["group-contents"]);
    var header = null;
    if (this.label) {
      header = mkelement("div", ["group-header"],
        createToggle(storage, subContext + ".visible", function (visible) {
          if (visible) {
            list.style.removeProperty("display");
          } else {
            list.style.display = "none";
          }
        }),
        document.createTextNode(" " + this.label)
      );
      container.appendChild(header);
    }
    container.appendChild(list);
    var updaters = [];
    this.elements.forEach(function (thing) {
      var subdisplay = thing.createDisplay(document, storage, subContext);
      list.appendChild(mkelement("li", ["group-element"], subdisplay.element));
      updaters.push(subdisplay.update.bind(subdisplay));
    });

    var animFrameWasRequested = false;
    return {
      element: container,
      header: header,
      update: function () {
        if (elementIsVisible(list)) {
          updaters.forEach(function (f) { f(); });
        }
      },
      updateIfVisible: function () {
        if (!animFrameWasRequested) {
          requestAnimationFrame(function () {
            animFrameWasRequested = false;
            this.update();
          }.bind(this), container);
          animFrameWasRequested = true;
        }
      }
    };
  };
  ViewGroup.prototype.start = function () {
    this.elements.forEach(function (e) { e.start(); });
  };
  ViewGroup.prototype.end = function () {
    this.elements.forEach(function (e) { e.end(); });
  };
  
  function TopGroup(label, elements) {
    ViewGroup.call(this, label, elements);
  }
  TopGroup.prototype = Object.create(ViewGroup);
  TopGroup.prototype.constructor = TopGroup;
  TopGroup.prototype.createDisplay = function (document, storage, stateContext) {
    var d = ViewGroup.prototype.createDisplay.call(this, document, storage, stateContext);
    var toggle = createToggle(storage, stateContext + ".graphsVisible", function (visible) {
      d.element.classList[visible ? "remove" : "add"](["hide-sparklines"]);
    });
    var bogusval = mkelement("span", ["value"]); // strictly for layout :(
    d.header.parentNode.insertBefore(toggle, d.header.nextSibling);
    d.header.parentNode.insertBefore(bogusval, d.header.nextSibling);
    return d;
  };
  
  function Quantity(label) {
    this.label = label;
    this.value = null;
    this.history = new Float32Array(100); // TODO magic number
    this.historyIndex = 0;
  }
  Quantity.prototype.createDisplay = function (document, storage, stateContext) {
    var labelElem, valueText, sparkCanvas;
    var container = mkelement("div", ["item", "quantity"],
      labelElem = mkelement("span", ["label"], this.label + ": "),
      mkelement("span", ["value"],
        valueText = document.createTextNode("")),
      sparkCanvas = mkelement("canvas", ["sparkline"])
    );
    
    // sparkline
    var sparkLength = sparkCanvas.width  = this.history.length;
    var sparkHeight = sparkCanvas.height = 1; // updated later via computed style
    var sparkContext = sparkCanvas.getContext("2d");
    var lastUpdateIndex = 0;
    
    var fillColor = "rgba(127,127,127,0.5)";
    
    return {
      element: container,
      update: function () {
        valueText.data = String(this.show());
        
        var indexOffset = this.historyIndex;
        if (elementIsVisible(sparkCanvas) &&
            lastUpdateIndex !== indexOffset /* there is new data */) {
          lastUpdateIndex = indexOffset;
          
          sparkHeight = parseInt(window.getComputedStyle(labelElem, null).height, 10) - 3;
          if (sparkHeight != sparkCanvas.height) sparkCanvas.height = sparkHeight;
          
          var history = this.history;
          var fgColor = window.getComputedStyle(sparkCanvas, null).color;
          
          sparkContext.clearRect(0, 0, sparkLength, sparkHeight);
          
          // Find maximum and minimum of graph
          var miny = 0 /* Infinity */; // assume 0 is a meaningful minimum
          var maxy = -Infinity;
          var i;
          for (i = sparkLength - 1; i >= 0; i--) {
            var y = history[i];
            miny = min(y, miny);
            maxy = max(y, maxy);
          }
          
          // Establish viewport of graph. The maximum zoom is 1 value unit = 1px.
          var viewScale = -min(1, (sparkHeight - 1)/(maxy - miny));
          var viewOffset = -miny * viewScale + sparkHeight - 1;

          // Draw graph: first background fill, then line
          sparkContext.fillStyle = fillColor;
          var scaley;
          for (i = sparkLength - 1; i >= 0; i--) {
            scaley = history[(i + indexOffset) % sparkLength] * viewScale + viewOffset;
            sparkContext.fillRect(i, scaley, 1, sparkHeight);
          }
          sparkContext.fillStyle = fgColor;
          for (i = sparkLength - 1; i >= 0; i--) {
            scaley = history[(i + indexOffset) % sparkLength] * viewScale + viewOffset;
            sparkContext.fillRect(i, scaley, 1, 1);
          }
        }
      }.bind(this)
    };
  };
  Quantity.prototype.start = function () {};
  Quantity.prototype.end = function () {
    var hi = this.historyIndex;
    this.history[hi] = this.value;
    this.historyIndex = (hi + 1) % this.history.length;
  };
  
  
  function Timer(label) {
    Quantity.call(this, label);
    var souper = Object.getPrototypeOf(this);
    
    var t0 = null;
    this.start = function () {
      t0 = Date.now();
      souper.start.call(this);
    };
    this.end = function () {
      var t1 = Date.now();
      this.value = t1 - t0;
      souper.end.call(this);
    };
  }
  Timer.prototype = Object.create(Quantity.prototype);
  Timer.prototype.show = function () {
    return this.value + " ms";
  };
  
  function Counter(label) {
    Quantity.call(this, label);
    var souper = Object.getPrototypeOf(this);
    
    // TODO it might be interesting to note out-of-bracket incs
    
    var counter = 0;
    this.inc = function (amount) {
      if (amount === undefined) amount = 1;
      counter += amount;
    };
    this.start = function () {
      souper.start.call(this);
    };
    this.end = function () {
      this.value = counter;
      counter = 0;
      souper.end.call(this);
    };
  }
  Counter.prototype = Object.create(Quantity.prototype);
  Counter.prototype.show = function () {
    return numberWithCommas(this.value);
  };
  
  function TaskGroup(label, elements) {
    var timer = new Timer("Time");
    ViewGroup.call(this, label, [timer].concat(elements));
    
    this.start = function () {
      Object.getPrototypeOf(this).start.call(this);
    };
    this.end = function () {
      Object.getPrototypeOf(this).end.call(this);
    };
  }
  TaskGroup.prototype = Object.create(ViewGroup.prototype);
  
  measviz = Object.freeze({
    Counter: Counter,
    TaskGroup: TaskGroup,
    TopGroup: TopGroup,
    ViewGroup: ViewGroup
  });
}());