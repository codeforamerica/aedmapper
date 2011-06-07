var app = {
  config: {
  	mapCenterLat: 45.5234515,
  	mapCenterLon: -122.6762071,
  	mapStartZoom: 2,
  	zoomControl: true,
  	baseURL: util.getBaseURL(document.location.pathname)
  }
};

app.handler = function(route) {
  route = route.path.slice(1, route.path.length);
  if (route.length < 1) route = "home";
  util.render( route, 'main' );
  window.scrollTo(0, 0);
};

app.after = {
  home: function() {
    app.map = mapHelper.createMap(app.config);

    $('#address').keyup(function() {
      util.delay(function() {
        app.map.geocoder.geocode({'address':$('#address').val()}, app.map.listAddresses);
      }, 2000)();
    });
    
    $('#aed-form').submit(function(e) {
      if (!app.map.lastCoordinates) {
        alert('Please enter an address first');
        return;
      }
      var data = $('#aed-form').serializeObject();
      _.map(_.keys(data), function(key) {
        if (data[key] === "") delete data[key];
      })
      $.extend(data, {"created_at": new Date()});
      if (app.map.lastCoordinates) $.extend(data, {"geometry": {"type": "Point", "coordinates": app.map.lastCoordinates}});
      var reqOpts = {
        uri: app.config.baseURL + "/api",
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify(data)
      }
      $.request(reqOpts, function(err, resp, body) {
        window.location = "";
        window.scrollTo(0, 0);
        alert('Thanks! Your AED was successfully added');
      })
      e.preventDefault();
    })
  }
}

$(function() {

  app.s = $.sammy(function () {
    this.get("#/:route", app.handler);
    this.get("#:route", app.handler);
    this.get("", app.handler);
  });

  app.s.run();
});

// function uploadLocation() {
//   var req = {
//     url: config.couchUrl + "api",
//     type: "POST",
//     contentType: "application/json",
//     data: {}
//   }
//   if (currentDoc) {
//     $.extend(req, {
//       url: config.couchUrl + "api/" + currentDoc._id,
//       type: "PUT",
//       data: JSON.stringify($.extend(currentDoc, centerGeoJson()))
//     })
//   }
//   $.ajax(req);
// }