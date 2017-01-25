var express = require('express');
var router = express.Router();

var gaNew = '';
var mcNew = '';

/*
 * GET domainlist.
 */
router.get('/domainlist', function(req, res) {
	console.log('domains.js get domainlist');	
    var db = req.db;
    var collection = db.get('onboard');
    collection.find({},{},function(e,docs){
        res.json(docs);
    });
});
/*
 * POST to adddomain.
 */
router.post('/adddomain', function(req, res) {

	console.log('in post');	
	
	//add GA user and property
	goGA(req, res);
	console.log('after GA');

	//add mailchimp list
	goMC(req, res);
	console.log('after mc');
	
	//insert team record into db
 	
    var db = req.db;
    var collection = db.get('onboard');

    collection.insert(req.body, function(err, result){
	  res.send(
       (err === null) ? { msg: '' } : { msg: err }
	  );
    });	 
	
	//copy source directory either way, and if we have snippets, update them
	copyFiles(req, res);
	console.log('after copy files');		
	
});



function copyFiles(req, res) {	
	console.log('in copy');

	var AWS = require('aws-sdk');
	var async = require('async');	

	console.log('after aws variables');

	//s3 variables
	var bucketName = 'launchgear.io';
	var oldPrefix = 'newsubdir/';
	var newPrefix = '';
	var picPrefix = 'pics/';
	var dbid = '';
	//file that will be updated with the snippets
	var srcFile = 'index.html';
	var format = 'utf-8';
	//snippet texts
	var gaOld = 'UA-89297218-2';
	//var gaNew = 'Replacement GA snippet';
	var mcOld = '5cf2245038';
	//var mcNew = 'Replacement Mailchimp snippet';
	var aboutOld = 'Our startup';
	var aboutNew = req.body.aboutText;
	var projOld = 'Coming Soon';
	var projNew = req.body.projText;
	var titleOld = 'Startup Landing Page';
	var titleNew = req.body.teamName;
	var navOld = '<b>LaunchGear</b>.io</a>';
	var navNew = '<b>'+titleNew+'</b></a>';
	var mcHeaderOld = 'Sign up for launch updates';
	var mcHeaderNew = req.body.mcHeadingText;	
	var picTextOld = '<b>LaunchGear</b></span> <span class="w3-hide-small w3-text-light-grey">io</span></h1>'
	var picTextNew = '<b>'+titleNew+'</b></span> <span class="w3-hide-small w3-text-light-grey"></span></h1>'

	//set new subdomain name
	newPrefix = req.body.domainName+'/';
	
	// Create an S3 client
	var s3 = new AWS.S3({params: {Bucket: bucketName}});

	console.log('after s3 ', s3);
	// Copy a folder from launcgear.io into a new folder under launchgear.io

	 var done = function(err, data) {
	  if (err) console.log(err);
	  //else 
	  //console.log('data ' + data);
	  //getModObject();
		
	};

	s3.listObjects({Prefix: oldPrefix}, function(err, data){
	  if (data.Contents.length) {
	  //console.log('data contents '+ data.Contents);

		async.each(data.Contents, function(file, cb) {	
		 var params = {
			CopySource: bucketName + '/' + file.Key,
			Key: file.Key.replace(oldPrefix, newPrefix)

		 };
		  
		// if this is the main index.html file update it and then write
		  if (params.Key === newPrefix+srcFile) {
			getModObject();
		  } else { 
		    s3.copyObject(params, function(copyErr, copyData){
		     if (copyErr) {
			  console.log('copyErr '+copyErr+ 'copyData ' + copyData);
		     } else {
			  console.log('Copied: ', params.Key);
		      cb();
		     }
		    }); 
		  }

		}, done);
	  }
	});

//replace the snippets in the main dest file
function getModObject() {
	 var getParams = {
	  Bucket: bucketName,
	  Key: oldPrefix+srcFile
	 };

	 s3.getObject(getParams, function(err, data) { 
	 if (err) 
	    console.log(err, err.stack);
	 else
	    //we have the object and can replace snippets
	    console.log('updating file');

	    var newBody = data.Body.toString(format);
		
		//replace GA snippet
		if (gaNew !== '') {
	       newBody = newBody.replace(gaOld, gaNew);
		};

		//replace mailchimp snippet	
		if (mcNew !== '') {		
		   newBody = newBody.replace(mcOld, mcNew);
		};
		
		//replace about text
		if (aboutNew !== '') {		
		   newBody = newBody.replace(aboutOld, aboutNew);
		};
		
		//replace project text
		if (projNew !== '') {		
		   newBody = newBody.replace(projOld, projNew);
		};
		
		//replace mc header text
		if (mcHeaderNew !== '') {		
		   newBody = newBody.replace(mcHeaderOld, mcHeaderNew);
		};		
		
		//replace some launchgear references
		newBody = newBody.replace(titleOld, titleNew);
		newBody = newBody.replace(navOld, navNew);
		newBody = newBody.replace(picTextOld, picTextNew);		
		
	  
	    var newParams = {
		  Bucket: bucketName,
		  Key: newPrefix+srcFile,
		  Body: newBody
	    };

	    s3.upload(newParams, function(err, data) {
		  if (err) {
		    console.log(err, err.stack);
		  } else {
		    console.log(newPrefix+'index.html updated and uploaded');
		  }
	    });

	 });

	}  
}	

function goMC(req, res) {
	
	var Mailchimp = require('mailchimp-api-v3');
 	//console.log('goMC');
	var mcconfig = require('./mcconfig');
	var api_key = mcconfig.key;
	var mailchimp = new Mailchimp(api_key);
	//var mcListUrl = 'https://us15.api.mailchimp.com/3.0/lists';
	var mcListUrl = 'lists';	

	var listName = req.body.domainName;
	var teamName = req.body.teamName;
	var fromEmail = req.body.gmailGA;	
	
	var mcParams = {
	   name:listName,
	   contact:{
		  company:listName+" (LaunchGear.io)",
		  address1:"Brannan St.",
		  city:"San Francisco",
		  state:"CA",
		  zip:"US",
		  country:"94107"
	   },
	   permission_reminder:"You are receiving this email because you opted in at launchgear.io/"+listName,
	   campaign_defaults:{
		  from_name:teamName+" Team",
		  from_email:fromEmail,
		  subject:teamName+" Update",
		  language:"en"
	   },
	   email_type_option:false
	};


	mailchimp.post({
	path: mcListUrl,
	body: mcParams		
	}, function (err, result) {
		mcNew = result.id;
		console.log(err, result);
	});
	
	console.log('after mc post');
	
}

function goGA(req, res) {

	//ga requirements
	var fs = require('fs-extra');
	var Promise = require('promise');
	var google = require('googleapis');
	var analytics = google.analytics('v3');
	var serviceAccountInfoPath = './gaconfig.json';
	var gaID = '89297218';
	var webPropId = '';
	var gmailUser = req.body.gmailGA;
	var domainName = req.body.domainName;	
	var websiteUrl = 'http://launchgear.io/'+domainName;
	
	// create GA property
	var createGAProperty = function() {
		loadServiceAccountInfo()
		.then(function(serviceAccountInfo) {
			return getPropJwtClient(serviceAccountInfo);
		})
		.then(function(jwtClient) {
			var client = jwtClient;
			var analytics = google.analytics('v3');
			return addProperty(client, analytics, gaID);
			
		})
		.then(function(result) {
			console.log('returning result');
		})
		.catch(function(error) {
			console.log("go promise chain failed", error);
		});
	};

	// load the Google service account login details
	var loadServiceAccountInfo = function() {
		return new Promise(function(resolve, reject) {
			fs.readFile(serviceAccountInfoPath, 'utf8', function(error, serviceAccountInfoData) {
				if(error) {
					console.log('loadServiceAccountInfo failed: ' + error);
					reject(error);
				} else {
					var serviceAccountInfo = JSON.parse(serviceAccountInfoData);
					resolve(serviceAccountInfo);
console.log('ga 3');					
				}
			});
		});
	};

	//return a an authenticated Google API client
	var getPropJwtClient = function(serviceAccountInfo) {
		return new Promise(function(resolve, reject) {

			//scope for permission to create a new property
			var jwtClient = new google.auth.JWT(serviceAccountInfo.client_email, null, serviceAccountInfo.private_key, ['https://www.googleapis.com/auth/analytics.edit'], null);
		
			jwtClient.authorize(function (error, tokens) {
				if (error) {
					console.log('getPropJwtClient failed: ' + error);			
					reject(error);
				} else {
					resolve(jwtClient);		
				}		
			});
		});
	};

	//add a property to our account
	var addProperty = function(client, analytics, gaID) {
		return new Promise(function(resolve, reject) {

		//insert property
		analytics.management.webproperties.insert({
			'auth': client,
			'accountId': gaID,
			'resource': {
				'websiteUrl': websiteUrl,
				'name': domainName
			}
			}, function(error, response) {
			console.log(error);
			console.log(response);	
			console.log('response id' + response.id);			
			gaNew = webPropId = response.id;		
		});

				
		//if we added a property, add a user for the property
		//addGAUser();
		
		//copy source directory either way, and if we have snippets, update them
		//copyFiles(req, res);
		//console.log('after copy files');		
		
		
		});
	};	
	
	

	// add GA user for the new property
	var addGAUser = function() {
		loadServiceAccountInfo()
		.then(function(serviceAccountInfo) {
			return getUserJwtClient(serviceAccountInfo);
		})
		.then(function(jwtClient) {
			var client = jwtClient;
			var analytics = google.analytics('v3');
			return addUser(client, analytics, gaID, webPropId);
		})
		.then(function(result) {
			console.log('returning result');
		})
		.catch(function(error) {
			console.log("go promise chain failed", error);
		});
	};

	// load the Google service account login details
	var loadServiceAccountInfo = function() {
		return new Promise(function(resolve, reject) {
			fs.readFile(serviceAccountInfoPath, 'utf8', function(error, serviceAccountInfoData) {
				if(error) {
					console.log('loadServiceAccountInfo failed: ' + error);
					reject(error);
				} else {
					var serviceAccountInfo = JSON.parse(serviceAccountInfoData);
					resolve(serviceAccountInfo);
console.log('service account for addGAUser');						
				}
			});
		});
	};

	//return a an authenticated Google API client
	var getUserJwtClient = function(serviceAccountInfo) {
		return new Promise(function(resolve, reject) {
			
			//read only scope
			//var jwtClient = new google.auth.JWT(serviceAccountInfo.client_email, null, serviceAccountInfo.private_key, ['https://www.googleapis.com/auth/analytics.readonly'], null);

			//scope for permission to create a new property
			//var jwtClient = new google.auth.JWT(serviceAccountInfo.client_email, null, serviceAccountInfo.private_key, ['https://www.googleapis.com/auth/analytics.edit'], null);

			//scope for permission to add a new user
			var jwtClient = new google.auth.JWT(serviceAccountInfo.client_email, null, serviceAccountInfo.private_key, ['https://www.googleapis.com/auth/analytics.manage.users'], null);
			
			
			jwtClient.authorize(function (error, tokens) {
				if (error) {
					console.log('getJwtClient failed: ' + error);
					reject(error);
				} else {
					resolve(jwtClient);
				}
			});
		});
	};

	//this is a test query to get data for our account id
	var addUser = function(client, analytics, gaID, webPropId) {
		return new Promise(function(resolve, reject) {
		/*	
		//get properties
		//use this scope above	
		//var jwtClient = new google.auth.JWT(serviceAccountInfo.client_email, null, serviceAccountInfo.private_key, ['https://www.googleapis.com/auth/analytics.readonly'], null);
		
			analytics.management.webproperties.list({'auth': client, 'accountId': gaID}, function(error, response) {
			console.log(error);
			console.log(response);	
		*/
		//insert property - permission to use new api requested, currently errors out
		//use this scope above
		//var jwtClient = new google.auth.JWT(serviceAccountInfo.client_email, null, serviceAccountInfo.private_key, ['https://www.googleapis.com/auth/analytics.edit'], null);

		/*
		analytics.management.webproperties.insert({
			'auth': client,
			'accountId': gaID,
			'resource': {
				'websiteUrl': 'http://launchgear.io/testdomain',
				'name': 'KS API Test'
			}
			}, function(error, response) {
			console.log(error);
			console.log(response);			
		});
		*/
		/*
		//list users
		//use this scope above
		//var jwtClient = new google.auth.JWT(serviceAccountInfo.client_email, null, serviceAccountInfo.private_key, ['https://www.googleapis.com/auth/analytics.manage.users.readonly'], null);
		
			analytics.management.accountUserLinks.list({
			'auth': client,
			'accountId': gaID
			}, 
			function(error, response) {
				
			console.log(error);
			console.log(response);	
			
			var accountLinks = response.items;
			for (var i = 0, accountUserLink; accountUserLink = accountLinks[i]; i++) {
			  var entity = accountUserLink.entity;
			  var accountRef = entity.accountRef;
			  var userRef = accountUserLink.userRef;
			  var permissions = accountUserLink.permissions;

			  console.log('Account User Link Id: ' + accountUserLink.id);
			  console.log('Account User Link Kind: ' + accountUserLink.kind);
			  console.log('User Email: ' + userRef.email);
			  console.log('Permissions effective: ' + permissions.effective);
			  console.log('Permissions local: ' + permissions.local);
			  console.log('Account Id: ' + accountRef.id);
			  console.log('Account Kind: ' + accountRef.kind);
			  console.log('Account Name: ' + accountRef.name);
			}

			
			});	
		*/
		//add user to the account with access to a specific property only
		//use this scope above
		//var jwtClient = new google.auth.JWT(serviceAccountInfo.client_email, null, serviceAccountInfo.private_key, ['https://www.googleapis.com/auth/analytics.manage.users'], null);

			//use this to add a user to the analytics account
			//analytics.management.accountUserLinks.insert({	

			//use this to add a user to a specific property		
			analytics.management.webpropertyUserLinks.insert({
			'auth': client,
			'accountId': gaID,

			//include this to make it property specific
			'webPropertyId': webPropId,

			'resource': {
			  'permissions': {
				'local': [
				  'EDIT',
				  'MANAGE_USERS'
				]
			  }, 
			  'userRef': {
				'email': gmailUser
			  }
			 }
			},
			
			function(error, response) {
			console.log(error);
			console.log(response);	
		
			});			
			
		});
	};
	
//get and set GA info
createGAProperty();
addGAUser();

}
	
module.exports = router;
