var util = function() {

  $.fn.serializeObject = function() {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
      if (o[this.name]) {
        if (!o[this.name].push) {
          o[this.name] = [o[this.name]];
        }
        o[this.name].push(this.value || '');
      } else {
        o[this.name] = this.value || '';
      }
    });
    return o;
  };

  function inURL(url, str) {
    var exists = false;
    if ( url.indexOf( str ) > -1 ) {
      exists = true;
    }
    return exists;
  }
  
  // simple debounce adapted from underscore.js
  function delay(func, wait) {
    return function() {
      var context = this, args = arguments;
      var throttler = function() {
        delete app.timeout;
        func.apply(context, args);
      };
      if (!app.timeout) app.timeout = setTimeout(throttler, wait);      
    };
  };

  // requires jquery.mustache.js
  function render( template, target, options ) {
    if ( ! options ) options = {data: {}};
    var html = $.mustache( $( "#" + template + "Template" ).html(), options.data ),
        targetDom = $( "#" + target );
    if( options.append ) {
      targetDom.append( html );
    } else {
      targetDom.html( html );
    }
    if (template in app.after) app.after[template]();
  }

  function formatMetadata(data) {
    out = '<dl>';
    $.each(data, function(key, val) {
      if (typeof(val) == 'string' && key[0] != '_') {
        out = out + '<dt>' + key + '<dd>' + val;
      } else if (typeof(val) == 'object' && key != "geometry" && val != null) {
        if (key == 'properties') {
          $.each(val, function(attr, value){
            out = out + '<dt>' + attr + '<dd>' + value;
          })
        } else {
          out = out + '<dt>' + key + '<dd>' + val.join(', ');
        }
      }
    });
    out = out + '</dl>';
    return out;
  }

  function getBaseURL(url) {
    var baseURL = "";
    if ( inURL(url, '_design') ) {
      if (inURL(url, '_rewrite')) {
        var path = url.split("#")[0];
        if (path[path.length - 1] === "/") {
          baseURL = "";
        } else {
          baseURL = '_rewrite/';
        }
      } else {
        baseURL = '_rewrite/';
      }
    }
    return baseURL;
  }
  
  function bindUpload(form) {
    currentFileName = {};
    uploadSequence = [];

    $.getJSON( '/_uuids', function( data ) { 
      app.docURL = app.config.baseURL + "api/" + data.uuids[ 0 ] + "/";
    });

    $( '.file_list' ).html( "" );

    var uploadSequence = [];
    uploadSequence.start = function (index, fileName) {
      var next = this[index];
      currentFileName = fileName;
      var url = app.docURL + fileName;
      if (app.currentDoc && app.currentDoc.rev) url = url + "?rev=" + app.currentDoc.rev;
      next(url);
      this[index] = null;
    };

    form.fileUploadUI({
      multipart: false,
      uploadTable: $( '.file_list' ),
      downloadTable: $( '.file_list' ),
      buildUploadRow: function ( files, index ) {
        return $( $.mustache( $( '#uploaderTemplate' ).text(), { name: files[ index ].name } ));
      },
      buildDownloadRow: function ( file ) {
        return $( '<tr class="complete"><td class="complete">' + currentFileName + '<\/td><td></td>\/tr>' );
      },
      beforeSend: function (event, files, index, xhr, handler, callBack) {
        uploadSequence.push(function (url) {
          handler.url = url;
          callBack();
        });
        if (index === 0) {
          uploadSequence.splice(0, uploadSequence.length - 1);
        }
        if (index + 1 === files.length) {
          uploadSequence.start(0, files[ index ].fileName);
        }
      },
      onComplete: function (event, files, index, xhr, handler) {
        var nextUpload = uploadSequence[ index + 1 ];
        if ( nextUpload ) {
          uploadSequence.start( index + 1, files[ index ].fileName);
        } else {
          var reqOpts = {
            uri: app.config.baseURL + "api/" + handler.response.id,
            headers: {"Content-type": "application/json"}
          }
          $.request(reqOpts, function(err, resp, body) {
            app.currentDoc = JSON.parse(body);
          })
        }
      },
      onAbort: function (event, files, index, xhr, handler) {
        handler.removeNode(handler.uploadRow);
        uploadSequence[index] = null;
        uploadSequence.start(index + 1, handler.url);
      }
    });
  }
  
  return {
    inURL: inURL,
    delay: delay,
    render: render,
    formatMetadata:formatMetadata,
    getBaseURL:getBaseURL,
    bindUpload: bindUpload
  };
}();