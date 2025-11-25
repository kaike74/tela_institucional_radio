/**
 * Map Module
 * Handles Brazil OpenStreetMap rendering and animated pings using Leaflet.js
 */

const MapManager = (function() {
    'use strict';

    // DOM Element References
    const elements = {
        mapContainer: null,
        pingsContainer: null,
    };

    // Map configuration
    const config = {
        leafletJS: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
        leafletCSS: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    };

    // Geographic bounds for Brazil (approximate)
    const BRAZIL_BOUNDS = {
        minLat: -33.75, // Southernmost point
        maxLat: 5.27,   // Northernmost point
        minLng: -73.99, // Westernmost point
        maxLng: -28.84, // Easternmost point
    };

    // State
    let mapLoaded = false;
    let currentPings = [];
    let mapDimensions = { width: 0, height: 0 };
    let leafletMap = null;
    let leafletMarkers = [];

    /**
     * Loads an external script dynamically
     * @param {string} src - Script URL
     * @returns {Promise<void>}
     */
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Loads an external CSS file dynamically
     * @param {string} href - CSS URL
     * @returns {Promise<void>}
     */
    function loadCSS(href) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (document.querySelector(`link[href="${href}"]`)) {
                resolve();
                return;
            }
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    /**
     * Initializes the map module
     */
    function init() {
        elements.mapContainer = document.getElementById('mapContainer');
        elements.pingsContainer = document.getElementById('pingsContainer');

        if (!elements.mapContainer || !elements.pingsContainer) {
            console.error('Required map elements not found');
            return;
        }

        console.log('MapManager initialized');
    }

    /**
     * Loads OpenStreetMap using Leaflet.js
     * @returns {Promise<void>}
     */
    async function loadOpenStreetMap() {
        // Load Leaflet CSS first, then JS
        await loadCSS(config.leafletCSS);
        await loadScript(config.leafletJS);

        // Clear container and set id for Leaflet
        elements.mapContainer.innerHTML = '';
        elements.mapContainer.id = 'leaflet-map';

        // Create Leaflet map centered on Brazil
        leafletMap = L.map('leaflet-map', {
            center: [-14.235, -51.925], // Centro do Brasil
            zoom: 4,
            zoomControl: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
            keyboard: false,
            dragging: false,
            attributionControl: false,
        });

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '',
            maxZoom: 18,
        }).addTo(leafletMap);

        mapLoaded = true;

        console.log('OpenStreetMap loaded successfully');
    }

    /**
     * Loads SVG map from file or creates inline fallback
     * @returns {Promise<void>}
     */
    async function loadMap() {
        if (mapLoaded) {
            console.log('Map already loaded');
            return;
        }

        try {
            // Use OpenStreetMap instead of SVG
            await loadOpenStreetMap();
            updateMapDimensions();

        } catch (error) {
            console.error('Failed to load OpenStreetMap:', error);
            // Fallback: create a simple placeholder
            elements.mapContainer.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#6c757d;">Mapa indisponível</div>';
        }
    }

    /**
     * Updates map dimensions for coordinate conversion
     */
    function updateMapDimensions() {
        if (!elements.pingsContainer) return;
        const rect = elements.pingsContainer.getBoundingClientRect();
        mapDimensions = {
            width: rect.width,
            height: rect.height,
        };
    }

    /**
     * Converts geographic coordinates (lat/lng) to pixel coordinates
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @returns {Object} {x, y} pixel coordinates
     */
    function latLngToPixel(lat, lng) {
        // Normalize coordinates to 0-1 range
        const normalizedX = (lng - BRAZIL_BOUNDS.minLng) / (BRAZIL_BOUNDS.maxLng - BRAZIL_BOUNDS.minLng);
        const normalizedY = (BRAZIL_BOUNDS.maxLat - lat) / (BRAZIL_BOUNDS.maxLat - BRAZIL_BOUNDS.minLat);

        // Convert to pixel coordinates
        const x = normalizedX * mapDimensions.width;
        const y = normalizedY * mapDimensions.height;

        return { x, y };
    }

    /**
     * Updates pings based on coordinates using Leaflet markers
     * @param {Array} coordinates - Array of coordinate objects
     */
    function updatePings(coordinates) {
        // Check if we have Leaflet map
        if (!leafletMap) {
            console.warn('Leaflet map not available');
            // Fall back to HTML pings container
            updatePingsWithHTML(coordinates);
            return;
        }

        // Clear existing Leaflet markers
        clearLeafletMarkers();

        // Check if we have coordinates
        if (!coordinates || coordinates.length === 0) {
            console.log('No coordinates to display');
            return;
        }

        // Create markers for each coordinate
        coordinates.forEach((coord) => {
            // Validate coordinate
            if (typeof coord.lat !== 'number' || typeof coord.lng !== 'number') {
                console.warn('Invalid coordinate:', coord);
                return;
            }

            // Check if coordinate is within Brazil bounds
            if (
                coord.lat < BRAZIL_BOUNDS.minLat ||
                coord.lat > BRAZIL_BOUNDS.maxLat ||
                coord.lng < BRAZIL_BOUNDS.minLng ||
                coord.lng > BRAZIL_BOUNDS.maxLng
            ) {
                console.warn('Coordinate outside Brazil bounds:', coord);
                return;
            }

            // Create Leaflet marker with custom icon
            const marker = L.circleMarker([coord.lat, coord.lng], {
                radius: 6,
                fillColor: '#fc1e75',
                color: '#fc1e75',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8,
            }).addTo(leafletMap);

            // Store marker reference
            leafletMarkers.push(marker);
        });

        console.log(`Created ${leafletMarkers.length} Leaflet markers`);
    }

    /**
     * Clears all Leaflet markers
     */
    function clearLeafletMarkers() {
        leafletMarkers.forEach(marker => {
            leafletMap.removeLayer(marker);
        });
        leafletMarkers = [];
    }

    /**
     * Fallback: Updates pings using HTML elements (if Leaflet not available)
     * @param {Array} coordinates - Array of coordinate objects
     */
    function updatePingsWithHTML(coordinates) {
        if (!elements.pingsContainer) {
            console.warn('Pings container not available');
            return;
        }

        // Clear existing pings
        clearPings();

        // Update map dimensions in case window was resized
        updateMapDimensions();

        // Check if we have coordinates
        if (!coordinates || coordinates.length === 0) {
            console.log('No coordinates to display');
            return;
        }

        // Create document fragment for better performance
        const fragment = document.createDocumentFragment();

        // Create ping for each coordinate
        coordinates.forEach((coord, index) => {
            // Validate coordinate
            if (typeof coord.lat !== 'number' || typeof coord.lng !== 'number') {
                console.warn('Invalid coordinate:', coord);
                return;
            }

            // Check if coordinate is within Brazil bounds
            if (
                coord.lat < BRAZIL_BOUNDS.minLat ||
                coord.lat > BRAZIL_BOUNDS.maxLat ||
                coord.lng < BRAZIL_BOUNDS.minLng ||
                coord.lng > BRAZIL_BOUNDS.maxLng
            ) {
                console.warn('Coordinate outside Brazil bounds:', coord);
                return;
            }

            const ping = createPing(coord, index);
            fragment.appendChild(ping);
        });

        elements.pingsContainer.appendChild(fragment);

        // Store current pings
        currentPings = Array.from(elements.pingsContainer.children);

        console.log(`Created ${currentPings.length} pings`);
    }

    /**
     * Creates a ping element
     * @param {Object} coordinate - {cidade, lat, lng}
     * @param {number} index - Ping index for animation delay
     * @returns {HTMLElement} Ping element
     */
    function createPing(coordinate, index) {
        const { x, y } = latLngToPixel(coordinate.lat, coordinate.lng);

        // Create ping container
        const ping = document.createElement('div');
        ping.className = 'ping';
        ping.style.left = `${x}px`;
        ping.style.top = `${y}px`;
        ping.setAttribute('data-cidade', coordinate.cidade);

        // Create dot
        const dot = document.createElement('div');
        dot.className = 'ping-dot';
        dot.style.animationDelay = `${index * 0.1}s`;

        // Create waves
        for (let i = 0; i < 3; i++) {
            const wave = document.createElement('div');
            wave.className = 'ping-wave';
            wave.style.animationDelay = `${(index * 0.1) + (i * 0.5)}s`;
            dot.appendChild(wave);
        }

        // Create label
        const label = document.createElement('div');
        label.className = 'ping-label';
        label.textContent = coordinate.cidade;

        // Assemble
        ping.appendChild(dot);
        ping.appendChild(label);

        return ping;
    }

    /**
     * Clears all pings from the map
     */
    function clearPings() {
        if (elements.pingsContainer) {
            elements.pingsContainer.innerHTML = '';
        }
        currentPings = [];
        
        // Also clear Leaflet markers if available
        if (leafletMap) {
            clearLeafletMarkers();
        }
    }

    /**
     * Highlights a specific city's ping
     * @param {string} cityName - City name to highlight
     */
    function highlightCity(cityName) {
        currentPings.forEach(ping => {
            const cidade = ping.getAttribute('data-cidade');
            if (cidade === cityName) {
                ping.classList.add('highlighted');
            } else {
                ping.classList.remove('highlighted');
            }
        });
    }

    /**
     * Removes all highlights
     */
    function clearHighlights() {
        currentPings.forEach(ping => {
            ping.classList.remove('highlighted');
        });
    }

    /**
     * Gets current pings count
     * @returns {number} Number of active pings
     */
    function getPingsCount() {
        if (leafletMap) {
            return leafletMarkers.length;
        }
        return currentPings.length;
    }

    /**
     * Handles window resize to update map dimensions
     */
    function handleResize() {
        updateMapDimensions();
        if (leafletMap) {
            leafletMap.invalidateSize();
        }
        console.log('Map dimensions updated:', mapDimensions);
    }

    // Public API
    return {
        init,
        loadMap,
        updatePings,
        clearPings,
        highlightCity,
        clearHighlights,
        getPingsCount,
        handleResize,
        get isLoaded() {
            return mapLoaded;
        },
        get dimensions() {
            return { ...mapDimensions };
        },
    };
})();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.MapManager = MapManager;
}
