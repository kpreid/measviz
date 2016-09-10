// Copyright 2012 Kevin Reid under the terms of the MIT License as detailed
// in the accompanying file README.md or <http://opensource.org/licenses/MIT>.

(function () {
  function StubStorage() {
    var data = Object.create(null);
    this.getItem = function (name) {
      return name in data ? data[name] : null;
    };
    this.setItem = function (name, value) {
      data[name] = String(value);
    };
    this.removeItem = function (name) {
      delete data[name];
    };
  }
  
  function elementIsVisible(element) {
    return element.offsetWidth > 0;
  }
  
  var Counter = measviz.Counter;
  var Graph = measviz.Graph;
  var TaskGroup = measviz.TaskGroup;
  var TopGroup = measviz.TopGroup;
  var ViewGroup = measviz.ViewGroup;
  
  beforeEach(function () {
    this.addMatchers({
      toBeVisible: function () {
        return elementIsVisible(this.actual);
      }
    });
  });
  
  describe("createDisplay", function () {
    it("toggles should default to open", function () {
      var top, q;
      top = new TopGroup("top", [
        q = new Counter("q")
      ]);
      
      var display = top.createDisplay(document, new StubStorage(), "prefix");
      document.body.appendChild(display.element);
      
      expect(document.querySelector(".measviz-quantity")).toBeVisible();
    });
  });
  
  describe("Graph", function () {
    it("should not emit smoke", function () {
      var graph = new Graph({
        buffer: new Uint32Array(),
        getBufferIndex: function () { return 0; }
      });
      document.body.appendChild(graph.element);
      expect(graph.element.nodeName).toBe('CANVAS');
      graph.draw();
      graph.draw();
    });
  });
  
  // TODO: Add source code linting.  
}());
