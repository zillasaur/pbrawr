function get_xhr() {
  var req;
  if (window.XMLHttpRequest) {
    req = new XMLHttpRequest();
  } else {
    try {
      req = new ActiveXObject("Msxml2.XMLHTTP");
    } catch (e) {
      req = new ActiveXObject("Microsoft.XMLHTTP");
    }
  }
  return req;
}

function get_xv(xml, v) {
  try {
    return xml.getElementsByTagName(v)[0].firstChild.nodeValue;
  } catch (e) {  
    return null;
  }
}

function load_event(req, callback) {
  if (req.readyState == 4) {
    if (req.status == 200) {
//      alert(req.responseText);
      callback(req.responseXML);
    } else {
      callback(null);
    }
  }
}

function send_interact_to_server(name, pairs, callback) {
  pairs.push(["action", name]);
  pairs.push(["rnd", Math.random()]);
  var smushed = [];
  for (var a in pairs) {
    pairs[a][0] = escape(pairs[a][0]);
    pairs[a][1] = escape(pairs[a][1]);
    smushed.push(pairs[a].join("="));
  }
  var str = smushed.join("&");
  var req = get_xhr();
  if (callback != null)
    req.onreadystatechange = function () { load_event(req, callback) };
  req.open('GET', 'interact.fcgi?' + escape(str), true);
  req.send('');
}

function create_cookie(name, value, days)
{
    if (days) {
      var date = new Date();
      date.setTime(date.getTime()+(days*24*60*60*1000));
      var expires = "; expires="+date.toGMTString();
    } else {
      var expires = "";
    }
    document.cookie = name+"="+value+expires+"; path=/";
}

function read_cookie(name)
{
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for(var i=0; i<ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0)==' ') {
	    c = c.substring(1, c.length);
    }
    if (c.indexOf(nameEQ) == 0) {
	    return c.substring(nameEQ.length, c.length);
    }
  }
  return null;
}

function erase_cookie(name)
{
  create_cookie(name, "", -1);
}

