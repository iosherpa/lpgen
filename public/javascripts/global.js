// Team List array for filling in info box
var domainListData = [];

// DOM Ready =============================================================
$(document).ready(function() {

    // Populate the team table on initial page load
    populateTable('');

    // Domain name link click
    //$('#domainlist table tbody').on('click', 'td a.linkshowdomain', showDomainInfo);

	// Add Team button click
    $('#btnAddDomain').on('click', addDomain);

});
	
});

// Functions =============================================================

// Fill table with data
function populateTable(newDomain) {

    // Empty content string
    var tableContent = '';
	
    $.getJSON( '/domains/domainlist', function( data ) {
		
		domainListData = data;	
		// add the team's new entry to the table
		if (newDomain !== '') {
			data.push(newDomain);
		};

        // For each item in our JSON, add a table row and cells to the content string
        $.each(data, function(){
            tableContent += '<tr>';
            tableContent += '<td>' + this.teamName + '</td>';
            tableContent += '<td><a href="http://launchgear.io/' + this.domainName + '">' + this.domainName + '</a></td>';
            tableContent += '</tr>';
        });

        // Inject the whole content string into our existing HTML table
        $('#domainlist table tbody').html(tableContent);
    });	
};

// Show Domain Info
function showDomainInfo(event) {

    // Prevent Link from Firing
    event.preventDefault();

    // Retrieve domain name from link rel attribute
    var thisDomainName = $(this).attr('rel');

    // Get Index of object based on id value
    var arrayPosition = domainListData.map(function(arrayItem) { return arrayItem.domainName; }).indexOf(thisDomainName);


    // Get our Domain Object
    var thisDomainObject = domainListData[arrayPosition];

    //Populate Info Box
    $('#domainInfoName').text(thisDomainObject.teamName);
    $('#domainInfoDomain').text(thisDomainObject.domainName);
    $('#domainInfoGmail').text(thisDomainObject.gmailGA);

};


// Add Team and Domain
function addDomain(event) {

    event.preventDefault();
	
	var alertMsg = '';

    var errorCount = 0;
	
	console.log('domainlistdata '+JSON.stringify(domainListData));
    $('#addDomain input').each(function(index, val) {

		// first check for blanks	
        if($(this).val() === '') {
			if (($(this).attr('name') === 'domain') || ($(this).attr('name') === 'gmail') || ($(this).attr('name') === 'team') ) {
			  if (errorCount === 0) {
				// only add this message once - these are the first 3 fields, so count only includes this message
			    alertMsg += 'Please populate Team, Domain, and Google Analytics Account email fields\n';
			    errorCount++; 
			  }
			}	
		} else {
		//fields are populated, validate values	
		// validate email	
		if ($(this).attr('name') === 'gmail') {
			if ((/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test($(this).val())) === false) {
				console.log('invalid email');
				alertMsg += 'Enter a vaild email address\n';
				errorCount++; 					
			} 		
		};
		// validate subdomain - alphanumeric and hyphen and spaces, min 2 chars, max 20
		if ($(this).attr('name') === 'domain') {
			if ((/^[a-zA-Z0-9-_]{2,20}$/.test($(this).val())) === false) {
			//if ((/^[a-zA-Z0-9-_]+$/.test($(this).val())) === false) {
				console.log('invalid domain');
				alertMsg += 'Enter a vaild subdomain name (alphanumeric only, 2-20 chars)\n';				
				errorCount++; 					
			};	
			// verify that another subdomain with this name does not already exist
			// we lose the "this" context in the loop, save to variable
			var dbDomain = $(this).val();
			for(var i = 0; i < domainListData.length; i++) {
				var dom = domainListData[i];
				if (dom.domainName.toLowerCase() === dbDomain.toLowerCase()) {
					console.log('duplicate domain');
					alertMsg += 'This subdomain name is already in use, choose a different one\n';				
					errorCount++; 
				}
			};
		};
		
		// prohibit script in texts	
 		if ((/<(.|\n)*?>/.test($(this).val())) === true)
			{
				console.log('invalid text');
				alertMsg += 'Script is not permitted: '+$(this).attr('name');
				errorCount++; 					
		}  
		
		
		}
		
    });

    // Check and make sure errorCount is still at zero
     if(errorCount === 0) {
 
        // If it is, compile all domain info into one object
        var newDomain = {
            'teamName': $('#addDomain fieldset input#inputTeamName').val(),			
            'domainName': $('#addDomain fieldset input#inputDomainName').val(),
            'gmailGA': $('#addDomain fieldset input#inputGmailGA').val(),
            'aboutText': $('#addDomain fieldset input#inputAboutText').val(),
            'projText': $('#addDomain fieldset input#inputProjText').val(),
            'mcHeadingText': $('#addDomain fieldset input#inputMCText').val()			
        }
       
	    var returnValue ='';
        // Post the object to our adddomain service
		$.ajax({
            type: 'POST',
            data: newDomain,
            url: '/domains/adddomain',
            dataType: 'JSON',
		    async: false,
			success: function (resp) {	
				returnValue = resp;
			},
			error: function (err) {
				returnValue = err;
			}
		});
		console.log('returnValue '+JSON.stringify(returnValue));
		if (returnValue.msg) {
			console.log(returnValue.msg);
			alert('The team was not successfully added, contact an iO team member for help');
		} else {
			populateTable(newDomain);		
		};
	
    } else {
        // If errorCount is more than 0, error out
        alert(alertMsg);
        return false;
    }

};
