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
    
    util.persist.restore();

    if (Modernizr.localstorage) {
      $('.persist').keyup(function(e) {
        var inputId = $(e.target).attr('id');
        util.persist.save(inputId);
      })
    }

    $('#address').keyup(function() {
      $('#address').addClass('loading');
      util.delay(function() {
        app.map.geocoder.geocode({'address':$('#address').val()}, app.map.listAddresses);
      }, 2000)();
    });
    
    util.bindUpload($('#file_upload'));
    
    $('#aed-form').submit(function(e) {
      
      util.persist.clear();
        
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
        uri: app.config.baseURL + "api",
        method: "POST",
        headers: {"Content-type": "application/json"}
      }
      
      if (app.currentDoc) {
        $.extend(reqOpts, {
          uri: app.config.baseURL + "api/" + app.currentDoc._id,
          method: "PUT"
        })
        $.extend(data, {"_rev": app.currentDoc._rev, "_attachments": app.currentDoc._attachments});
      }
      
      reqOpts.body = JSON.stringify(data);
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