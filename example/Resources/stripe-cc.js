Ti.include('libs/TiStripe.orig.js');

var win = Titanium.UI.currentWindow;

var closeButton = Titanium.UI.createButton({systemButton:Titanium.UI.iPhone.SystemButton.DONE});
	win.rightNavButton = closeButton;
	
	closeButton.addEventListener('click', function() {
		win.navWin.close();
	});


//TiStripe.setPublishableKey('myPublishableKey');
TiStripe.setPublishableKey('pk_test_InyRv031yM7R6ANUpexRHTED');

Ti.API.info( 'key => '+TiStripe.getPublishableKey() );

//credit cards
Ti.API.info( ' == Credit Cards ==' );
Ti.API.info( 'cc 4242 => '+TiStripe.card.validateCardNumber('4242424242424242') ); //true
Ti.API.info( 'cc 4242 => '+TiStripe.card.validateCardNumber('4242-42424242-4242') ); //true
Ti.API.info( 'cc 4242 => '+TiStripe.card.validateCardNumber('4242 4242 4242 4242') ); //true
Ti.API.info( 'cc 1111 => '+TiStripe.card.validateCardNumber('4242-1111-1111-1111') ); //false
Ti.API.info( 'cc 12345678 => '+TiStripe.card.validateCardNumber('12345678') ); //false
Ti.API.info( 'cc mistake => '+TiStripe.card.validateCardNumber('mistake') ); //false

Ti.API.info( 'exp 02/10 => ' + TiStripe.card.validateExpiry('02', '10') ); //false
Ti.API.info( 'exp 2/2010 => ' + TiStripe.card.validateExpiry(2, 2020) ); //true

Ti.API.info( 'cvc 212 => ' + TiStripe.card.validateCVC('212') ); //true
Ti.API.info( 'cvc 2 => ' + TiStripe.card.validateCVC('2') ); //false

Ti.API.info( 'type 4242 => ' + TiStripe.card.cardType('4242-4242-4242-4242') ); // "Visa"
Ti.API.info( 'type 3782 => ' + TiStripe.card.cardType('378282246310005') );     // "American Express"
Ti.API.info( 'type 1234 => ' + TiStripe.card.cardType('1234') );               // "Unknown"

		function stripeResponseHandler(response, status) { // Heads up: stripe documentation indicates that these callback functions receive (status, response), however, in their own codebase it actually returns (response, status). I've chosen to match their codebase functionality and not their documention in this instance
		    Ti.API.info('returned something');
		    if (response.error) {
		        /**
		         * 
		         * error response
		         * 
					{
						error =     {
							code = "incorrect_number";
							message = "Your card number is incorrect";
							param = number;
							type = "card_error";
						};
					}
		         */
		        
		        Ti.API.info(response);
		        Ti.API.info(response.error);
		        Ti.UI.createAlertDialog({title:'Oh no!',message: response.error.message, buttonNames: null}).show();
		    } else {
		    	
		    	/**
		    	 * 
		    	 * success response
		    	 * 
		   			{
						card =     {
							"address_city" = "<null>";
							"address_country" = "<null>";
							"address_line1" = "<null>";
							"address_line2" = "<null>";
							"address_state" = "<null>";
							"address_zip" = "<null>";
							country = US;
							"exp_month" = 5;
							"exp_year" = 2015;
							fingerprint = XtSLwJJtPrVHCXGD;
							last4 = 4242;
							name = "<null>";
							object = card;
							type = Visa;
						};
						created = 1371395054;
						id = "tok_21lD5PQYbrlMGq";
						livemode = 0;
						object = token;
						type = card;
						used = 0;
					}
		    	 */
		    	
		       	Ti.API.info(response);
		       	Ti.API.info(response['id']); // <== this is the token
		       	Ti.UI.createAlertDialog({title:'Yay!',message: 'Token created successfully: '+response['id'], buttonNames: null}).show();
		       	
				/** 
				 * 
				 * You can use this code to verify the token hasn't been used - but I wouldn't recommend you use it here...
		     	
			       	TiStripe.token.get(response['id'], function(response, status){ //the note is applicable to all callbacks with respect to getting and creating tokens
					  if (status == 200 && !response.used)
					    alert('This token can still be used.');
					  else
					    alert('The token was invalid, or has already been used.');
					});
				
				**/
		       	
		       	
		    }
		}

	var data=[];
	var ccForm = Ti.UI.createTableView({ style: Titanium.UI.iPhone.TableViewStyle.GROUPED, top: 0, backgroundColor: 'transparent'});
	
	var row = Titanium.UI.createTableViewRow({backgroundColor:'#fff',selectionStyle:'none', height: 'auto'});


	var ccImgView = Ti.UI.createView({ // <== this should be a VIEW the size and placement you want the credit card image NOT AN IMAGEVIEW, a regular view
		top: 11,
		left: 3,
		width: 32,
		height: 19,
		backgroundColor: '#fff'
	});
	TiStripe.paymentKitUI.ccImg(ccImgView);
	row.add(ccImgView);

	var ccNumTF = Titanium.UI.createTextField({ // <== please see notations on cvcTF.ccCCNum when changing the name of this view
	    keyboardType:Titanium.UI.KEYBOARD_NUMBER_PAD,
	    //ccStyleNum: false, // <== keeps it from formatting the credit card number into groupings
	    ccVerify: true, // <== whether to client side validate credit card before auto-focusing the next element
	    ccOnFailVerify: function(tf) { // <== if it fails validation, what to do. You should use this when ccVerify is true
	    	this.color = 'red';
	    	//be careful about using a create dialog here. There seems to be a bug in 3.1.0GA and ios7 seed 1 on Xcode 5 where if a dialog is present,
	    	//eventListeners do not fire. This lets the user type in as many numbers as they want in the field without it blurring
	    	//or validating again. This can get them caught in a loop of alert messages without being able to clear out the field.
	    	//This may be fixed in future ios7 / Xcode releases or Titanium SDK updates, but it exists at least right now.
	    },
	    autocorrect:false,
	    top: 0,
	    height:40,
	    color: '#444',
	    font: {fontSize: 18,fontWeight: 'bold'},
	    width:180,
		left: 40,
		selectionStyle:'none',
		hintText: 'Enter Card Number'
	});
	TiStripe.paymentKitUI.ccNumTextField(ccNumTF);
	row.add(ccNumTF);


	var expTF = Titanium.UI.createTextField({
	    keyboardType:Titanium.UI.KEYBOARD_NUMBER_PAD,
	    //ccNextFocus: false, // <== will skip this field when it's auto-focusing the next field
	    autocorrect:false,
	    top: 40,
	    left: 10,
	    height:40,
	    color: '#444',
	    font: {fontSize: 18,fontWeight: 'bold'},
	    width:80,
		selectionStyle:'none',
		hintText: 'MM/YY'
	});
	TiStripe.paymentKitUI.ccExpTextField(expTF);
	row.add(expTF);
	
	
	var cvcTF = Titanium.UI.createTextField({
	    keyboardType:Titanium.UI.KEYBOARD_NUMBER_PAD,
	    autocorrect:false,
	    //ccFlipCCImage: false, // <== won't flip the ccImg image (if set) when this field is focused
	    ccCCNum: ccNumTF, // <== which ccnum field to hook to so image displays correctly
	    top: 40,
	    left: 100,
	    height:40,
	    color: '#444',
	    font: {fontSize: 18,fontWeight: 'bold'},
	    width:80,
		selectionStyle:'none',
		hintText: 'CVV'
	});
	TiStripe.paymentKitUI.ccCVCTextField(cvcTF);
	row.add(cvcTF);
	
	var zipTF = Titanium.UI.createTextField({
	    keyboardType:Titanium.UI.KEYBOARD_NUMBER_PAD,
	    autocorrect:false,
	    top: 40,
	    left: 200,
	    height:40,
	    width:70,
		selectionStyle:'none',
		color: '#444',
	    font: {fontSize: 18,fontWeight: 'bold'},
		hintText: 'ZIP'
	});
	TiStripe.paymentKitUI.ccUSZipTextField(zipTF);
	row.add(zipTF);

	var ccTF = Titanium.UI.createTextField({
	    keyboardType:Titanium.UI.KEYBOARD_NUMBER_PAD,
	    autocorrect:false,
	    ccMaxLength: 4,
	    passwordMask:true,
	    top: 80,
	    left: 10,
	    height:40,
	    width:200,
		selectionStyle:'none',
		color: '#444',
	    font: {fontSize: 18,fontWeight: 'bold'},
		hintText: '4 digit Field'
	});
	TiStripe.paymentKitUI.ccTextField(ccTF);
	row.add(ccTF);
	
	var payBtn = Ti.UI.createLabel({
		top: 125,
		left: 10,
		bottom: 10,
		right: 10,
		height: 35,
		color: '#444',
		font: {fontSize: 18,fontWeight: 'bold'},
		borderColor: '#ccc',
		backgroundGradient: { 
	        type:'linear',
	        colors:[{color: '#fff', position: 0.0}, {color: '#eee', position: 0.3}, {color: '#ddd', position: 1}]
	    },
		borderRadius: 8,
		textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
		text: 'Pay!'
		
	});
	
	payBtn.addEventListener('click', function() {
		Ti.API.info('clicked pay');
		//split the expiration date
		var exp = TiStripe.utils.splitExpiry(expTF.value);
		//create token
		TiStripe.card.createToken({
		    number: ccNumTF.value, 		//required
		    cvc: cvcTF.value,			//required
		    exp_month: exp.month,		//required
		    exp_year: exp.year,			//required
		    address_zip: zipTF.value	//not required, but it's in stripe's paymentKitUI examples, so I included it here
		}, stripeResponseHandler);
	
	});
	
	row.add(payBtn);

	data.push(row);

	ccForm.setData(data);
	win.add(ccForm);

