Ti.include('libs/TiStripe.js');

var win = Titanium.UI.currentWindow;

var closeButton = Titanium.UI.createButton({systemButton:Titanium.UI.iPhone.SystemButton.DONE});
	win.rightNavButton = closeButton;
	
	closeButton.addEventListener('click', function() {
		win.close();
	});


//TiStripe.setPublishableKey('myPublishableKey');
TiStripe.setPublishableKey('pk_test_InyRv031yM7R6ANUpexRHTED');

Ti.API.info( 'key => '+TiStripe.getPublishableKey() );

//bank accounts
Ti.API.info( ' == Bank Accounts ==' );
Ti.API.info( 'route 0025 => '+ TiStripe.bankAccount.validateRoutingNumber('111000025', 'US') ); //true
Ti.API.info( 'route 0000 => '+ TiStripe.bankAccount.validateRoutingNumber('110000000', 'US') ); //true
Ti.API.info( 'route 99...0000 => '+ TiStripe.bankAccount.validateRoutingNumber('990000000', 'US') ); //true? (stripe documentation indicates this should return false, however, when run against their own codebase, it also returns true. This may be an error in their documentation.)
Ti.API.info( 'route 12345 => '+ TiStripe.bankAccount.validateRoutingNumber('12345', 'US') ); //false - bad checksum
Ti.API.info( 'route mistake => '+ TiStripe.bankAccount.validateRoutingNumber('mistake', 'US') ); //false - bad checksum

Ti.API.info( 'acct 6789 => '+ TiStripe.bankAccount.validateAccountNumber('000123456789', 'US') ); //true
Ti.API.info( 'acct mistake => '+ TiStripe.bankAccount.validateAccountNumber('mistake', 'US') ); //false

function stripeResponseHandler(response, status) { // Heads up: stripe documentation indicates that these callback functions receive (status, response), however, in their own codebase it actually returns (response, status). I've chosen to match their codebase functionality and not their documention in this instance
    if (response.error) {
    	 /**
         * 
         * error response
         * 
			{
				error =     {
					message = "Must only use a test bank account number when making transfers in test mode";
					param = "bank_account";
					type = "invalid_request_error";
				};
			}
         */
        Ti.API.info(response);
        Ti.API.info(response.error);
        Ti.UI.createAlertDialog({title:'Oh no!',message: response.error.message, buttonNames: null}).show();
    } else {
    	/**
    	 * 
    	 * Successful response
    	 * 
    	 * {
				"bank_account" =     {
					"bank_name" = "BANK OF AMERICA, N.A.";
					country = US;
					fingerprint = hS708ZujSbqkKEkf;
					last4 = 6789;
					object = "bank_account";
					validated = 0;
				};
				created = 1371394735;
				id = "btok_21l8PUX6kshQfF";
				livemode = 0;
				object = token;
				type = "bank_account";
				used = 0;
			}
    	 * 
    	 */
       	Ti.API.info(response);
       	Ti.API.info(response['id']); // <== this is the token
       	Ti.UI.createAlertDialog({title:'Yay!',message: 'Token created successfully: '+response['id'], buttonNames: null}).show();
       	
    }
}



	var data=[];
	var baForm = Ti.UI.createTableView({ style: Titanium.UI.iPhone.TableViewStyle.GROUPED, top: 0, backgroundColor: 'transparent'});
	
	var row = Titanium.UI.createTableViewRow({backgroundColor:'#fff',selectionStyle:'none', height: 'auto'});


	var baUSRouting = Titanium.UI.createTextField({
	    keyboardType:Titanium.UI.KEYBOARD_NUMBER_PAD,
	    //ccStyleNum: false,
	    baVerify: true,
	    baOnFailVerify: function(tf) {
	    	this.color = 'red';
	    },
	    autocorrect:false,
	    top: 0,
	    height:40,
	    color: '#444',
	    font: {fontSize: 18,fontWeight: 'bold'},
	    width:250,
		left: 10,
		selectionStyle:'none',
		hintText: 'Enter Routing Number (US)'//,
		//passwordMask:true
	});
	//TiStripe.paymentKitUI.baCARoutingTextField(baCARouting); //canadian routing number
	TiStripe.paymentKitUI.baUSRoutingTextField(baUSRouting); //us routing number
	row.add(baUSRouting); 


	var baUSAccount = Titanium.UI.createTextField({
	    keyboardType:Titanium.UI.KEYBOARD_NUMBER_PAD,
	    //ccNextFocus: false,
	    autocorrect:false,
	    top: 40,
	    left: 10,
	    height:40,
	    color: '#444',
	    font: {fontSize: 18,fontWeight: 'bold'},
	    width:120,
		selectionStyle:'none',
		hintText: 'Acct Num'
	});
	//TiStripe.paymentKitUI.baCAAccountTextField(baCAAccount); //canadian account number
	TiStripe.paymentKitUI.baUSAccountTextField(baUSAccount); //us account number
	row.add(baUSAccount);
	

	var payBtn = Ti.UI.createLabel({
		top: 80,
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

		TiStripe.bankAccount.createToken({
		    country: 'US', // or 'CA' for Canadian
		    routingNumber: baUSRouting.value,
		    accountNumber: baUSAccount.value,
		}, stripeResponseHandler);
	
	});
	
	row.add(payBtn);
	

	data.push(row);
	
	
	baForm.setData(data);
	win.add(baForm);
	

