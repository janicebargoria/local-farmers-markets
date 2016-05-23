// setup dom elements
var marketmap = document.getElementById('map'),
	geosearch = document.getElementById('geosearch'),
	map,
	infoWindow;

// setup event listeners
geosearch.addEventListener('click', getLocation);

function initMap() {
	// set the feault options for the map on page load
	mapOptions = {
		center: { 
			lat: 39.50, 
			lng: -98.35 
		},
		zoom: 4,
		disableDefaultUI: true,
 		draggable: false,
  		scrollwheel: false,
  		panControl: false		
	}

	// create the google map based on the options 
	map = new google.maps.Map(marketmap, mapOptions);
	bounds = new google.maps.LatLngBounds();

	// creat an info window for map markers
	infoWindow = new google.maps.InfoWindow();

   	google.maps.event.addListener(map, 'click', function() {
    	infoWindow.close();
   });	
}

// Capture user location
function getLocation(event) {
	event.preventDefault();
	
	function success(position) {
		if(!navigator.geolocation) {
			alert("Not supported!");
		}
		var latitude = position.coords.latitude,
			longitude = position.coords.longitude;
	
		getLocalMarkets(latitude, longitude);			
	}

	function error() {
		alert("There was a problem");
	}
	navigator.geolocation.getCurrentPosition(success, error);
}

// request list of local farmers markets 
function getLocalMarkets(latitude, longitude) {
	var xhr = new XMLHttpRequest(),
		xhrURL = "http://search.ams.usda.gov/farmersmarkets/v1/data.svc/locSearch?lat=" + latitude + "&lng=" + longitude;  

	xhr.open('GET', xhrURL);
	xhr.onreadystatechange = function() {
		if (xhr.readyState === 4) {
			var marketSearch = JSON.parse(xhr.responseText);
			getMarketDetails(marketSearch);
		}
	}	
	xhr.send();	
}

// request individual farmers market information
function getMarketDetails(marketSearch) {
	var marketID = [],	
		latlng;
	
	// push each market id to the marketID array
	for (var i = 0; i < marketSearch.results.length; i++) {
		marketID.push(marketSearch.results[i].id);
		
	}

	// using the aquired marketid make a new api call to access market details
	function submitID(marketID) {	
		var xhr = new XMLHttpRequest(),
			xhrURL = xhrURL = "http://search.ams.usda.gov/farmersmarkets/v1/data.svc/mktDetail?id=" + marketID;
		xhr.open('GET', xhrURL);
		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4) {
				var marketDetails = JSON.parse(xhr.responseText);
				extractDetails(marketDetails);
			}
		}
		xhr.send();		
	}
	marketID.forEach(submitID);

	// convert returned market api data in latitude and logitude markers to be placed on google maps
	function extractDetails(marketDetails) {
		var googlelink = marketDetails['marketdetails']['GoogleLink'],
			latLong = decodeURIComponent(googlelink.substring(googlelink.indexOf("=")+1, googlelink.lastIndexOf("("))),
			splitcoords = latLong.split(','),
			latitude = parseFloat(splitcoords[0]),
			longitude = parseFloat(splitcoords[1]),
			latlng = new google.maps.LatLng(latitude, longitude),	
			address = marketDetails['marketdetails']['Address'],
			products = marketDetails['marketdetails']['Products'],
			schedule = marketDetails['marketdetails']['Schedule'];
			createMarker(latlng, address, products, schedule);
	}
}


// create markers and extend the bounds of the Google map to fit all markers
function createMarker(latlng, address, products, schedule) {
	bounds.extend(latlng);
	map.fitBounds(bounds);
	var marker = new google.maps.Marker({
		map: map,
		position: latlng

	});

	google.maps.event.addListener(marker, 'click', function() {
	  
	// Creating the content to be inserted in the infowindow
	var infoWindowContent =
	   	'<div class="markerInfo">' +
	   		'<h5>Address: </h5>' +
			'<p>' + address + '</p>' + 
			'<h5>Products Available: </h5>' +
			'<p>' + products + '</p>' + 
			'<h5>Schedule: </h5>' +
			'<p>' + schedule + '</p>' + 
		'</div>';
	  
	// including content to the Info Window.
	infoWindow.setContent(infoWindowContent);

	// opening the Info Window in the current map and at the current marker location.
	infoWindow.open(map, marker);
	});   
}








