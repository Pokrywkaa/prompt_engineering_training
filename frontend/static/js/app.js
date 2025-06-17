// Constants
const CONFIG = {
    WROCLAW_CENTER: [51.1079, 17.0385],
    DEFAULT_ZOOM: 13,
    MAX_ZOOM: 18,
    TILE_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    TILE_ATTRIBUTION: '© OpenStreetMap contributors',
    API_BASE_URL: 'http://127.0.0.1:5002/public_transport/city/Wroclaw',
    MARKER_ICONS: {
        start: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        end: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        departure: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadow: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png'
    },
    MARKER_SIZE: [25, 41],
    MARKER_ANCHOR: [12, 41],
    POPUP_ANCHOR: [1, -34],
    SHADOW_SIZE: [41, 41]
};

const MESSAGES = {
    NO_DEPARTURES: 'No departures found for the selected route.',
    SELECT_POINTS: 'Please select both start and destination points on the map.',
    SELECT_START: '📍 Select START point first',
    SELECT_DESTINATION: '📍 Select DESTINATION point',
    SEARCHING: '🔄 Searching...',
    FIND_DEPARTURES: '🔍 Find Departures',
    SEARCH_ERROR: 'Failed to search departures. Please try again.',
    TRIP_DETAILS_ERROR: 'Failed to load trip details. Please try again.'
};

// API Service
class PublicTransportAPI {
    static async getClosestDepartures(startCoords, endCoords, startTime, limit) {
        const params = new URLSearchParams({
            start_coordinates: `${startCoords.lat},${startCoords.lng}`,
            end_coordinates: `${endCoords.lat},${endCoords.lng}`,
            start_time: startTime,
            limit: limit
        });

        const response = await fetch(`${CONFIG.API_BASE_URL}/closest_departures?${params}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    static async getTripDetails(tripId) {
        // Ensure proper URL construction with explicit path segments
        const baseUrl = CONFIG.API_BASE_URL.replace(/\/$/, ''); // Remove trailing slash if present
        const url = `${baseUrl}/trip/${tripId}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }
}

// Map Management Class
class MapManager {
    constructor() {
        this.map = null;
        this.startMarker = null;
        this.endMarker = null;
        this.startCoords = null;
        this.endCoords = null;
        this.departureMarkers = [];
    }

    initialize() {
        this.map = L.map('map').setView(CONFIG.WROCLAW_CENTER, CONFIG.DEFAULT_ZOOM);

        L.tileLayer(CONFIG.TILE_URL, {
            attribution: CONFIG.TILE_ATTRIBUTION,
            maxZoom: CONFIG.MAX_ZOOM
        }).addTo(this.map);

        this.map.on('click', (e) => this.handleMapClick(e.latlng));
        this.addLegend();
    }

    addLegend() {
        const legend = L.control({ position: 'topright' });

        legend.onAdd = () => {
            const div = L.DomUtil.create('div', 'legend');
            Object.assign(div.style, {
                backgroundColor: 'white',
                padding: '10px',
                border: '2px solid #ccc',
                borderRadius: '5px',
                fontSize: '12px'
            });

            div.innerHTML = `
                <strong>Map Instructions:</strong><br>
                🟢 Click for <strong>START</strong> point<br>
                🔴 Click for <strong>END</strong> point<br>
                🚌 Departure stops will appear here
            `;

            return div;
        };

        legend.addTo(this.map);
    }

    handleMapClick(latlng) {
        if (!this.startCoords) {
            this.setStartPoint(latlng);
        } else if (!this.endCoords) {
            this.setEndPoint(latlng);
        } else {
            this.clearMarkers();
            this.setStartPoint(latlng);
        }
    }

    createMarkerIcon(iconType) {
        return L.icon({
            iconUrl: CONFIG.MARKER_ICONS[iconType],
            shadowUrl: CONFIG.MARKER_ICONS.shadow,
            iconSize: CONFIG.MARKER_SIZE,
            iconAnchor: CONFIG.MARKER_ANCHOR,
            popupAnchor: CONFIG.POPUP_ANCHOR,
            shadowSize: CONFIG.SHADOW_SIZE
        });
    }

    setStartPoint(latlng) {
        if (this.startMarker) {
            this.map.removeLayer(this.startMarker);
        }

        this.startCoords = latlng;
        this.startMarker = L.marker([latlng.lat, latlng.lng], {
            icon: this.createMarkerIcon('start')
        }).addTo(this.map);

        this.startMarker.bindPopup(
            `<strong>START</strong><br>Lat: ${latlng.lat.toFixed(4)}<br>Lng: ${latlng.lng.toFixed(4)}`
        ).openPopup();
    }

    setEndPoint(latlng) {
        if (this.endMarker) {
            this.map.removeLayer(this.endMarker);
        }

        this.endCoords = latlng;
        this.endMarker = L.marker([latlng.lat, latlng.lng], {
            icon: this.createMarkerIcon('end')
        }).addTo(this.map);

        this.endMarker.bindPopup(
            `<strong>DESTINATION</strong><br>Lat: ${latlng.lat.toFixed(4)}<br>Lng: ${latlng.lng.toFixed(4)}`
        ).openPopup();
    }

    clearMarkers() {
        if (this.startMarker) {
            this.map.removeLayer(this.startMarker);
            this.startMarker = null;
            this.startCoords = null;
        }
        if (this.endMarker) {
            this.map.removeLayer(this.endMarker);
            this.endMarker = null;
            this.endCoords = null;
        }
        this.clearDepartureMarkers();
    }

    clearDepartureMarkers() {
        this.departureMarkers.forEach(marker => this.map.removeLayer(marker));
        this.departureMarkers = [];
    }

    addDepartureMarkers(departures, onMarkerClick) {
        this.clearDepartureMarkers();

        departures.forEach((departure) => {
            const marker = L.marker([
                departure.stop.coordinates.latitude,
                departure.stop.coordinates.longitude
            ], {
                icon: this.createMarkerIcon('departure')
            }).addTo(this.map);

            // Handle both time formats: ISO datetime or just time string
            let departureTimeDisplay;
            const departureTimeValue = departure.stop.departure_time;

            if (departureTimeValue.includes('T')) {
                // ISO datetime format
                const departureTime = new Date(departureTimeValue);
                departureTimeDisplay = departureTime.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'});
            } else {
                // Just time format (e.g., "10:00:00")
                departureTimeDisplay = departureTimeValue.substring(0, 5); // Extract HH:MM
            }

            marker.bindPopup(`
                <strong>${departure.stop.name}</strong><br>
                Route: <span style="background: #3498db; color: white; padding: 2px 6px; border-radius: 3px;">${departure.route_id}</span><br>
                → ${departure.trip_headsign}<br>
                <strong>Departure: ${departureTimeDisplay}</strong><br>
                <small>Click for trip details</small>
            `);

            marker.on('click', () => onMarkerClick(departure.trip_id));
            this.departureMarkers.push(marker);
        });
    }

    hasValidRoute() {
        return this.startCoords && this.endCoords;
    }

    getRouteCoordinates() {
        return {
            start: this.startCoords,
            end: this.endCoords
        };
    }
}

// UI Manager Class
class UIManager {
    constructor() {
        this.searchButton = document.getElementById('searchBtn');
        this.departuresList = document.getElementById('departuresList');
        this.timeInput = document.getElementById('startTime');
        this.limitInput = document.getElementById('limit');
    }

    updateSearchButtonState(hasValidRoute) {
        if (hasValidRoute) {
            this.searchButton.disabled = false;
            this.searchButton.textContent = MESSAGES.FIND_DEPARTURES;
            this.searchButton.style.backgroundColor = '#3498db';
        } else {
            this.searchButton.disabled = true;
            this.searchButton.textContent = MESSAGES.SELECT_START;
            this.searchButton.style.backgroundColor = '#95a5a6';
        }
    }

    setSearchButtonLoading(isLoading) {
        if (isLoading) {
            this.searchButton.textContent = MESSAGES.SEARCHING;
            this.searchButton.disabled = true;
        } else {
            this.searchButton.textContent = MESSAGES.FIND_DEPARTURES;
            this.searchButton.disabled = false;
        }
    }

    displayDepartures(departures, onDepartureClick) {
        if (!departures || departures.length === 0) {
            this.departuresList.innerHTML = `<div class="status">${MESSAGES.NO_DEPARTURES}</div>`;
            return;
        }

        const departureItems = departures.map((departure, index) => {
            // Handle both time formats: ISO datetime or just time string
            let departureTimeDisplay;
            const departureTimeValue = departure.stop.departure_time;

            if (departureTimeValue.includes('T')) {
                // ISO datetime format
                const departureTime = new Date(departureTimeValue);
                departureTimeDisplay = departureTime.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'});
            } else {
                // Just time format (e.g., "10:00:00")
                departureTimeDisplay = departureTimeValue.substring(0, 5); // Extract HH:MM
            }

            return `
                <div class="departure-item" data-index="${index}" style="cursor: pointer;">
                    <div class="route">${departure.route_id}</div>
                    <h4>${departure.stop.name}</h4>
                    <div class="destination">→ ${departure.trip_headsign}</div>
                    <div class="time">
                        Departure: ${departureTimeDisplay}
                    </div>
                    <div style="font-size: 12px; color: #7f8c8d; margin-top: 5px;">
                        Trip ID: ${departure.trip_id}
                    </div>
                </div>
            `;
        }).join('');

        this.departuresList.innerHTML = departureItems;

        // Add click handlers
        this.departuresList.querySelectorAll('.departure-item').forEach((item, index) => {
            item.addEventListener('click', () => onDepartureClick(departures[index].trip_id));
        });
    }

    displayError(message) {
        this.departuresList.innerHTML = `<div class="status" style="color: #e74c3c;">${message}</div>`;
    }

    getSearchParameters() {
        return {
            startTime: new Date(this.timeInput.value).toISOString(),
            limit: this.limitInput.value
        };
    }

    setDefaultTime() {
        const now = new Date();
        const timeString = now.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
        this.timeInput.value = timeString;
    }
}

// Main Application Class
class PublicTransportApp {
    constructor() {
        this.mapManager = new MapManager();
        this.uiManager = new UIManager();
        this.init();
    }

    init() {
        this.mapManager.initialize();
        this.setupEventListeners();
        this.uiManager.setDefaultTime();
        this.updateUI();
    }

    setupEventListeners() {
        this.uiManager.searchButton.addEventListener('click', () => this.searchDepartures());

        // Update UI when map state changes
        this.mapManager.map.on('click', () => {
            setTimeout(() => this.updateUI(), 0); // Delay to ensure markers are updated
        });
    }

    updateUI() {
        this.uiManager.updateSearchButtonState(this.mapManager.hasValidRoute());
    }

    async searchDepartures() {
        if (!this.mapManager.hasValidRoute()) {
            alert(MESSAGES.SELECT_POINTS);
            return;
        }

        this.uiManager.setSearchButtonLoading(true);

        try {
            const { start, end } = this.mapManager.getRouteCoordinates();
            const { startTime, limit } = this.uiManager.getSearchParameters();

            const data = await PublicTransportAPI.getClosestDepartures(start, end, startTime, limit);

            // Handle both response formats: direct array or wrapped in departures property
            const departures = Array.isArray(data) ? data : data.departures;

            this.uiManager.displayDepartures(departures, (tripId) => this.showTripDetails(tripId));
            this.mapManager.addDepartureMarkers(departures, (tripId) => this.showTripDetails(tripId));

        } catch (error) {
            console.error('Error searching departures:', error);
            this.uiManager.displayError(MESSAGES.SEARCH_ERROR);
        } finally {
            this.uiManager.setSearchButtonLoading(false);
        }
    }

    async showTripDetails(tripId) {
        try {
            const data = await PublicTransportAPI.getTripDetails(tripId);
            this.displayTripRoute(data.trip_details);
        } catch (error) {
            console.error('Error fetching trip details:', error);
            alert(MESSAGES.TRIP_DETAILS_ERROR);
        }
    }

    displayTripRoute(tripDetails) {
        // Placeholder for route visualization
        // In a full implementation, you would draw the route on the map
        alert(`Trip Route: ${tripDetails.trip_headsign}\nStops: ${tripDetails.stops.length}\nRoute ID: ${tripDetails.route_id}`);
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PublicTransportApp();
});