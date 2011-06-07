var couchapp = require('couchapp')
  , path = require('path')
  ;

ddoc =
  { _id:'_design/aedmapper'
  , rewrites :
    [ {from:"/", to:'index.html'}
    , {from:"/api", to:'../../'}
    , {from:"/api/submissions", to:"_view/submissions", query: {"descending": true}}
    , {from:"/api/*", to:'../../*'}
    , {from:"/*", to:'*'}
    ]
  }
  ;
 
ddoc.views = {
  submissions: {
    map: function(doc) {
      if (doc.address && doc.created_at) {
        emit(doc.created_at, doc);
      }
    }
  }
};

ddoc.validate_doc_update = function (newDoc, oldDoc, userCtx) {
  if (newDoc._deleted === true && userCtx.roles.indexOf('_admin') === -1) {
    throw "Only admin can delete documents on this database.";
  }
};

couchapp.loadAttachments(ddoc, path.join(__dirname, 'attachments'));

module.exports = ddoc;