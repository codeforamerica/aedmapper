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
    mapHelper.createMap(app.config);
    $('.saveButton').click(function(e) {
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