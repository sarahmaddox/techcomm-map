var DATA_SERVICE_URL = "https://script.google.com/macros/s/AKfycbx75GBiRRl9qUyNMCH-BtDbOc4-g0WZSgCnqhvi6YvhCxYpJ1kJ/exec?jsonp=callback";
var DEFAULT_ZOOM = 2;
var AUTO_ZOOM = 14;
var userZoom = DEFAULT_ZOOM;
var map;
var checkboxes = {};
var infoWindow = new google.maps.InfoWindow({
  pixelOffset: new google.maps.Size(0, -10),
  disableAutoPan: true
});
var markerClicked = false;
var previousName;

// This function is called after the page has loaded, to set up the map.
function initializeMap() {
  map = new google.maps.Map(document.getElementById("map-canvas"), {
    center: {lat: 35.55, lng: 16.50},
    zoom: DEFAULT_ZOOM,
    panControl: false,
    streetViewControl: true,
    streetViewControlOptions: {
      position: google.maps.ControlPosition.LEFT_BOTTOM
    },
    zoomControl: true,
    zoomControlOptions: {
      position: google.maps.ControlPosition.LEFT_BOTTOM
    }
  });
  restyle();
  setEventHandlers();

  // Insert a script element into the document header, to get
  // the tech comm data from a Google Docs spreadsheet.
  var scriptElement = document.createElement('script');
  scriptElement.src = DATA_SERVICE_URL;
  document.getElementsByTagName('head')[0].appendChild(scriptElement);

  // Add the search box and data type selectors to the UI.
  var input = /** @type {HTMLInputElement} */(
    document.getElementById('place-search'));

  var types = document.getElementById('type-selector');
  var branding = document.getElementById('branding');
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(branding);
  map.controls[google.maps.ControlPosition.LEFT_TOP].push(types);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

  var autocomplete = new google.maps.places.Autocomplete(input);

  // When the user searches for and selects a place, zoom in and add a marker.
  var searchMarker = new google.maps.Marker({
    map: map,
    visible: false,
  });

  autocomplete.addListener('place_changed', function() {
    searchMarker.setVisible(false);
    var place = autocomplete.getPlace();
    if (!place.geometry) {
      return;
    }

    // If the place has a geometry, then show it on the map.
    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(AUTO_ZOOM);
    }
    searchMarker.setIcon(/** @type {google.maps.Icon} */({
      url: place.icon,
      size: new google.maps.Size(71, 71),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(17, 34),
      scaledSize: new google.maps.Size(35, 35)
    }));
    searchMarker.setPosition(place.geometry.location);
    searchMarker.setVisible(true);
  });
}

// Get the data from the tech comm spreadsheet.
function callback(data) {
  // Get the spreadsheet rows one by one.
  // First row contains headings, so start the index at 1 not 0.
  for (var i = 1; i < data.length; i++) {
    map.data.add({
      properties: {
        type: data[i][0],
        name: data[i][1],
        description: data[i][2],
        website: data[i][3],
        startdate: data[i][4],
        enddate: data[i][5],
        address: data[i][6]
      },
      geometry: {
        lat: data[i][7], 
        lng: data[i][8]
      }
    });
  }
}

// Set up data styling
function restyle() {
  map.data.setStyle(function(feature) {
    var style = {};
    var type = feature.getProperty('type');

    // Show the markers for this type if
    // the user has selected the corresponding checkbox.
    style.visible = (checkboxes[type] != false);

    //Style a marker based on type of tech comm item.
    switch (type) {
      case 'Conference':
        style.icon = {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#c077f1',
          fillOpacity: 1,
          strokeColor: '#a347e1',
          strokeWeight: 3,
          scale: 10
        };
        break;
      case 'Society':
        style.icon = {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#f6bb2e',
          fillOpacity: 1,
          strokeColor: '#ee7b0c',
          strokeWeight: 3,
          scale: 10
        };
        break;
      case 'Group':
        style.icon = {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#ee4bf3',
          fillOpacity: 1,
          strokeColor: '#ff00ff',
          strokeWeight: 3,
          scale: 10
        };
        break;
      case 'Business':
        style.icon = {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#1ab61a',
          fillOpacity: 1,
          strokeColor: '#008000',
          strokeWeight: 3,
          scale: 10
        };
        break;
      default:
        style.icon = {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#017cff',
          fillOpacity: 1,
          strokeColor: '#0000ff',
          strokeWeight: 3,
          scale: 10
        };
    }
    return style;
  });
}

function setEventHandlers() {
  // Show an info window when the user clicks an item.
  map.data.addListener('click', handleClick);

  // Show an info window when the mouse hovers over an item.
  map.data.addListener('mouseover', handleHover);

  // Close the info window when the mouse leaves an item.
  map.data.addListener('mouseout', handleMouseOut);

  // Reset the click flag when the user closes the info window.
  google.maps.event.addListener(infoWindow, 'closeclick', function() {
    markerClicked = false;
  });
}

// Create a popup window containing the tech comm info.
function createInfoWindow(feature) {
  infoWindow.setPosition(feature.getGeometry().get());
  infoWindow.setContent('No information found');
  var content = '<div id="infowindow" class="infowindow">' +
      '<h2>' + feature.getProperty('name') + '</h2>' +
      '<p><em>' + feature.getProperty('type') + '</em>';
  if (feature.getProperty('website') != '') {
    content = content + '  (' + feature.getProperty('website') + ')';
  }
  content = content + '</p>' +
    '<p>' + feature.getProperty('description') + '</p>';
  if (feature.getProperty('startdate') != '') {
    content = content + '<p>' + feature.getProperty('startdate');
  }
  if (feature.getProperty('enddate') != '') {
    content = content + ' - ' + feature.getProperty('enddate');
  }

  content = content + '</p>' + '<p>' + feature.getProperty('address') +
    '</p>' + '</div>';

  infoWindow.setContent(content);
}

// On hover over marker, show the popup window.
function handleHover(event) {
  // Create info window
  createInfoWindow(event.feature);

  // Open the info window.
  infoWindow.open(map);
}

// On click of marker, show the popup window and zoom in.
function handleClick(event) {
  // Check whether the marker has been clicked already,
  // because we want to zoom out on second click of same marker.
  var currentName = event.feature.getProperty('name');
  if (currentName == previousName) {
    // This is the second click, so zoom back to user's previous zoom level.
    map.setZoom(userZoom);
    // Reset flags ready for next time round.
    previousName = '';
    markerClicked = false;
  }
  else {
    previousName = event.feature.getProperty('name'); 
    // This is the first click, so show the popup window and zoom in.
    createInfoWindow(event.feature);

    // Zoom in before opening the info window.
    // If the user has already zoomed in beyond our automatic zoom,
    // leave their zoom setting untouched.
    if (map.getZoom() > AUTO_ZOOM) {
      userZoom = map.getZoom();
    }
    else {
      map.setZoom(AUTO_ZOOM);
      map.setCenter(event.feature.getGeometry().get());
      userZoom = DEFAULT_ZOOM;
    }

    // Open the info window and reset flag ready for next time round.
    infoWindow.open(map);
    markerClicked = true;
  }
}

// Close the popup window, if it was opened on hover.
function handleMouseOut() {
  if (!markerClicked) {
    infoWindow.close();
  }
}

// Respond to change in conference selector.
function hideShowConferences(checkBox) {
  checkboxes['Conference'] = checkBox.checked;
  restyle();
}

// Respond to change in society selector.
function hideShowSocieties(checkBox) {
  checkboxes['Society'] = checkBox.checked;
  restyle();
}

// Respond to change in group selector.
function hideShowGroups(checkBox) {
  checkboxes['Group'] = checkBox.checked;
  restyle();
}

// Respond to change in business selector.
function hideShowBusinesses(checkBox) {
  checkboxes['Business'] = checkBox.checked;
  restyle();
}

// Respond to change in type 'other' selector.
function hideShowOther(checkBox) {
  checkboxes['Other'] = checkBox.checked;
  restyle();
}

// Load the map.
google.maps.event.addDomListener(window, 'load', initializeMap);
