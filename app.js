var couchapp = require('couchapp')
  , path = require('path')
  ;

ddoc =
  { _id:'_design/aedmapper'
  , rewrites :
    [ {from:"/", to:'index.html'}
    , {from:"/api/leaderboard", to:'/_view/by_email', query: {group: true}}
    , {from:"/api", to:'../../'}
    , {from:"/api/*", to:'../../*'}
    , {from:"/*", to:'*'}
    ]
  }
  ;
  
ddoc.views = {
  by_email: {
    map: function(doc) {
      if (doc.from.length > 0) {
        for (var user in doc.from) {
          emit(doc.from[user], 1);
        }
      }
    },
    reduce: "_sum"
  }
}

couchapp.loadAttachments(ddoc, path.join(__dirname, 'attachments'));

module.exports = ddoc;