var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
	console.log('index.js get /');	
  res.render('index', { title: 'SAP.io Accelerate' });
});

/* GET Hello World page. */
/* router.get('/helloworld', function(req, res) {
    res.render('helloworld', { title: 'Hello, World!' });
}); */

/* GET Domainlist page. */
/* 
 router.get('/domainlist', function(req, res) {
	console.log('index.js get domainlist');
	console.log(req.body);
    var db = req.db;
    var collection = db.get('onboard');
    collection.find({},{},function(e,docs){
        res.render('domainlist', {
            "domainlist" : docs
        });
    }); 
	
    res.render('helloworld', { title: 'Hello, ' + req.body.domainName });	
}); 
*/

router.post('/upload', function(req, res, next) {

	var Upload = require('s3-uploader');
	    console.log('req'+req);
	
	var client = new Upload('launchgear.io', {
  //awsBucketRegion: 'us-east-1',
  awsBucketPath: 'pics/',
  awsBucketAcl: 'public-read',

  versions: [{
    original: true
  }]
	});
	//console.log(client);
	//console.log(req);
	//console.log(req.body.thumbnail);
	    console.log('req 2'+req);
 client.upload('/uploads/architect.jpg', {}, function(err, images, meta) {
  if (err) {
    console.error(err);
  } else {
    for (var i = 0; i < images.length; i++) {
      console.log('Thumbnail with width %i, height %i, at %s', images[i].width, images[i].height, images[i].url);
    }
  }
}); 
	
    console.log(req.body);
    console.log(req.files);
});

/* GET New Domain page. */
/* router.get('/newdomain', function(req, res) {
    res.render('newdomain', { title: 'Generate New Landing Page' });
});
 */
/* POST to Add Domain Service */
/* router.post('/adddomain', function(req, res) {

    // Set our internal DB variable
    var db = req.db;

    // Get our form values. These rely on the "name" attributes
    var teamName = req.body.teamName;
    var domainName = req.body.domainName;
    var gmailGA = req.body.gmailGA;

    // Set our collection
    var collection = db.get('onboard');

    // Submit to the DB
    collection.insert({
		"generated" : 'N',
        "teamName" : teamName,		
        "domainName" : domainName,
        "gmailGA" : gmailGA
    }, function (err, doc) {
        if (err) {
            // If it failed, return error
            res.send("There was a problem adding the information to the database.");
        }
        else {
			
			
			
			
			
            // And forward to success page
            res.redirect("domainlist");
        }
    });
}); */

module.exports = router;
