
Ti.include('libs/TiStripe.1.1.pack.js');

var win = Titanium.UI.currentWindow;

var closeButton = Titanium.UI.createButton({systemButton:Titanium.UI.iPhone.SystemButton.DONE});
	win.rightNavButton = closeButton;
	
	closeButton.addEventListener('click', function() {
		win.navWin.close();
	});

TiStripe.setPublishableKey('pk_test_InyRv031yM7R6ANUpexRHTED');

var stripeResponseHandler = function(response, status) { // Heads up: stripe documentation indicates that these callback functions receive (status, response), however, in their own codebase it actually returns (response, status). I've chosen to match their codebase functionality and not their documention in this instance
    Ti.API.info('returned something');
    if (response.error) {
        Ti.API.info(response);
        Ti.API.info(response.error);
        Ti.UI.createAlertDialog({
            title: 'Oh no!',
            message: response.error.message,
            buttonNames: null
        }).show();
    } else {

        Ti.API.info(response);
        Ti.API.info(response['id']); // <== this is the token
		
        var dialog = Ti.UI.createAlertDialog({
			title: 'Thank you!',
			message: 'Your payment was successfully received.',
			buttonNames: ['Ok'],
		});
		dialog.show();

    }
};


var buildPaymentForm = function() {
   
   Ti.API.info('got here');
   
    var data = [];
    var ccForm = Ti.UI.createTableView({
        style: Ti.UI.iPhone.TableViewStyle.GROUPED,
        top: 0,
        backgroundColor: 'transparent'
    });

    var row = Ti.UI.createTableViewRow({
        backgroundColor: '#fff',
        selectionStyle: 'none',
        height: 'auto'
    });

    var ccImgView = Ti.UI.createView({ // <== this should be a VIEW the size and placement you want the credit card image NOT AN IMAGEVIEW, a regular view
        top: '11dp',
        left: '3dp',
        width: '32dp',
        height: '19dp',
        flipAnimation: false
    });
    TiStripe.paymentKitUI.ccImg(ccImgView);
    row.add(ccImgView);

    var ccNumTF = Ti.UI.createTextField({ // <== please see notations on cvcTF.ccCCNum when changing the name of this view  
        keyboardType: Ti.UI.KEYBOARD_NUMBER_PAD,
        //ccStyleNum: false, // <== keeps it from formatting the credit card number into groupings
        ccVerify: true, // <== whether to client side validate credit card before auto-focusing the next element
        ccOnFailVerify: function(tf) { // <== if it fails validation, what to do. You should use this when ccVerify is true
            this.color = 'red';
            //be careful about using a create dialog here. There seems to be a bug in 3.1.0GA and ios7 seed 1 on Xcode 5 where if a dialog is present,
            //eventListeners do not fire. This lets the user type in as many numbers as they want in the field without it blurring
            //or validating again. This can get them caught in a loop of alert messages without being able to clear out the field.
            //This may be fixed in future ios7 / Xcode releases or Titanium SDK updates, but it exists at least right now.
        },
        autocorrect: false,
        top: 0,
        height: 40,
        color: '#444',
        font: {
            fontSize: 18,
            fontWeight: 'bold'
        },
        width: 180,
        left: 40,
        selectionStyle: 'none',
        hintText: 'Enter Card Number'
    });
    TiStripe.paymentKitUI.ccNumTextField(ccNumTF);
    row.add(ccNumTF);


    var expTF = Ti.UI.createTextField({
        keyboardType: Ti.UI.KEYBOARD_NUMBER_PAD,
        //ccNextFocus: false, // <== will skip this field when it's auto-focusing the next field
        autocorrect: false,
        top: 40,
        left: 10,
        height: 40,
        color: '#444',
        font: {
            fontSize: 18,
            fontWeight: 'bold'
        },
        width: 80,
        selectionStyle: 'none',
        hintText: 'MM/YY'
    });
    TiStripe.paymentKitUI.ccExpTextField(expTF);
    row.add(expTF);
    
    var cvcTF = Ti.UI.createTextField({     
        keyboardType: Ti.UI.KEYBOARD_NUMBER_PAD,
        autocorrect: false,
        
        //ccFlipCCImage: false, // <== won't flip the ccImg image (if set) when this field is focused
        ccCCNum: ccNumTF, // <== which ccnum field to hook to so image displays correctly
        top: 40,
        left: 100,
		height: 40,
        color: '#444',
        font: {
            fontSize: 18,
            fontWeight: 'bold'
        },
        width: 80,
        selectionStyle: 'none',
        hintText: 'CVV'
    });
    TiStripe.paymentKitUI.ccCVCTextField(cvcTF);
    row.add(cvcTF);

    var zipTF = Ti.UI.createTextField({
        //ccOnBlur: false,
        //ccOnFocus: false,
        
        keyboardType: Ti.UI.KEYBOARD_NUMBER_PAD,
        autocorrect: false,
        top: 40,
        left: 200,
        height: 40,
        width: 70,
        selectionStyle: 'none',
        color: '#444',
        font: {
            fontSize: 18,
            fontWeight: 'bold'
        },
        hintText: 'ZIP'
    });
    TiStripe.paymentKitUI.ccUSZipTextField(zipTF);
    row.add(zipTF);

    var ccFirstName = Ti.UI.createTextField({        
        keyboardType: Ti.UI.KEYBOARD_EMAIL,
        autocorrect: false,
        top: 80,
        left: 10,
        height: 40,
        width: 100,
        selectionStyle: 'none',
        color: '#444',
        font: {
            fontSize: 18,
            fontWeight: 'bold'
        },
        hintText: 'First Name'
    });
    TiStripe.paymentKitUI.ccTextField(ccFirstName);
    row.add(ccFirstName);

    var ccLastName = Ti.UI.createTextField({         
        keyboardType: Ti.UI.KEYBOARD_EMAIL,
        autocorrect: false,
        top: 80,
        left: 120,
        height: 40,
        width: 100,
        selectionStyle: 'none',
        color: '#444',
        font: {
            fontSize: 18,
            fontWeight: 'bold'
        },
        hintText: 'Last Name'
    });
    TiStripe.paymentKitUI.ccTextField(ccLastName);
    row.add(ccLastName);

    var ccEmail = Ti.UI.createTextField({      
        keyboardType: Ti.UI.KEYBOARD_EMAIL,
        autocorrect: false,
        top: 120,
        left: 10,
        height: 40,
        width: 270,
        selectionStyle: 'none',
        color: '#444',
        font: {
            fontSize: 18,
            fontWeight: 'bold'
        },
        hintText: 'Email Address'
    });
    TiStripe.paymentKitUI.ccTextField(ccEmail);
    row.add(ccEmail);

    var payBtn = Ti.UI.createLabel({
        top: 165,
        left: 10,
        bottom: 10,
        right: 10,
        height: 35,
        color: '#444',
        font: {
            fontSize: 18,
            fontWeight: 'bold'
		},
        borderColor: '#ccc',
        backgroundGradient: {
            type: 'linear',
            colors: [{
                color: '#fff',
                position: 0.0
            }, {
                color: '#eee',
                position: 0.3
            }, {
                color: '#ddd',
				position: 1
            }]
        },
        borderRadius: 8,
        textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
        text: 'Pay Now'

    });

    payBtn.addEventListener('click', function() {
        Ti.API.info('clicked pay');
        //split the expiration date
        var exp = TiStripe.utils.splitExpiry(expTF.value);
        
        ccData = [{
        	first_name: ccFirstName.value,
            last_name: ccLastName.value,
            email: ccEmail.value
        }];
    	//Alloy.Globals.CB.Cache.set('ccData', ccData);
        
        //create token
        TiStripe.card.createToken({
            number: ccNumTF.value, //required
            cvc: cvcTF.value, //required
            exp_month: exp.month, //required
            exp_year: exp.year, //required
            address_zip: zipTF.value //not required, but it's in stripe's paymentKitUI examples, so I included it here
        }, stripeResponseHandler);
    });
	
    row.add(payBtn);

    data.push(row);

    ccForm.setData(data);
    //$.shoppingCart.add(ccForm);
    win.add(ccForm);
};

buildPaymentForm();
