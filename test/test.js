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
  
  var TopGroup = measviz.TopGroup;
  var ViewGroup = measviz.ViewGroup;
  var TaskGroup = measviz.TaskGroup;
  var Counter = measviz.Counter;
  
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
  
  // TODO: Add source code linting.  
}());
