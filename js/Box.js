// (c) 2006 AJ Shankar and Bill McCloskey. All right reserved.

// for Box placement
var AUTO = 0;
var CENTERED = 1;

var TOP = 1;
var BOTTOM = 2;
var MIDDLE = 3;
var LEFT = 1;
var RIGHT = 2;

// dim screen
var clickaway_visible = null;
var box_id = 0;
var zindex = 1000;


function Box() {
  // PUBLIC FIELDS

  // pass these to set_position_*
  // centered means box is centered at point
  // auto means box top left is at point but may be moved if it doesn't fit on the screen
  // now in Constants.js
  // AUTO, CENTERED = 1;  

  // used for placement with objs
  // TOP, BOTTOM, MIDDLE, LEFT, RIGHT

  this.has_shadow = true;
  this.shadow_size = 5;
  this.classname = "tooltip";   // shadow's classname is this.classname + "shadow"
  this.width = 0; // if 0, then browser determines
  this.height = 0; // ditto
  this.x = 0; // offsets from position given in set_position_*
  this.y = 0;
  this.content = null; // HTML or a DOM element (e.g. DIV)
  this.id = box_id++;  // you can access this in case you need to hash this box

  // private fields
  this.dimmer = g("dim");
  this.clickaway_func = null;
  this.clickon_func = null;
  this.location = this.AUTO;
  this.box = null;
  this.shadow = null;
  this.relative_to_x = 0;
  this.relative_to_y = 0;
  this.centered_obj = null;
  this.is_visible = false;

  // PUBLIC METHODS
  // if an existing clickaway box is already visible at show-time, it will be hidden
  // otherwise, what a click means is confusing (which box should disappear?, etc.) 
  // set to null to turn off clickaway
  this.set_clickaway = function(func) {
    this.clickaway_func = func;
  };
  // callback if the box itself is clicked on
  this.set_clickon = function(func) {
    this.clickon_func = func;
  };

  // can position relative to a DOM object (or null for screen).
  // can pick any side of the obj or middle in either dimension.
  // I just realized that it should really have an option for "don't
  // cover up this obj" and autoposition from there. Later...
  this.set_position_obj = function(loc_type, obj, horiz, vert) {
    if (! vert) vert = MIDDLE;
    if (! horiz) horiz = MIDDLE;
    this.location = loc_type;
    var offx = 0, offy = 0;
    var w = 0, h = 0;
    if (obj) {
      var coords = get_absolute_position(obj);
      offx = coords[0]; 
      offy = coords[1];
      w = obj.offsetWidth;
      h = obj.offsetHeight;
      this.obj = obj;
    } else {
      w = Math.max(document.body.clientWidth, document.documentElement.clientWidth);
      h = Math.max(document.body.clientHeight, document.documentElement.clientHeight);
    }
    offx += (horiz == MIDDLE) ? (w/2) : ((horiz == RIGHT) ? w : 0);
    offy += (vert == MIDDLE) ? (h/2) : ((vert == BOTTOM) ? h : 0);
    this.relative_to_x = offx;
    this.relative_to_y = offy;
  };

  this.set_position_point = function(loc_type, rx, ry) {
    this.location = loc_type;
    this.relative_to_x = rx;
    this.relative_to_y = ry;
  };

  // can call manifest multiple times to reuse box:
  // just (re)set the position, content, and other variables as desired
  this.manifest = function(suppress_hiding) {
    var pt = typeof(this.content) == 'string' ? this.box : this.content;
    this.box = this.manifest_helper(pt);
    if (this.has_shadow) {
      this.shadow = this.manifest_helper(this.shadow);
//      this.shadow.innerHTML = this.box.innerHTML;
      this.shadow.className += "shadow";
      this.shadow.style.zIndex = zindex++;
    }
    // so that each box will appear on top of the previous, in case they are stacked
    this.box.style.zIndex = zindex++;
    this.show(suppress_hiding);
  };

  this.hide = function() {
    if (this.is_visible == false)
      return;
    if (this.clickaway_func) {
      if (this == clickaway_visible) {
        clickaway_visible = null;
        document.onclick = null; 
      }
    }
    if (this.grab_keys)
      enable_keys();
    this.box.style.display = "none";

    if (this.has_shadow) 
      this.shadow.style.display = "none";
    
    if (this.dim_screen)
      this.dimmer.style.display = "none";
  };

  // PRIVATE METHODS
  this.show = function(suppress_hiding) {
    if (this.clickaway_func) {
      this.add_clickaway();
    }
    if (this.clickon_func) {
      this.add_clickon();
    }
    if (this.grab_keys)
      disable_keys();

    if (! suppress_hiding) {
      this.box.style.visibility = "hidden";
      this.box.style.left = "0px";
      this.box.style.top = "0px";
      if (this.shadow) {
        this.shadow.style.visibility = "hidden";
        this.shadow.style.left = "0px";
        this.shadow.style.top = "0px";
      } 
    }
    this.box.style.display = "block";

    if (this.has_shadow) 
      this.shadow.style.display = "block";

    if (this.dim_screen)
      this.dimmer.style.display = "block";

    this.position();

    // only now make it visible
    this.box.style.visibility = "visible";
    if (this.shadow)
      this.shadow.style.visibility = "visible";

    this.is_visible = true;
  };

  this.add_clickaway = function() {
    if (clickaway_visible) {
      // try to let it know it's going away... ?
//      clickaway_visible.clickaway_func(clickaway_visible);
      clickaway_visible.hide();
    }
    clickaway_visible = this;
    if (! this.clickon_func) {
      this.box.onclick = function (e) { 
        if (!e) var e = window.event;
        if (e.stopPropagation) e.stopPropagation(); 
        e.cancelBubble = true;
      };
    }
    var a = this.clickaway_func;
    var b = this;
    document.onclick = function(e) { 
      a(b);
    };
  };

  this.add_clickon = function() {
    var a = this.clickon_func;
    var b = this;
    
    this.box.onclick = function (e) { 
      if (!e) var e = window.event;
      if (e.stopPropagation) e.stopPropagation(); 
      e.cancelBubble = true;
      a(b);
    };
  };

  this.manifest_helper = function(existing) {
    var b = existing ? existing : document.createElement("div");
    b.className = this.classname;
    if (this.width) 
      b.style.width = this.width + "px";

    if (this.height) 
      b.style.height = this.height + "px";

    if (typeof(this.content) == 'string')
      b.innerHTML = this.content; 
    if (existing == null) 
      document.body.appendChild(b);
   
    b.style.display = "none";
    return b;
  };

  // must defer positioning until right before display, in case other things have changed
  this.position = function() {
    var shoff = this.shadow_size;
    var basex = this.relative_to_x;
    var basey = this.relative_to_y;
    var x = basex + this.x;
    var y = basey + this.y;
    var width = this.box.offsetWidth;
    var height = this.box.offsetHeight;
    if (this.location == AUTO) {
      var body = (document.compatMode && document.compatMode != "BackCompat") ? 
        document.documentElement : document.body ? document.body : null;
      var screen_width = (body && body.clientWidth) ? body.clientWidth : window.innerWidth;
      var screen_height = (body && body.clientHeight) ? body.clientHeight : window.innerHeight;      
      //var screen_width = Math.max(document.body.clientWidth, document.documentElement.clientWidth) - 10;
      //var screen_height = Math.max(document.body.clientHeight, document.documentElement.clientHeight) - 10;
      if (x + width + shoff > screen_width) {
        x = basex - this.x - width - this.obj.offsetWidth; // - shoff;
        if (x < 10) x = 10;
      }
      if (y + height + shoff > screen_height) {
        y = basey - this.y - height; // - shoff;
        if (y < 10) y = 10;
      }
    } else if (this.location == CENTERED) {
      x -= width/2;
      y -= height/2;
    }
    this.box.style.left = x + "px";
    this.box.style.top = y + "px";
    if (this.has_shadow) {
      this.shadow.style.left = (x + shoff) + "px";
      this.shadow.style.top = (y + shoff) + "px";
      this.shadow.style.width = (width - 4) + "px";
      this.shadow.style.height = (height - 4)+ "px";
    }
  };

};

