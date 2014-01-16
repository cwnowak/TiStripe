
// this sets the background color of the master UIView (when there are no windows/tab groups on it)
Titanium.UI.setBackgroundColor('#000');

// create tab group
var tabGroup = Titanium.UI.createTabGroup();


//
// create base UI tab and root window
//
var win1 = Titanium.UI.createWindow({  
    title:'CC',
    backgroundColor:'#fff'
});
var tab1 = Titanium.UI.createTab({  
    icon:'KS_nav_views.png',
    title:'CC',
    window:win1
});

var label1 = Titanium.UI.createLabel({
	color:'#999',
	text:'Click to open window',
	font:{fontSize:20,fontFamily:'Helvetica Neue'},
	textAlign:'center',
	width:'auto'
});
	
	label1.addEventListener('click', function() {
		var stripeCCWin = Titanium.UI.createWindow({  
		    navBarHidden: false,
		    title:'Credit Cards',
		    backgroundColor:'#fff',
		    url: 'stripe-test.js'
		   // url:'stripe-cc.js',
		});
		
		var navWin = Ti.UI.iOS.createNavigationWindow({
		    modal: true,
			window: stripeCCWin
		});
		
		stripeCCWin.navWin = navWin;
		
		navWin.open({modal:true});
	});

win1.add(label1);



var win4 = Titanium.UI.createWindow({  
    title:'Slider',
    backgroundColor:'#fff'
});
var tab4 = Titanium.UI.createTab({  
    icon:'KS_nav_views.png',
    title:'Slider',
    window:win4
});

var label4 = Titanium.UI.createLabel({
	color:'#999',
	text:'Click to open window',
	font:{fontSize:20,fontFamily:'Helvetica Neue'},
	textAlign:'center',
	width:'auto'
});

	label4.addEventListener('click', function() {
		var stripeSlideWin = Titanium.UI.createWindow({  
		    navBarHidden: false,
		    title:'Slide',
		    backgroundColor:'#fff',
		    url:'stripe-slide.js',
		});
		stripeSlideWin.open({modal:true});
	});

win4.add(label4);



//
// create controls tab and root window
//
var win2 = Titanium.UI.createWindow({  
    title:'CA Bank',
    backgroundColor:'#fff'
});
var tab2 = Titanium.UI.createTab({  
    icon:'KS_nav_ui.png',
    title:'CA Bank',
    window:win2
});

var label2 = Titanium.UI.createLabel({
	color:'#999',
	text:'Click to open window',
	font:{fontSize:20,fontFamily:'Helvetica Neue'},
	textAlign:'center',
	width:'auto'
});

	label2.addEventListener('click', function() {
		var stripeBAWin = Titanium.UI.createWindow({  
		    navBarHidden: false,
		    title:'Bank Accounts',
		    backgroundColor:'#fff',
		    url:'stripe-ba-ca.js',
		});
		stripeBAWin.open({modal:true});
	});

win2.add(label2);



var win3 = Titanium.UI.createWindow({  
    title:'US Bank',
    backgroundColor:'#fff'
});
var tab3 = Titanium.UI.createTab({  
    icon:'KS_nav_ui.png',
    title:'US Bank',
    window:win3
});

var label3 = Titanium.UI.createLabel({
	color:'#999',
	text:'Click to open window',
	font:{fontSize:20,fontFamily:'Helvetica Neue'},
	textAlign:'center',
	width:'auto'
});

	label3.addEventListener('click', function() {
		var stripeBAUSWin = Titanium.UI.createWindow({  
		    navBarHidden: false,
		    title:'Bank US',
		    backgroundColor:'#fff',
		    url:'stripe-ba-us.js',
		});
		stripeBAUSWin.open({modal:true});
	});

win3.add(label3);








//
//  add tabs
//
tabGroup.addTab(tab1);  
tabGroup.addTab(tab4);  
tabGroup.addTab(tab2);  
tabGroup.addTab(tab3); 



// open tab group
tabGroup.open();
