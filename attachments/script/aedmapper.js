var pictureSource, userAgent, media, map, currentDoc, app = {}, marker, config;

var locWin = function(position) {
  var coords = position.coords;
  showMap(coords.latitude, coords.longitude);
};

var locFail = function(e) {
  if (navigator.geolocation) {
    err = "Cannot locate you -- Please enable geolocation in your settings";
  } else {
    err = "Error: Your browser doesnt support geolocation.";
  }
  alert(err)
  // default to downtown Boston
  showMap(42.35017139318913, -71.04257583618164);
};

function preventBehavior(e) { 
  e.preventDefault(); 
}
document.addEventListener("touchmove", preventBehavior, false);

function isMobile() {
  userAgent = navigator.userAgent;
	if (userAgent.indexOf('iPhone') >= 0 || userAgent.indexOf('Android') >= 0 ) {
		return true;
	}
  return false;
}

function uploadWin(doc) {
  var id = JSON.parse(doc).id;
  var uagent = navigator.userAgent.toLowerCase();
  var plus = "+";
  if (uagent.search("android") > -1) {
    var plus = "%2B";
  }
  var email = "data" + plus + id + "@aedmapper.com";
  $('#email-address').text(email);
  $('#email-link').attr('href', "mailto:" + email).css('-webkit-user-select', 'text');
  
}

function centerGeoJson() {
  return {
    "geometry": {
      "type": "Point",
      "coordinates": [map.getCenter().lng(), map.getCenter().lat()]
    }
  }
}

function uploadLocation() {
  var req = {
    url: config.couchUrl + "api",
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify(centerGeoJson()),
    success: uploadWin
  }
  if (currentDoc) {
    $.extend(req, {
      url: config.couchUrl + "api/" + currentDoc._id,
      type: "PUT",
      data: JSON.stringify($.extend(currentDoc, centerGeoJson()))
    })
  }
  $.ajax(req);
}

function camWin(imageData) {
  uploadPhoto(imageData);
}

function camFail(e) {
  debug.log(e);
}

function capturePhoto() {
	navigator.camera.getPicture(camWin, camFail, { quality: 50 }); 
}

// iPhone ONLY
function getPicture(source){
	navigator.camera.getPicture(camWin, camFail, {quality: 100, sourceType: source, allowEdit: false});
}

function getPictureEdit(source){
	navigator.camera.getPicture(camWin, camFail, {quality: 100, sourceType: source, allowEdit: true});
}

function capturePhotoEdit() {
	navigator.camera.getPicture(camWin, camFail, {quality: 100, allowEdit: true }); 
}

function bbox(map) {
  var bounds = map.getBounds();
  var sw = bounds.getSouthWest();
  var ne = bounds.getNorthEast();
  return sw.lng() + "," + sw.lat() + "," + ne.lng() + "," + ne.lat();
}

function showMap(latitude, longitude) {
  $('.crosshair').css('left', (document.body.clientWidth - 320) / 2);
  var geocoder = new google.maps.Geocoder();
  var latlng = new google.maps.LatLng(latitude, longitude);
  var address;				
  var myOptions = {
  	center: latlng,
  	zoom: 18,
  	mapTypeId: google.maps.MapTypeId.ROADMAP,
  	streetViewControl: false,
  	mapTypeControl: false
  };
  var infowindow = new google.maps.InfoWindow();
  var markerArray = [];

	map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);

  var image = new google.maps.MarkerImage('images/marker.png',
    new google.maps.Size(20,32),
    new google.maps.Point(0,0)
  );

  var shadow = new google.maps.MarkerImage('images/shadow.png',
    new google.maps.Size(64, 52),
    new google.maps.Point(0,0),
    new google.maps.Point(10,32)
  );

	marker = new google.maps.Marker({
    position: new google.maps.LatLng(latitude,longitude), 
    clickable: true,
    icon: image,
    shadow: shadow,
    map: map 
  });  
  
  google.maps.event.addListener(map, 'dragend', function() { 
    marker.setPosition(map.getCenter()); 
  });
};

function hideURLbar(f) {
	if(window.innerHeight < (window.outerHeight+20)) { $('html').css({'min-height':(window.outerHeight+20)+'px'}); }
	setTimeout(function() { if(window.pageYOffset<1||f) { window.scrollTo(0, 1); hideURLbar(); } }, 0);
}

$(function() {

  config = {
  	dbPrefix: '',
    db: "api", // relative vhost links defined in rewrites.json
    design: "ddoc",
    vhost: true,
    baseURL: "/",
    host: window.location.href.split( "/" )[ 2 ],  
    couchUrl: "/"
  };

  // vhosts are when you mask couchapps behind a pretty URL
  function inVhost() {
    var vhost = false;
    if ( document.location.pathname.indexOf( "_design" ) === -1 ) {
      vhost = true;
    }
    return vhost;
  }
  
  if ( !inVhost() ) {
    var cfg = config;
    cfg.vhost = false
    cfg.db = document.location.href.split( '/' )[ 3 ];
    cfg.design = unescape( document.location.href ).split( '/' )[ 5 ];
    cfg.couchUrl = "/" + cfg.db + "/_design/" + cfg.design + "/_rewrite/";
  }

  $('.mapit').bind('touchend', uploadLocation);
  
  app.handler = function(route) {
    route = route.path.slice(1, route.path.length);
    if (route === "") {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(locWin, locFail);
      } else {
        locFail();
      }
    } else {
      $.getJSON(config.couchUrl + "api/" + route, function(doc) {
        currentDoc = doc;
        showMap(doc.geometry.coordinates[1], doc.geometry.coordinates[0]);
      })      
    }
    hideURLbar()
  };
  
  $('.closeDialog').click(function(e) {
    $('.detailsDialog').hide();
    e.preventDefault();
    return false;
  })
  
  $('.saveButton').click(function(e) {
    $('.detailsDialog').show();
    uploadLocation();
    e.preventDefault();
  })

  app.s = $.sammy(function () {
    this.get("#/:route", app.handler);
    this.get("#:route", app.handler);
    this.get("", app.handler);
  });

  app.s.run();
});