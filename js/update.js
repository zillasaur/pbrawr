// global variables storing all 3 boxes
//
// inputbox: gets input from user
// outputbox: displays static info to user

// allow for (a) not me. (b) delete event
var inputBox, outputBox, editBox;

var players;
var days;
var events = [];
var pltoi = [];
var grid;
var num_before = 4, num_after = 2;
var name = "", n_row = -1;
var isb = false;
var ie = document.all && document.getElementById;
var ns = document.getElementById && !document.all;

//
// init functions
//

function change_range() {
  var s = g("before-range");
  num_before = parseInt(s.options[s.selectedIndex].value);
  s = g("after-range");
  num_after = parseInt(s.options[s.selectedIndex].value);
  g("range-go").value = "Please wait...";
  create_cookie("before", num_before, 300);
  create_cookie("after", num_after, 300);
  init();
}

function init() {
  initBoxes();
  var old_b = read_cookie("before");
  if (old_b)
    num_before = parseInt(old_b);

  var old_a = read_cookie("after");
  if (old_a)
    num_after = parseInt(old_a);

  num_days = num_before + num_after + 1;
  create_range_boxes(num_before, "before");
  create_range_boxes(num_after, "after");
  send_interact_to_server('getData', [['numDaysBefore', num_before], ['numDaysAfter', num_after]], init_callback);
}

function create_range_boxes(num, id) {
  var out;
  out = "<select id='"+id+"-range' style='font-size: 10px'>";
  for (var i = 0 ; i < 20 ; i++) 
    out += "<option value="+i+" " + (i == num ? "selected" : "") + ">"+i+"</option>";
  out += "</select>";
  g(id+"-select").innerHTML = out;
}

function sort_players(l) {
/*  var a = [], b = [];
  for (var i in l) {
  if (l[i].team == "A")
    a.push(l[i]);
  else 
    b.push(l[i]);
  }

  a.sort(f);
  b.sort(f);
  */
  var f = function (a,b) { if (a.name ==  b.name) return 0; if (a.name < b.name) return -1; return 1; };
  l.sort(f);
  return l;
}

function logout() {
  g("sel").disabled = false;
  g("change").style.visibility = "hidden";
}

function go(n) {
  if (n == " ") {
    name = null;
    g("table").innerHTML = "";
    create_cookie("name", "", 300);
    return;
  }

  g("sel").disabled = true;
  g("change").style.visibility = "visible";
  name = n;
  create_cookie("name", name, 300);
  generate_table();
}

function populate_dropdown(l) {
  var names = [];
  for (var d in l) 
    names.push(l[d].name);
  names.sort();
  var sel = g("names");
  var ih = "<select onchange='go(this.options[this.selectedIndex].value)' id='sel'>\n";
  names.unshift(" ");
  for (var i in names) {
    var s;
    if (name == names[i] || name == null && names[i] == " ") {
      s = "selected";
    }
    else s = "";
    ih += "<option "+s+" value='"+names[i]+"'>"+names[i]+"</option>\n";
  }
  ih += "</select>";
  sel.innerHTML = ih;
}

function init_callback(xml) {
   var resp = null;
   resp = parseData(xml);
   g("range-go").value = "Go";
   if (resp == null) {
     alert("Cannot contact server. Please try again later.");
     return;
   }
   name = read_cookie("name");
   populate_dropdown(resp[0]);
   if (name != null && name != "" && name != 'null') {
     g("sel").disabled = true;
     g("change").style.visibility = "visible";
   }
   players = sort_players(resp[0]);
   days = resp[1];
   grid = new Object();
   for (var i in players) {
     var a = new Array(num_days);
     for (var k = 0 ; k < num_days ; k++) {
       a[k] = 0;
     }
     grid[players[i].name] = a;
   }

   for (var d in days) {
     for (var e in days[d].events) {
       var ev = days[d].events[e];
       events[ev.id] = ev;
       for (var pl in ev.who) {
         var pl_name = ev.who[pl];
         if (grid[pl_name] == null)
           alert(pl_name);
         grid[pl_name][d] = ev.id;
       }
     }
   }
   
   if (name != "" && name != null) {
     for (var i in players) {
       if (players[i].name == name)
         generate_table();
     }
   }
}

function generate_header() {
  var o = "<tr><td style='color: white'><nobr><b>Anton Favorini-Longname</b></nobr></td>";
  for (var i in days) {
    var d = days[i];
    var mdy = d.month + "/" + d.dayofmonth + "/" + d.year;
//      var des = (i == num_before ? "Today" : d.dayname);
    var des = d.dayname;
    var today = (i == num_before ? "style='background: #bbccee'" : "");
    o += "<td class='day' "+today+"><b>" + des + "</b><br>" + mdy + "</td>";
  }
  o += "</tr>\n";
  return o;

}

function name_mouseover(pl) {
  return " onmouseover='return tooltip(event, this, \"Phone number: " + pl.phone + "<br>Email: " + pl.email + "\")' ";
}

function show(id, eid) {
  var obj = g(id);
  var e = events[eid];

  g(id+"-b").style.visibility = "visible";
  if (e != null) {
    g("output-box-desc").innerHTML = e.description;//"kickass";
    g("output-box-where").innerHTML = e.where;//"there";
    g("output-box-when").innerHTML = e.when;//"later";
    g("output-box-who").innerHTML = e.who.join(", ");//"chumps";
    outputBox.set_position_obj(AUTO, obj, RIGHT, TOP);
    outputBox.manifest();
  }
}

function hide(id) {
  g(id+"-b").style.visibility = "hidden";
  outputBox.hide();
}


function gen_id(row, col) { return row + "-" + col; }
function shorten(str) {
  var chars = 8;
  var o = str.replace("<br>", " ").substr(0,chars);
  if (str.length > chars)
    o += "...";
  return o;
}

function b(s) {
  return " border-"+s+": 4px solid #dd9966; ";
}

function gen_ti(s) {
  return "<tr><td colspan="+(num_days+1)+" class='tirow'>"+s+"</td></tr>";
}

function generate_row(pl, i) {
  var o = "";
  if (pl.team == "B" && !isb) {
    isb = true;
    o += gen_ti("B");
  }
  var is_my_row = 0;
  var z = "";
  if (pl.name == name) {
    if (pl.email == "-") {
      var email = prompt("Please enter your email address here.", "");
      if (email != null && email != "") {
        pl.email = email;
        send_interact_to_server("addEmail",
                                [["who", name],
                                 ["email", email]],
                                function (xml) { });
      }
    }
    
    is_my_row = 1;
    n_row = i;
    z = " style='"+b("left")+b("top")+b("bottom")+" border-right: 1px solid black' ";
  }
  pltoi[pl.name] = i;
  var q = ""; var c = "#bbccee";
  if (i % 2 == 0) { q = " class='even' "; c = "#a2c5d6"; }
  o += "<tr "+q+"><td class='name' " + z + name_mouseover(pl) + ">"+pl.name+"</td>";
  var cnt = 0;
  for (var ei = 0 ; ei < num_days ; ei++) {
    var id = gen_id(i, ei);
    var e = grid[pl.name][ei];
    var bor = (is_my_row ? b("top") + b("bottom") : "");
    if (is_my_row && ei == num_days - 1) bor += b("right");
    if (ei == num_before) bor += "background: "+c+";";
    var sty = " style='"+bor+"' ";
    o += "<td id='"+id+"' "+sty+">";
    o += "<div id='"+id+"-d' style='vertical-align: top'>&nbsp;</div>";
    o += "<div style='text-align: center; vertical-align: bottom;' class='action' id='"+id+"-b'></div></td>";
  }
  o +="</tr>";
  return o;
}

function generate_table() {
  var t = "<table class='grid'>";
  t += generate_header();
  t += gen_ti("Roster");
  isb = false;
  for (var i in players) {
    t += generate_row(players[i], i);
  }
  t += "</table>";
  g("table").innerHTML = t;
  populate_buttons();
}

function gen_metoo_func(e, col, obj) {
  return function() { metoo(e, col, obj) };
}

function gen_newevent_func(col, obj) {
  return function(event) { new_event(event, col, obj); };
}

function populate_buttons_row(n) {
  var my_row = grid[name];
  var i = pltoi[n];
  var row = grid[n];
  for (var ei = 0 ; ei < num_days ; ei++) {
    var after = (ei > num_before ? 1 : 0);
    var id = gen_id(i,ei);
    var o = g(id+"-b");
    var ev = events[row[ei]];
    if (row != my_row) {
      if (row[ei] > 0 && my_row[ei] == 0) {
        o.style.cursor = "pointer";
        o.onclick = gen_metoo_func(ev, ei, o, n);
        o.innerHTML = "Me too";
      } else {
        o.onclick = null;
        o.style.cursor = "default";
        o.innerHTML = "&nbsp;";
      }
    } else {
      if (row[ei] > 0) {
        o.onclick = null;
        o.style.cursor = "default";
        o.innerHTML = "<span style='cursor: pointer;' onclick='notme(events["+row[ei]+"], "+ei+", g(\""+id+"-b\"))'>Not me</span>";
        o.innerHTML += " / <span style='cursor: pointer;' onclick='edit(event, "+ei+", g(\""+id+"-b\"))'>Edit</span>";
      } else {
        o.onclick = gen_newevent_func(ei, o, n);
        o.innerHTML = "New event";
        o.style.cursor = "pointer";
      }
    }
    if (row[ei] > 0) {
      g(id+"-d").innerHTML = shorten(ev.description);
    } else {
      g(id+"-d").innerHTML = "&nbsp;";
    }
    var obj = g(id);
    obj.onmouseover = gen_show_func(id, row[ei]);
    obj.onmouseout = gen_hide_func(id);

  }

}

function populate_buttons() {
  for (var i in players) {
    var pl = players[i];
    populate_buttons_row(pl.name);
  }
}

function gen_show_func(id, eid) {
  return function () { show(id, eid); }
}

function gen_hide_func(id) {
  return function () { hide(id);  }
}

function get_mouse_coords(e) {
  var posx, posy;
  if (e.pageX || e.pageY) {
    posx = e.pageX;
    posy = e.pageY;
  }
  else if (e.clientX || e.clientY) {
    posx = e.clientX + document.body.scrollLeft
      + document.documentElement.scrollLeft;
    posy = e.clientY + document.body.scrollTop
      + document.documentElement.scrollTop;
  }
  return [posx, posy];
}

function tooltip(event, obj, text) {
  if (! event) var event = window.event;
  tooltip_box.content = "<span style='font-size: 11px'>"+text+"</span>";
  var mo = obj.onmouseout;
  obj.onmouseout = function(e) { tooltip_box.hide(); this.onmouseout = mo; };
//  tooltip_box.set_position_obj(AUTO, obj, RIGHT, TOP);
  var p = get_mouse_coords(event);
  tooltip_box.set_position_point(AUTO, p[0], p[1]);
  tooltip_box.manifest();

  return false;
}

function initBoxes() {
  tooltip_box = new Box();
  tooltip_box.width = 250;
  tooltip_box.x = 5;
  tooltip_box.y = 5;

  inputBox = new Box();
  //inputBox.width = 400;
  inputBox.dim_screen = false;
  inputBox.grab_keys = false;
  inputBox.x = 5;
  inputBox.y = 5;
  inputBox.set_clickaway(function (t) { t.hide(); } );
  inputBox.content = g("input-box");
  var ibd = g("input-box-desc");
  ibd.style.overflow = "hidden";
  if (ns) ibd.rows -= 1;
  ibd.onkeyup = function() { if (resize_lines(ibd)) { inputBox.manifest(true); ibd.focus(); } };
  g("input-box-close").onclick = function() { inputBox.hide(); };

  editBox = new Box();
  //editBox.width = 400;
  editBox.dim_screen = false;
  editBox.grab_keys = false;
  editBox.x = 5;
  editBox.y = 5;
  editBox.set_clickaway(function (t) { t.hide(); } );
  editBox.content = g("edit-box");
  var ebd = g("edit-box-desc");
  ebd.style.overflow = "hidden";
  if (ns) ebd.rows -= 1;
  ebd.onkeyup = function() { if (resize_lines(ebd)) { editBox.manifest(true); ebd.focus() }};
  g("edit-box-close").onclick = function() { editBox.hide(); };

  outputBox = new Box();
  outputBox.width = 200;
  outputBox.dim_screen = false;
  outputBox.grab_keys = false;
  outputBox.x = 4;
  outputBox.y = 4;
//  outputBox.set_clickaway(function (t) { stopPersist(); t.hide(); } );
  outputBox.content = g("output-box");

}

function new_event(event, col, obj, n) {
    var box_obj = g(gen_id(n_row, col));
    stop_prop(event);
    g("input-box-desc").value = "";
    resize_lines(g("input-box-desc"));
    g("input-box-where").value = "";
    g("input-box-when").value = "";
    g("add_event_button").onclick = function() { submitEvent(col, obj, n); };
    inputBox.set_position_obj(AUTO, box_obj, RIGHT, TOP);
    inputBox.manifest();
}

function resize_lines(obj) {
  var lines = obj.value.split('\n');
  var new_rows = lines.length+1;
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (line.length >= obj.cols) { 
      new_rows += Math.floor(line.length / obj.cols);
//      alert("lines is now " + new_rows + " and cols is " + obj.cols);
    }
  }

//  alert(new_rows + " " + obj.rows);
  if (new_rows >= 3) { 
    if (ns) new_rows -= 1;
    var res = (obj.rows != lines);
    obj.rows = new_rows;
    return res;
  } 
  return false;
}

function edit(browser_event, col, obj) {
    var box_obj = g(gen_id(n_row, col));
    stop_prop(browser_event);
    var event = events[grid[name][col]];
    var st = event.description;
    st = st.replace(/<br>/g,"\n");
    g("edit-box-desc").value = st;
    resize_lines(g("edit-box-desc"));
    g("edit-box-where").value = event.where;
    g("edit-box-when").value = event.when;
    g("edit-box-who").innerHTML = event.who.join(", ");
    g("edit_event_button").onclick = function() { editEvent(event.id, col, obj); };
    editBox.set_position_obj(AUTO, box_obj, RIGHT, TOP);
    editBox.manifest();
}

function wait(o) {
  o.innerHTML = "Please wait...";
}

function metoo(e, col, obj) {
  wait(obj);
   send_interact_to_server("meToo", 
      [["eventId", e.id], 
       ["who", name]], function(xml) { callbackGen(xml, col); });
}

function notme(e, col, obj) {
  if (e.who.length == 1) {
    if (! confirm("Are you sure? This event will be deleted."))
      return;
  }
  wait(obj);
  send_interact_to_server("notMe", 
                          [["eventId", e.id], 
                           ["who", name]], function(xml) { callbackNotMe(xml, col); });
}

function submitEvent(col, obj) {
  if (! /\w/.test(g("input-box-desc").value)) {
    alert("Please enter a description.");
    return;
  }
  wait(obj);

  var day = days[col];
   send_interact_to_server("newEvent",
      [["description", g("input-box-desc").value],
       ["where", g("input-box-where").value],
       ["when", g("input-box-when").value],
       ["who", name],
       ["year", day.year],
       ["month", day.month],
       ["day", day.dayofmonth]], 
       function (xml) { callbackGen(xml, col); });
   inputBox.hide();
}

function editEvent(id, col, obj) {
  if (! /\w/.test(g("edit-box-desc").value)) {
    alert("Please enter a description.");
    return;
  }
  wait(obj);
  send_interact_to_server("editEvent",
                          [["description", g("edit-box-desc").value],
                           ["where", g("edit-box-where").value],
                           ["when", g("edit-box-when").value],
                           ["id", id]],
                          function (xml) { callbackGen(xml, col); });
  editBox.hide();
}

//
// callback functions
//
function callbackNotMe(xml, col) {
   if (xml == null) {
     alert("Could not contact server. Try again later.");
     return;
   }
   var e = parseEvent(xml);
   if (e.who.length == 0) {
     delete events[e.id];
   } else {
     events[e.id] = e;
   }
   grid[name][col] = 0;

   populate_buttons();
}

function callbackGen(xml, col) {
   if (xml == null) {
     alert("Could not contact server. Try again later.");
     return;
   }
   var e = parseEvent(xml);
   events[e.id] = e;
   grid[name][col] = e.id;
   populate_buttons();
}

function stop_prop(e) {
  if (!e) var e = window.event;
  if (e.stopPropagation) e.stopPropagation(); 
  e.cancelBubble = true;
}

function g(a) {
  return document.getElementById(a);
}

function get_absolute_position(e) {
  var x = 0;
  var y = 0;
  while(e) {
    x += e.offsetLeft;
    y += e.offsetTop;
    e = e.offsetParent;
  }
  return [x,y];
}

