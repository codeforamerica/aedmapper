var mapHelper = function() {
  
  function createMap(config) {
    
    config = $.extend({
      containerId: 'mapContainer',
      mapCenterLat: 45.5234515,
    	mapCenterLon: -122.6762071,
    	mapStartZoom: 2,
    	zoomControl: true
    }, config)
    
    var container = $('#' + config.containerId);
    
    var cloudmadeUrl = 'http://{s}.tile.cloudmade.com/d3394c6c242a4f26bb7dd4f7e132e5ff/37608/256/{z}/{x}/{y}.png',
  	    cloudmadeAttribution = 'Map data &copy; 2011 OpenStreetMap contributors',
  	    cloudmade = new L.TileLayer(cloudmadeUrl, {maxZoom: 18, attribution: cloudmadeAttribution});
  	    
    var MarkerDot = L.Icon.extend({
      iconUrl: 'images/marker-dot.png',
      shadowUrl: 'images/marker-shadow.png',
      iconSize: new L.Point(11,11),
      shadowSize: new L.Point(0.0),
      iconAnchor: new L.Point(5,5),
      popupAnchor: new L.Point(-3, -76)
    });
        
    var map = new L.Map(config.containerId, {zoomControl: config.zoomControl});
    
    map.setView(new L.LatLng(config.mapCenterLat, config.mapCenterLon), config.mapStartZoom).addLayer(cloudmade);

    return {
      instance: map,
      container: container,
      config: config,
      markerDot: new MarkerDot(),
      uri: "/" + encodeURIComponent(name) + "/",
      
      showLoader: function() {
        $('.map_header', this.container).first().addClass('loading');
      },

      hideLoader: function() {
        $('.map_header', this.container).first().removeClass('loading');
      },

      showPoint: function(feature) {
        var point = feature.geometry,
            markerLocation = new L.LatLng(parseFloat(point.coordinates[1]), parseFloat(point.coordinates[0])),
            marker = new L.Marker(markerLocation, {icon: this.markerDot});
        if (feature.properties) marker.properties = feature.properties;
        this.instance.addLayer(marker);
      },

      getBB: function(){
        var b = this.instance.getBounds();
        return b._southWest.lng + "," + b._southWest.lat + "," + b._northEast.lng + "," + b._northEast.lat;
      }
    }
  }

  return {
    createMap:createMap
  };
}();