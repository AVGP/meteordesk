var Messages = new Meteor.Collection("messages");

if (Meteor.isClient) {
  Accounts.ui.config({
    requestPermissions: { google: ["https://www.googleapis.com/auth/userinfo.email"] }
  });

  Template.hello.greeting = function() {
  	if(Meteor.userLoaded()) {
  		return "Welcome to meteordesk, " + Meteor.user().profile.name + ".";
  	}
  };
  
  Template.messageList.messages = function() {
  	return Messages.find();
  };
  
  Template.messageList.rendered = function() {
	$(".collapsible").accordion({collapsible: true, active: false});
  };
}

if (Meteor.isServer) {
  var require = __meteor_bootstrap__.require;
  var imap = require('imap');
  
  Meteor.startup(function fetchMails() {
    // code to run on server at startup

	  mailConnection = new imap.ImapConnection({
        	username: '',
        	password: '',
       	 	host: 'imap.gmail.com',
        	port: 993,
    	    secure: true
	      });
    
    mailConnection.connect(function(err) {
    	if(err) {
    		console.log("DOOOOMED");
    		console.log(err);
    	}
    	else {
    		mailConnection.openBox('INBOX', false, function(err, mailbox) {
    			if(err) {
    				console.log("NOOOOO");
    				return;
    			}
    			
	    		mailConnection.on('mail', function() {
    				console.log("NEW MAIL");
    			});	
    			
    			mailConnection.search(['UNSEEN'], function(err, results) {
    				if(err) {
    					console.log("OH GOD WHY??");
    					return
    				}
    				try {
	    				var fetch = mailConnection.fetch(results, {
    						request: {
    							headers: ['from', 'to', 'subject'],
    							body: true
    						},
    						markSeen: true
    					});
    					fetch.on('message', function(msg) {
    						var body = "";
    						msg.on("data", function(chunk) {
    							body += chunk.toString("utf8");
    						});
    						msg.on('end', function() {
    							Fiber(function() {
									Messages.insert({
            							"author": msg.headers.from[0],
            							"subject": msg.headers.subject[0],
            							"body": body
        							});
        						}).run();
        					});
    					});
    				
    					fetch.on('end', function() {
    						console.log("DONE");
    						mailConnection.logout();
    					});
    				} catch(e) {
    					//Catching exceptions is for communists.
    				}
    			});
    		});
    	}
    		
    });
    
    setTimeout(fetchMails, 10000);
  });
}
