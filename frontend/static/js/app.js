// Global variables
let map;
let startMarker = null;
let endMarker = null;
let startCoords = null;
let endCoords = null;
let departureMarkers = [];

// Initialize the map when the page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    setupEventListeners();
    setDefaultTime();
});

function initializeMap() {
    // Initialize map centered on Wrocław
    map = L.map('map').setView([51.1079, 17.0385], 13);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);

    // Add click handler for map
    map.on('click', function(e) {
        handleMapClick(e.latlng);
    });

    // Add legend
    addMapLegend();
}

function addMapLegend() {
    const legend = L.control({position: 'topright'});

    legend.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'legend');
        div.style.backgroundColor = 'white';
        div.style.padding = '10px';
        div.style.border = '2px solid #ccc';
        div.style.borderRadius = '5px';
        div.style.fontSize = '12px';

        div.innerHTML = `
            <strong>Map Instructions:</strong><br>
            🟢 Click for <strong>START</strong> point<br>
            🔴 Click for <strong>END</strong> point<br>
            🚌 Departure stops will appear here
        `;

        return div;
    };

    legend.addTo(map);
}

function handleMapClick(latlng) {
    if (!startCoords) {
        // Set start point
        setStartPoint(latlng);
    } else if (!endCoords) {
        // Set end point
        setEndPoint(latlng);
    } else {
        // Reset and set new start point
        clearMarkers();
        setStartPoint(latlng);
    }
}

function setStartPoint(latlng) {
    if (startMarker) {
        map.removeLayer(startMarker);
    }

    startCoords = latlng;
    startMarker = L.marker([latlng.lat, latlng.lng], {
        icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        })
    }).addTo(map);

    startMarker.bindPopup(`<strong>START</strong><br>Lat: ${latlng.lat.toFixed(4)}<br>Lng: ${latlng.lng.toFixed(4)}`).openPopup();

    updateSearchButtonState();
}

function setEndPoint(latlng) {
    if (endMarker) {
        map.removeLayer(endMarker);
    }

    endCoords = latlng;
    endMarker = L.marker([latlng.lat, latlng.lng], {
        icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        })
    }).addTo(map);

    endMarker.bindPopup(`<strong>DESTINATION</strong><br>Lat: ${latlng.lat.toFixed(4)}<br>Lng: ${latlng.lng.toFixed(4)}`).openPopup();

    updateSearchButtonState();
}

function clearMarkers() {
    if (startMarker) {
        map.removeLayer(startMarker);
        startMarker = null;
        startCoords = null;
    }
    if (endMarker) {
        map.removeLayer(endMarker);
        endMarker = null;
        endCoords = null;
    }
    clearDepartureMarkers();
    updateSearchButtonState();
}

function clearDepartureMarkers() {
    departureMarkers.forEach(marker => {
        map.removeLayer(marker);
    });
    departureMarkers = [];
}

function updateSearchButtonState() {
    const searchBtn = document.getElementById('searchBtn');
    if (startCoords && endCoords) {
        searchBtn.disabled = false;
        searchBtn.textContent = '🔍 Find Departures';
        searchBtn.style.backgroundColor = '#3498db';
    } else {
        searchBtn.disabled = true;
        if (!startCoords) {
            searchBtn.textContent = '📍 Select START point first';
        } else {
            searchBtn.textContent = '📍 Select DESTINATION point';
        }
        searchBtn.style.backgroundColor = '#95a5a6';
    }
}

function setupEventListeners() {
    document.getElementById('searchBtn').addEventListener('click', searchDepartures);
}

function setDefaultTime() {
    const now = new Date();
    const timeInput = document.getElementById('startTime');

    // Format datetime for input field (YYYY-MM-DDTHH:MM)
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    timeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
}

async function searchDepartures() {
    if (!startCoords || !endCoords) {
        alert('Please select both start and destination points on the map.');
        return;
    }

    const searchBtn = document.getElementById('searchBtn');
    const originalText = searchBtn.textContent;
    searchBtn.textContent = '🔄 Searching...';
    searchBtn.disabled = true;

    try {
        const startTime = document.getElementById('startTime').value;
        const limit = document.getElementById('limit').value;

        // Convert datetime-local to ISO format
        const isoStartTime = new Date(startTime).toISOString();

        const params = new URLSearchParams({
            start_coordinates: `${startCoords.lat},${startCoords.lng}`,
            end_coordinates: `${endCoords.lat},${endCoords.lng}`,
            start_time: isoStartTime,
            limit: limit
        });

        const response = await fetch(`/public_transport/city/Wroclaw/closest_departures?${params}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        displayDepartures(data.departures);
        addDepartureMarkersToMap(data.departures);

    } catch (error) {
        console.error('Error searching departures:', error);
        displayError('Failed to search departures. Please try again.');
    } finally {
        searchBtn.textContent = originalText;
        searchBtn.disabled = false;
    }
}

function displayDepartures(departures) {
    const departuresList = document.getElementById('departuresList');

    if (!departures || departures.length === 0) {
        departuresList.innerHTML = '<div class="status">No departures found for the selected route.</div>';
        return;
    }

    let html = '';
    departures.forEach((departure, index) => {
        const arrivalTime = new Date(departure.stop.arrival_time);
        const departureTime = new Date(departure.stop.departure_time);

        html += `
            <div class="departure-item" data-index="${index}">
                <div class="route">${departure.route_id}</div>
                <h4>${departure.stop.name}</h4>
                <div class="destination">→ ${departure.trip_headsign}</div>
                <div class="time">
                    Departure: ${departureTime.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}
                </div>
                <div style="font-size: 12px; color: #7f8c8d; margin-top: 5px;">
                    Trip ID: ${departure.trip_id}
                </div>
            </div>
        `;
    });

    departuresList.innerHTML = html;

    // Add click handlers for departure items
    document.querySelectorAll('.departure-item').forEach((item, index) => {
        item.addEventListener('click', () => showTripDetails(departures[index].trip_id));
        item.style.cursor = 'pointer';
    });
}

function addDepartureMarkersToMap(departures) {
    clearDepartureMarkers();

    departures.forEach((departure, index) => {
        const marker = L.marker([
            departure.stop.coordinates.latitude,
            departure.stop.coordinates.longitude
        ], {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        }).addTo(map);

        const departureTime = new Date(departure.stop.departure_time);
        marker.bindPopup(`
            <strong>${departure.stop.name}</strong><br>
            Route: <span style="background: #3498db; color: white; padding: 2px 6px; border-radius: 3px;">${departure.route_id}</span><br>
            → ${departure.trip_headsign}<br>
            <strong>Departure: ${departureTime.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}</strong><br>
            <small>Click for trip details</small>
        `);

        marker.on('click', () => showTripDetails(departure.trip_id));

        departureMarkers.push(marker);
    });
}

async function showTripDetails(tripId) {
    try {
        const response = await fetch(`/public_transport/city/Wroclaw/trip/${tripId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        displayTripRoute(data.trip_details);

    } catch (error) {
        console.error('Error fetching trip details:', error);
        alert('Failed to load trip details. Please try again.');
    }
}

function displayTripRoute(tripDetails) {
    // This is a placeholder for route visualization
    // In a full implementation, you would draw the route on the map
    alert(`Trip Route: ${tripDetails.trip_headsign}\nStops: ${tripDetails.stops.length}\nRoute ID: ${tripDetails.route_id}`);
}

function displayError(message) {
    const departuresList = document.getElementById('departuresList');
    departuresList.innerHTML = `<div class="status" style="color: #e74c3c;">${message}</div>`;
}