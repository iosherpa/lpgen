var express = require('express');
var router = express.Router();

var domainListData = [];

/* GET home page. */
router.get('/', function(req, res, next) {
	console.log('index.js get /');	
	res.sendFile('index.html');
});

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


module.exports = router;
