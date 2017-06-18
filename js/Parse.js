function assign(o, x, ns) {
  for (var i in ns) 
    o[ns[i]] = get_xv(x, ns[i]);
}

function parseData(xml) {
  if (xml == null) {
    alert("Could not fetch data from server!");
    return;
  }
  var players = [];
  var pls = xml.getElementsByTagName("player");
  for (var i = 0 ; i < pls.length ; i++) {
    var pld = pls[i];
    var pl = new Object();
    assign(pl, pld, ["name", "email", "team", "phone"]);
    players.push(pl);
  }

  var realdays = [];
  var days = xml.getElementsByTagName("day");
  for (var i = 0 ; i < days.length ; i++) {
    var dayd = days[i];
    var d = new Object();
    assign(d, dayd, ["year", "month", "dayofmonth", "dayname"]);
    var evs = [];
    var events = dayd.getElementsByTagName("event");
    for (var j = 0 ; j < events.length ; j++) {
      var evd = events[j];
      evs.push(parseEvent(evd));
    }
    d["events"] = evs;
    realdays.push(d);
  }
  return [players, realdays];
}

function parseEvent(pld) {
  var e = new Object();
  assign(e, pld, ["description", "when", "where", "id"]);
  var foo = get_xv(pld, "who");
  if (foo == null)
    e["who"] = [];
  else
    e["who"] = foo.split(":");
  return e;
}


