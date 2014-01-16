var TiStripe = (function() {
	var privateVars = {
		ccImgView: Ti.UI.createView({}),
		ccImgBack: Ti.UI.createImageView({}),
		ccImgFront: Ti.UI.createImageView({}),
		versionMajor: null,
		versionMinor: null
	};
	var obj = {
		options: {
			publishableKey: null,
			stripeVersion: 2,
			stripeEndpoint: 'https://api.stripe.com/v1',
			onConnectionError: function(e) {Ti.API.info('There was a connection error:');Ti.API.info(e);Ti.API.info(e.error);},
			imagePath: 'images/',
			flipDuration: 400
		},
		load: function() {
			//anything we want to call immediately, put in here
			obj.setVersion();
		},
		setVersion: function() {
			var version = Ti.Platform.version.split('.');
				privateVars.versionMajor = parseInt(version[0]);
				privateVars.versionMinor = parseInt(version[1]);
		},
		setOption: function(option, value) {
			
		},
		getOption: function(option) {
			
		},
		setPublishableKey: function(key) {
			obj.options.publishableKey = key;
		},
		getPublishableKey: function() {
			return obj.options.publishableKey;
		},
		utils: {
			trim: function(str) {
				return (str + '').replace(/^\s+|\s+$/g, '');
			},
			serialize: function(object, result, scope) {
				var key, value;
				var e = encodeURIComponent;
				if (result == null) {
					result = [];
				}
				for (key in object) {
					value = object[key];
					if (scope) {
						key = "" + scope + "[" + key + "]";
					}
					if (typeof value === 'object') {
						obj.utils.serialize(value, result, key);
					} else {
						result.push("" + key + "=" + (e(value)));
					}
				}
				return result.join('&').replace(/%20/g, '+');
			},
			underscore: function(str) {
				return (str + '').replace(/([A-Z])/g, function($1) {
			        return "_" + ($1.toLowerCase());
				}).replace(/-/g, '_');
			},
			underscoreKeys: function(data) {
				var key, value, _results;
				_results = [];
				for (key in data) {
					value = data[key];
					delete data[key];
					_results.push(data[this.underscore(key)] = value);
				}
				return _results;
			},
			isElement: function(el) {
				if (typeof el !== 'object') {
					return false;
				}
				if ((typeof jQuery !== "undefined" && jQuery !== null) && el instanceof jQuery) {
					return true;
				}
				return el.nodeType === 1;
			},
			validateKey: function(key) {
				if (!key || typeof key !== 'string') {
					throw new Error('You did not set a valid publishable key. ' + 'Call TiStripe.setPublishableKey() with your publishable key. ' + 'For more info, see https://stripe.com/docs/stripe.js');
				}
				if (/\s/g.test(key)) {
					throw new Error('Your key is invalid, as it contains whitespace. ' + 'For more info, see https://stripe.com/docs/stripe.js');
				}
				if (/^sk_/.test(key)) {
					throw new Error('You are using a secret key with Stripe.js, instead of the publishable one. ' + 'For more info, see https://stripe.com/docs/stripe.js');
				}
			},
			splitExpiry: function(expiry) {
				var exp = expiry.split('/');
					var month = exp[0];
					var year = exp[1];
					if( parseInt(year) < 2000 ) {year = parseInt(2000 + parseInt(year));}
				return {month: month, year: year};
			}
		},
		token: {
			validate: function(data, name) {
				if (!data) {
					throw name + ' required';
				}
				if (typeof data !== 'object') {
					throw name + ' invalid';
				}
			},
			formatData: function(data, attrs) {
				if (obj.utils.isElement(data)) {
					data = obj.utils.paramsFromForm(data, attrs);
				}
				obj.utils.underscoreKeys(data);
				return data;
			},
			create: function(params, callback) {
				params.key || (params.key = obj.options.key || obj.options.publishableKey);
				obj.utils.validateKey( params.key );
				var url = obj.options.stripeEndpoint + '/tokens?' + obj.utils.serialize(params) + '&callback=callback&_method=POST';
				var tokenAjax = Ti.Network.createHTTPClient({
					onload : function(e) {
				         var response = eval(this.responseText);
				     },
				     onerror : function(e) {
				         obj.options.onConnectionError(e);
				     },
					enableKeepAlive:false,
					timeout: 30000
				});
			
				tokenAjax.open("GET",url);
				tokenAjax.send();
			},
			get: function(token, callback) {
				if (!token) {
					throw 'token required';
				}
      			obj.utils.validateKey( obj.options.publishableKey );

				var url = obj.options.stripeEndpoint + '/tokens/' + token + '?key=' + obj.options.publishableKey + '&callback=callback';
				var tokenAjax = Ti.Network.createHTTPClient({
					onload : function(e) {
				         var response = eval(this.responseText);
				     },
				     onerror : function(e) {
				         obj.options.onConnectionError(e);
				     },
					enableKeepAlive:false,
					timeout: 30000
				});
			
				tokenAjax.open("GET",url);
				tokenAjax.send();    
			      
			}
		},
		card: {
			tokenName: 'card',
			whitelistedAttrs: ['number', 'cvc', 'exp_month', 'exp_year', 'name', 'address_line1', 'address_line2', 'address_city', 'address_state', 'address_zip', 'address_country'],
			createToken: function(data, params, callback) {
				var amount;
				if (params == null) {
					params = {};
				}
				obj.token.validate(data, 'card');
				if (typeof params === 'function') {
					callback = params;
					params = {};
				} else if (typeof params !== 'object') {
					amount = parseInt(params, 10);
					params = {};
					if (amount > 0) {
						params.amount = amount;
					}
				}
				params[this.tokenName] = obj.token.formatData(data, this.whitelistedAttrs);
				return obj.token.create(params, callback);
			},
			getToken: function(token, callback) {
				return obj.token.get(token, callback);
			},
			validateCardNumber: function(num) {
				num = (num + '').replace(/\s+|-/g, '');
      			return num.length >= 10 && num.length <= 16 && this.luhnCheck(num);
			},
			validateCVC: function(num) {
				num = obj.utils.trim(num);
				return /^\d+$/.test(num) && num.length >= 3 && num.length <= 4;
			},
			validateExpiry: function(month, year) {
				var currentTime, expiry;
				month = obj.utils.trim(month);
				year = obj.utils.trim(year);
				if (!/^\d+$/.test(month)) {
					return false;
				}
				if (!/^\d+$/.test(year)) {
					return false;
				}
				if (!(parseInt(month, 10) <= 12)) {
					return false;
				}
				expiry = new Date(year, month);
				currentTime = new Date;
				expiry.setMonth(expiry.getMonth() - 1);
				expiry.setMonth(expiry.getMonth() + 1, 1);
				return expiry > currentTime;
			},
			luhnCheck: function(num) {
				var digit, digits, odd, sum, _i, _len;
		      	odd = true;
		      	sum = 0;
		      	digits = (num + '').split('').reverse();
		      	for (_i = 0, _len = digits.length; _i < _len; _i++) {
		        	digit = digits[_i];
		        	digit = parseInt(digit, 10);
		        	if ((odd = !odd)) {
		          		digit *= 2;
		        	}
		        	if (digit > 9) {
		          		digit -= 9;
		        	}
		        	sum += digit;
		      	}
		      	return sum % 10 === 0;
			},
			cardType: function(num) {
				var cardTypes = this.cardTypes();
				return cardTypes[num.slice(0, 2)] || 'Unknown';
			},
			cardTypes: function() {
				var num, types, _i, _j;
				types = {};
				for (num = _i = 40; _i <= 49; num = ++_i) {
					types[num] = 'Visa';
				}
				for (num = _j = 50; _j <= 59; num = ++_j) {
					types[num] = 'MasterCard';
				}
				types[34] = types[37] = 'American Express';
				types[60] = types[62] = types[64] = types[65] = 'Discover';
				types[35] = 'JCB';
				types[30] = types[36] = types[38] = types[39] = 'Diners Club';
				return types;
			}

		},
		bankAccount: {
			tokenName: 'bank_account',
			whitelistedAttrs: ['country', 'routing_number', 'account_number'],
			createToken: function(data, params, callback) {
				if (params == null) {
					params = {};
				}
				obj.token.validate(data, 'bank account');
				if (typeof params === 'function') {
					callback = params;
					params = {};
				}
				params[this.tokenName] = obj.token.formatData(data, this.whitelistedAttrs);
      			return obj.token.create(params, callback);
			},
			getToken: function(token, callback) {
      			return obj.token.get(token, callback);
			},
			validateRoutingNumber: function(num, country) {
      			num = obj.utils.trim(num);
      			switch (country) {
        			case 'US':
          				return /^\d+$/.test(num) && num.length === 9 && obj.bankAccount.routingChecksum(num);
        			case 'CA':
          				return /\d{5}\-\d{3}/.test(num) && num.length === 9;
        			default:
          				return true;
      			}
    		},
    		validateAccountNumber: function(num, country) {
      			num = obj.utils.trim(num);
      			switch (country) {
        			case 'US':
          				return /^\d+$/.test(num) && num.length >= 1 && num.length <= 17;
        			default:
          				return true;
      			}
    		},
    		routingChecksum: function(num) {
      			var digits, index, sum, _i, _len, _ref;
      			sum = 0;
      			digits = (num + '').split('');
      			_ref = [0, 3, 6];
      			for (_i = 0, _len = _ref.length; _i < _len; _i++) {
			        index = _ref[_i];
			        sum += parseInt(digits[index]) * 3;
			        sum += parseInt(digits[index + 1]) * 7;
			        sum += parseInt(digits[index + 2]);
      			}
      			return sum !== 0 && sum % 10 === 0;
    		}
		},	
		validator: {
			boolean: function(expected, value) {
				if (!(value === 'true' || value === 'false')) {
					return "Enter a boolean string (true or false)";
				}
			},
			integer: function(expected, value) {
				if (!/^\d+$/.test(value)) {
					return "Enter an integer";
				}
			},
			positive: function(expected, value) {
				if (!(!this.integer(expected, value) && parseInt(value, 10) > 0)) {
					return "Enter a positive value";
				}
			},
			range: function(expected, value) {
				var _ref;
				if (_ref = parseInt(value, 10), __indexOf.call(expected, _ref) < 0) {
					return "Needs to be between " + expected[0] + " and " + expected[expected.length - 1];
				}
			},
			required: function(expected, value) {
				if (expected && (!(value != null) || value === '')) {
					return "Required";
				}
			},
			year: function(expected, value) {
				if (!/^\d{4}$/.test(value)) {
					return "Enter a 4-digit year";
				}
			},
			birthYear: function(expected, value) {
				var year;
				year = this.year(expected, value);
				if (year) {
					return year;
				} else if (parseInt(value, 10) > 2000) {
					return "You must be over 18";
				} else if (parseInt(value, 10) < 1900) {
					return "Enter your birth year";
				}
			},
			month: function(expected, value) {
				if (this.integer(expected, value)) {
					return "Please enter a month";
				}
			  	if (this.range([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], value)) {
			   		return "Needs to be between 1 and 12";
			  	}
			},
			choices: function(expected, value) {
			  	if (__indexOf.call(expected, value) < 0) {
			    	return "Not an acceptable value for this field";
			  	}
			},
			email: function(expected, value) {
				if (!/^[^@<\s>]+@[^@<\s>]+$/.test(value)) {
					return "That doesn't look like an email address";
			  	}
			},
			url: function(expected, value) {
			  	if (!/^https?:\/\/.+\..+/.test(value)) {
					return "Not a valid url";
			  	}
			},
			usTaxID: function(expected, value) {
				if (!/^\d{2}-?\d{1}-?\d{2}-?\d{4}$/.test(value)) {
					return "Not a valid tax ID";
			  	}
			},
			ein: function(expected, value) {
			  	if (!/^\d{2}-?\d{7}$/.test(value)) {
					return "Not a valid EIN";
			  	}
			},
			ssnLast4: function(expected, value) {
			  	if (!/^\d{4}$/.test(value)) {
					return "Not a valid last 4 digits for an SSN";
				}
			},
			ownerPersonalID: function(country, value) {
			  	var match;
			  	match = (function() {
				  	switch (country) {
				      	case 'CA':
							return /^\d{3}-?\d{3}-?\d{3}$/.test(value);
				  		case 'US':
				        	return true;
				    }
				})();
			  	if (!match) {
			    	return "Not a valid ID";
			  	}	
			},
			bizTaxID: function(country, value) {
			  	var fieldName, match, regex, regexes, validation, validations, _i, _len;
			  	validations = {
			   		'CA': ['Tax ID', [/^\d{9}$/]],
					'US': ['EIN', [/^\d{2}-?\d{7}$/]]
			  	};
			  	validation = validations[country];
			  	if (validation != null) {
			    	fieldName = validation[0];
			    	regexes = validation[1];
			    	match = false;
			    	for (_i = 0, _len = regexes.length; _i < _len; _i++) {
			      		regex = regexes[_i];
			      		if (regex.test(value)) {
			        		match = true;
			        		break;
			      		}
			    	}
			    	if (!match) {
			      	return "Not a valid " + fieldName;
			    	}
			  	}
			},
			zip: function(country, value) {
				var match;
			  	match = (function() {
			    	switch (country.toUpperCase()) {
			      		case 'CA':
							return /^[\d\w]{6}$/.test(value != null ? value.replace(/\s+/g, '') : void 0);
			  			case 'US':
							return /^\d{5}$/.test(value) || /^\d{9}$/.test(value);
			    	}
			  	})();
			  	if (!match) {
			    	return "Not a valid zip";
			  	}
			},
			bankAccountNumber: function(expected, value) {
				if (!/^\d{1,17}$/.test(value)) {
					return "Invalid bank account number";
			  	}
			},
			usRoutingNumber: function(value) {
			  	var index, part1, part2, part3, total, _i, _ref;
			  	if (!/^\d{9}$/.test(value)) {
					return "Routing number must have 9 digits";
			  	}
			  	total = 0;
			  	for (index = _i = 0, _ref = value.length - 1; _i <= _ref; index = _i += 3) {
				    part1 = parseInt(value.charAt(index), 10) * 3;
				    part2 = parseInt(value.charAt(index + 1), 10) * 7;
				    part3 = parseInt(value.charAt(index + 2), 10);
				    total += part1 + part2 + part3;
			  	}
			  	if (!(total !== 0 && total % 10 === 0)) {
			    	return "Invalid routing number";
			  	}
			},
			caRoutingNumber: function(value) {
				if (!/^\d{5}\-\d{3}$/.test(value)) {
					return "Invalid transit number";
			  	}
			},
			routingNumber: function(country, value) {
			  	switch (country.toUpperCase()) {
			    	case 'CA':
			  			return this.caRoutingNumber(value);
					case 'US':
			      		return this.usRoutingNumber(value);
			  }
			},
			phoneNumber: function(expected, value) {
			  	var number;
			  	number = value.replace(/[^0-9]/g, '');
			  	if (number.length !== 10) {
			    	return "Invalid phone number";
			  	}
			},
			bizDBA: function(expected, value) {
			  	if (!/^.{1,23}$/.test(value)) {
					return "Statement descriptors can only have up to 23 characters";
			  	}
			},
			nameLength: function(expected, value) {
			  	if (value.length === 1) {
			    	return 'Names need to be longer than one character';
			  	}
			}
		},
		paymentKitUI: {
			ccFields: [],
			addCCFields: function(tiObj) {
				obj.paymentKitUI.ccFields.push(tiObj);
			},
			getCCFields: function() {
				return obj.paymentKitUI.ccFields;
			},
			verifyCCField: function(tf) {
				if(tf.ccVerify == true) {
					if(typeof(tf.ccOnFailVerify) != "function") {tf.ccOnFailVerify = function() {};}
					switch (tf.ccTFType) {
						case 'ccNum':
							if(obj.card.validateCardNumber(tf.value)) {
								obj.paymentKitUI.nextCCField(tf);
							} else {
								tf.ccOnFailVerify();
							}
							break;
						case 'ccExp':
							var exp = tf.value.split('/');
							if(obj.card.validateExpiry(parseFloat(exp[0]), parseFloat(2000 + exp[1]))) {
								obj.paymentKitUI.nextCCField(tf);
							} else {
								tf.ccOnFailVerify();
							}
							break;
						case 'ccCVC':
							if(obj.card.validateCVC(tf.value)) {
								obj.paymentKitUI.nextCCField(tf);
							} else {
								tf.ccOnFailVerify();
							}
							break;
					}
				} else {
					obj.paymentKitUI.nextCCField(tf);
				}
			},
			nextCCField: function(tf) {
				for(var _i = 0; _i < obj.paymentKitUI.ccFields.length; _i++) {
					if(obj.paymentKitUI.ccFields[ _i ] == tf) {
						
						//setup the onblur event
						if(typeof(tf.ccOnBlur) != "function") {
							tf.ccOnBlur = function() {};
						}
							if( tf.ccOnBlur() == false) {
								return false;
							}
							
						if( (_i + 1) < obj.paymentKitUI.ccFields.length) {
							if( obj.paymentKitUI.ccFields[ (_i + 1) ].value.length >= obj.paymentKitUI.ccFields[ (_i + 1) ].ccMaxLength ) {
								obj.paymentKitUI.nextCCField( obj.paymentKitUI.ccFields[ (_i + 1) ] );
								break;
							} else {
								if(typeof(obj.paymentKitUI.ccFields[ (_i + 1) ].ccOnFocus) != "function") {
									obj.paymentKitUI.ccFields[ (_i + 1) ].ccOnFocus = function(nextField) {
										nextField.focus();
									};
								}
								obj.paymentKitUI.ccFields[ (_i + 1) ].ccOnFocus( obj.paymentKitUI.ccFields[ (_i + 1) ] );
							}
						} else {
							tf.blur();
						}
						break;
					}
				}
				//went all the way through, no matches, so we're going to focus the last field then blur it.
				if(typeof(tf.ccOnBlur) != "function") {
					tf.ccOnBlur = function() {};
				}
					if( tf.ccOnBlur() == false) {
						return false;
					}
			},
			baFields: [],
			addBAFields: function(tiObj) {
				obj.paymentKitUI.baFields.push(tiObj);
			},
			getBAFields: function() {
				return obj.paymentKitUI.baFields;
			},
			verifyBAField: function(tf) {
				if(tf.baVerify == true) {
					if(typeof(tf.baOnFailVerify) != "function") {tf.baOnFailVerify = function() {};}
					switch (tf.baTFType) {
						case 'baUSRouting':
							if(obj.bankAccount.validateRoutingNumber(tf.value, 'US')) {
							} else {
								tf.baOnFailVerify();
							}
							break;
						case 'baCARouting':
							if(obj.bankAccount.validateRoutingNumber(tf.value, 'CA')) {
								obj.paymentKitUI.nextBAField(tf);
							} else {
								tf.baOnFailVerify();
							}
							break;
						case 'baUSAccount':
							if(obj.bankAccount.validateAccountNumber(tf.value, 'US')) {
								obj.paymentKitUI.nextBAField(tf);
							} else {
								tf.baOnFailVerify();
							}
							break;
						case 'baCAAccount':
							if(obj.bankAccount.validateAccountNumber(tf.value, 'CA')) {
								obj.paymentKitUI.nextBAField(tf);
							} else {
								tf.baOnFailVerify();
							}
							break;
					}
				} else {
					obj.paymentKitUI.nextBAField(tf);
				}
			},
			nextBAField: function(tf) {
				for(var _i = 0; _i < obj.paymentKitUI.baFields.length; _i++) {
					if(obj.paymentKitUI.baFields[ _i ] == tf) {
						
						if(typeof(tf.baOnBlur) != "function") {
							tf.baOnBlur = function() {};
						}
							if( tf.baOnBlur() == false) {
								return false;
							}
						
						if( (_i + 1) < obj.paymentKitUI.baFields.length) {
							if( obj.paymentKitUI.baFields[ (_i + 1) ].value.length >= obj.paymentKitUI.baFields[ (_i + 1) ].baMaxLength ) {
								obj.paymentKitUI.nextBAField( obj.paymentKitUI.baFields[ (_i + 1) ] );
								break;
							} else {
								if(typeof(obj.paymentKitUI.baFields[ (_i + 1) ].baOnFocus) != "function") {
									obj.paymentKitUI.baFields[ (_i + 1) ].baOnFocus = function(nextField) {
										nextField.focus();
									};
								}
								obj.paymentKitUI.baFields[ (_i + 1) ].baOnFocus( obj.paymentKitUI.baFields[ (_i + 1) ] );
							}
						} else {
							tf.blur();
						}
						break;
					}
				}
			},
			ccImg: function(im) {
				privateVars.ccImgView = im;
				var cardFrontView = Ti.UI.createImageView({
					image: obj.options.imagePath + 'cc-unknown.png'
				});
					privateVars.ccImgFront = cardFrontView;
				var cardBackBoardView = Ti.UI.createImageView({
					backgroundColor: '#fff'
				});
				var cardBackView = Ti.UI.createImageView({
					image: obj.options.imagePath + 'cc-cvc.png'
				});
					privateVars.ccImgBack = cardBackView;
				Ti.API.info('animate: '+im.flipAnimation);
					obj.paymentKitUI.setupCCFlip(); //titanium animations don't work unless you run them first...
			},
			updateCCImg: function(num) {
				var imgFront = 'cc-unknown.png';
				privateVars.ccImgBack.image = obj.options.imagePath + 'cc-cvc.png';
				switch (obj.card.cardType(num)) {
					case 'Unknown':
						imgFront = 'cc-unknown.png';
						break;
					case 'Visa':
						imgFront = 'cc-visa.png';
						break;
					case 'MasterCard':
						imgFront = 'cc-mastercard.png';
						break;
					case 'American Express':
						imgFront = 'cc-amex.png';
						privateVars.ccImgBack.image = obj.options.imagePath + 'cc-cvc-amex.png';
						break;
					case 'Discover':
						imgFront = 'cc-discover.png';
						break;
					case 'JCB':
						imgFront = 'cc-jcb.png';
						break;
					case 'Diners Club':
						imgFront = 'cc-diners.png';
						break;
				}
				privateVars.ccImgFront.image = obj.options.imagePath + imgFront;
			},
			flipCCImgToBack: function(duration) {
				if( privateVars.ccImgView.flipAnimation != false ) {
					privateVars.ccImgView.animate({
	                    view: privateVars.ccImgBack,
	                    duration: duration,
	                    transition:Ti.UI.iPhone.AnimationStyle.FLIP_FROM_LEFT
	                }, function () {
						
	                });	
				} else {
					//Ti.API.info(obj.options.imagePath + privateVars.ccImgBack);
					//privateVars.ccImgFront.image = obj.options.imagePath + 'cc-cvc.png';
				}
			},
			flipCCImgToCard: function(duration) {
				if( privateVars.ccImgView.flipAnimation != false ) {
					privateVars.ccImgView.animate({
	                    view: privateVars.ccImgFront,
	                    duration: duration,
	                    transition:Ti.UI.iPhone.AnimationStyle.FLIP_FROM_RIGHT
	                }, function () {
	
	                });
               } else {
               		//Ti.API.info(obj.options.imagePath + privateVars.ccImgFront);
               		//privateVars.ccImgFront.image = obj.options.imagePath + privateVars.ccImgFront;
               }
			},
			setupCCFlip: function() {
				privateVars.ccImgView.animate({
                    view: privateVars.ccImgBack,
                    duration: 0,
                    transition:Ti.UI.iPhone.AnimationStyle.FLIP_FROM_LEFT
                }, function () {
                   	privateVars.ccImgView.animate({
	                    view: privateVars.ccImgFront,
	                    duration: 0,
	                    transition:Ti.UI.iPhone.AnimationStyle.FLIP_FROM_RIGHT
	                }, function () {
	                	
	                });
                   	
                });
			},
			ccNumTextField: function(tf) {
				if(tf.ccNextFocus != false) {
					obj.paymentKitUI.addCCFields(tf);
				}
				tf.ccTFType = 'ccNum';
				tf.addEventListener('change', function(e) {
				   var p = e.source.value;
				        p = p.replace(/ /g, '');
				        var pl = p.length;			        		        	
				        obj.paymentKitUI.updateCCImg(p);
				        if(privateVars.versionMajor == 7) {
				        	e.source.value = ''; //this is for ios7
				        }
				   
				   if(e.source.ccStyleNum != false) {
				   	
				   		e.source.ccMaxLength = 19;
				        	
				        if(obj.card.cardType(p) == 'American Express') {
				        	e.source.ccMaxLength = 17;
				        	if(pl >= 15) {
					            e.source.value = p.substr(0,4)+' '+p.substr(4,6)+' '+p.substr(10,5);
					            obj.paymentKitUI.verifyCCField(e.source);
					        } else if(pl >= 11) {
					            e.source.value = p.substr(0,4)+' '+p.substr(4,6)+' '+p.substr(10,5);
					        } else if(pl >= 5) {
					            e.source.value = p.substr(0,4)+' '+p.substr(4,6);
					        } else {
					            e.source.value = p;
					        }
	
				        } else {
				        	
				        	if(obj.card.cardType(p) == 'Diners') {
				        		e.source.ccMaxLength = 17;
				        	}
	
				        	if(pl >= 16) {
					            e.source.value = p.substr(0,4)+' '+p.substr(4,4)+' '+p.substr(8,4)+' '+p.substr(12,4);
					            //obj.paymentKitUI.nextCCField(e.source);
					            obj.paymentKitUI.verifyCCField(e.source);
					        } else if(pl >= 13) {
					            e.source.value = p.substr(0,4)+' '+p.substr(4,4)+' '+p.substr(8,4)+' '+p.substr(12,4);
					            if(obj.card.cardType(p) == 'Diners') {
					            	if(pl >= 14) {
					            		e.source.value = p.substr(0,4)+' '+p.substr(4,4)+' '+p.substr(8,4)+' '+p.substr(12,2);
					            		//obj.paymentKitUI.nextCCField(e.source);
					            		obj.paymentKitUI.verifyCCField(e.source);
					            	}
					            }
					        } else if(pl >= 9) {
					            e.source.value = p.substr(0,4)+' '+p.substr(4,4)+' '+p.substr(8,4);
					        } else if(pl >= 5) {
					            e.source.value = p.substr(0,4)+' '+p.substr(4,4);
					        } else {
					            e.source.value = p;
					        }
	
				        }
				        
					} else {
						
						e.source.ccMaxLength = 16;
						
						//don't style it
						if(obj.card.cardType(p) == 'American Express') {
					    	e.source.ccMaxLength = 15;
					    	if(pl >= 15) {
					    		e.source.value = p.substr(0,15);
					        	obj.paymentKitUI.verifyCCField(e.source);
					    	}
						} else if(obj.card.cardType(p) == 'Diners') {
					    	e.source.ccMaxLength = 14;
					    	if(pl >= 14) {
					    		e.source.value = p.substr(0,14);
					    		obj.paymentKitUI.verifyCCField(e.source);	
					    	}
						} else if(pl >= 16) {
							e.source.value = p.substr(0,16);
					    	obj.paymentKitUI.verifyCCField(e.source);
						} else {
							e.source.value = p;
						}
						
					}

				});
			},
			ccExpTextField: function(tf) {
				if(tf.ccNextFocus != false) {
					obj.paymentKitUI.addCCFields(tf);
				}
				tf.ccTFType = 'ccExp';
				tf.ccMaxLength = 5;
				tf.addEventListener('change', function(e) {
					var p = e.source.value;
						var pt = e.source.value.length;
			        p = p.replace('/', '');
			        var pl = p.length;
			        	if(privateVars.versionMajor == 7) {
				        	e.source.value = ''; //this is for ios7
				        }
			        	
			        if(pl >= 4) {
			        	e.source.value = p.substr(0,2) + '/' + p.substr(2,2);
			            obj.paymentKitUI.verifyCCField(e.source);
			        } else if(pl >= 2) {
			        	if(pl == 2 && e.source.ccLastLength == 3) {
			        		
			        		if(privateVars.versionMajor > 6) {
			        			e.source.value = p.charAt(0);
			        		}
			        		
			        	} else {
			        		e.source.value = p.substr(0,2) + '/' + p.substr(2,2);
			        	}
			        } else if(pl == 1 && (p != 0 && p != 1) && (e.source.ccLastLength == null || e.source.ccLastLength == 0)) {
			        	e.source.value = '0' + p;
			        } else {
			        	e.source.value = p;
			        }
			        e.source.ccLastLength = pt;
			        
				});
				
			},
			ccCVCTextField: function(tf) {
				if(tf.ccNextFocus != false) {
					obj.paymentKitUI.addCCFields(tf);
				}
				tf.ccTFType = 'ccCVC';
				tf.ccMaxLength = 3;
				tf.addEventListener('change', function(e) {
			        var p = e.source.value;
			        var pl = p.length;
			        	if(privateVars.versionMajor == 7) {
				        	e.source.value = ''; //this is for ios7
				        }
				   if(tf.ccCCNum) {
						if(obj.card.cardType( tf.ccCCNum.value ) == 'American Express') {
							tf.ccMaxLength = 4;
						} else {
							tf.ccMaxLength = 3;
						}
					}
			        if(pl >= tf.ccMaxLength) {
			            e.source.value = p.substr(0,tf.ccMaxLength);
			            //obj.paymentKitUI.nextCCField(e.source);
			            obj.paymentKitUI.verifyCCField(e.source);
			        } else {
			        	e.source.value = p;
			        }
				});
				if(tf.ccCCNum != null) {
					if(tf.ccFlipCCImage != false) {
						tf.addEventListener('focus', function(e) {
							obj.paymentKitUI.flipCCImgToBack(obj.options.flipDuration);
						});
						tf.addEventListener('blur', function(e) {
							obj.paymentKitUI.flipCCImgToCard(obj.options.flipDuration);
						});	
					}
				}
			},
			ccUSZipTextField: function(tf) {
				if(tf.ccNextFocus != false) {
					obj.paymentKitUI.addCCFields(tf);
				}
				tf.ccTFType = 'ccUSZip';
				tf.ccMaxLength = 5;
				tf.addEventListener('change', function(e) {
			        var p = e.source.value;
			        var pl = p.length;
			        	if(privateVars.versionMajor == 7) {
				        	e.source.value = ''; //this is for ios7
				        }
			        if(pl >= 5) {
			            e.source.value = p.substr(0,5); //can't be any longer
			            obj.paymentKitUI.verifyCCField(e.source);
			        } else {
			        	e.source.value = p;
			        }
				});
			},
			ccCAZipTextField: function(tf) {
				if(tf.ccNextFocus != false) {
					obj.paymentKitUI.addCCFields(tf);
				}
				tf.ccTFType = 'ccCAZip';
				tf.ccMaxLength = 6;
				tf.addEventListener('change', function(e) {
			        var p = e.source.value;
			        var pl = p.length;
			        	if(privateVars.versionMajor == 7) {
				        	e.source.value = ''; //this is for ios7
				        }
			        if(pl >= 6) {
			            e.source.value = p.substr(0,6); //can't be any longer
			            obj.paymentKitUI.verifyCCField(e.source);
			        } else {
			        	e.source.value = p;
			        }
				});
			},
			ccTextField: function(tf) {
				if(tf.ccNextFocus != false && tf.ccMaxLength != null) {
					obj.paymentKitUI.addCCFields(tf);
				}
				tf.addEventListener('change', function(e) {
			        var p = e.source.value;
			        var pl = p.length;
			        	if(privateVars.versionMajor == 7) {
				        	e.source.value = ''; //this is for ios7
				        }
			        if(pl >= e.source.ccMaxLength) {
			            e.source.value = p.substr(0,e.source.ccMaxLength); //can't be any longer
			            obj.paymentKitUI.nextCCField(e.source);
			        } else {
			        	e.source.value = p;
			        }
				});
			},
			baUSRoutingTextField: function(tf) {
				if(tf.baNextFocus != false) {
					obj.paymentKitUI.addBAFields(tf);
				}
				tf.baTFType = 'baUSRouting';
				tf.baMaxLength = 9;
				tf.addEventListener('change', function(e) {
			        var p = e.source.value;
			        var pl = p.length;
			        	if(privateVars.versionMajor == 7) {
				        	e.source.value = ''; //this is for ios7
				        }
			        if(pl >= 9) {
			            e.source.value = p.substr(0,9); //can't be any longer
			            obj.paymentKitUI.verifyBAField(e.source);
			        } else {
			        	e.source.value = p;
			        }
				});
			},
			baCARoutingTextField: function(tf) {
				if(tf.baNextFocus != false) {
					obj.paymentKitUI.addBAFields(tf);
				}
				tf.baTFType = 'baCARouting';
				tf.baMaxLength = 9;
				tf.addEventListener('change', function(e) {
			        var p = e.source.value.replace('-','');
			        var pl = p.length;
			        	if(privateVars.versionMajor == 7) {
				        	e.source.value = ''; //this is for ios7
				        }
			        if(e.source.baStyleNum != false) {
			        	if(pl >= 8) {
				            e.source.value = p.substr(0,5) + '-' + p.substr(5,3); //can't be any longer
				            obj.paymentKitUI.verifyBAField(e.source);
				        } else if(pl >= 6) {
				        	e.source.value = p.substr(0,5) + '-' + p.substr(5,3);
				        } else {
				        	e.source.value = p;
				        }
			        } else {
			        	if(pl >= 8) {
			        		e.source.value = p.substr(0,8);
			        		obj.paymentKitUI.verifyBAField(e.source);
			        	} else {
			        		e.source.value = p;
			        	}
			        }

				});
			},
			baUSAccountTextField: function(tf) {
				if(tf.baNextFocus != false) {
					obj.paymentKitUI.addBAFields(tf);
				}
				tf.baTFType = 'baUSAccount';
				obj.paymentKitUI.baTextField(tf);
			},
			baCAAccountTextField: function(tf) {
				if(tf.baNextFocus != false) {
					obj.paymentKitUI.addBAFields(tf);
				}
				tf.baTFType = 'baACAAccount';
				obj.paymentKitUI.baTextField(tf);
			},
			baTextField: function(tf) {
				if(tf.baNextFocus != false && tf.baMaxLength != null) {
					obj.paymentKitUI.addCCFields(tf);
				}
				tf.addEventListener('change', function(e) {
			        var p = e.source.value;
			        var pl = p.length;
			        	if(privateVars.versionMajor == 7) {
				        	e.source.value = ''; //this is for ios7
				        }
			        if(pl >= e.source.ccMaxLength) {
			            e.source.value = p.substr(0,e.source.baMaxLength); //can't be any longer
			            obj.paymentKitUI.nextBAField(e.source);
			        } else {
			        	e.source.value = p;
			        }
				});
			}
		}
	};
	return obj;
})();
TiStripe.load();
