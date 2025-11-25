/**
 * Map Module
 * Handles Brazil SVG map rendering and animated pings
 */

const MapManager = (function () {
    'use strict';

    // DOM Element References
    const elements = {
        mapContainer: null,
        pingsContainer: null,
    };

    // Map configuration
    const config = {
        svgPath: 'assets/brasil.svg',
        fallbackToInline: true,
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
    async function loadMap() {
        if (mapLoaded) {
            console.log('Map already loaded');
            return;
        }

        try {
            // Load Leaflet CSS first and wait for it
            await loadCSS('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
            console.log('Leaflet CSS loaded');

            // Load Leaflet JS and wait for it
            await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
            console.log('Leaflet JS loaded');

            // Wait a bit for Leaflet to fully initialize
            await new Promise(resolve => setTimeout(resolve, 200));

            // Clear container and set ID for Leaflet
            elements.mapContainer.innerHTML = '';
            elements.mapContainer.id = 'leaflet-map';
            elements.mapContainer.style.width = '100%';
            elements.mapContainer.style.height = '100%';

            // Create Leaflet map centered on Brazil
            const map = L.map('leaflet-map', {
                center: [-14.235, -51.925], // Center of Brazil
                zoom: 4,
                zoomControl: false,
                scrollWheelZoom: false,
                doubleClickZoom: false,
                boxZoom: false,
                keyboard: false,
                dragging: false,
                touchZoom: false
            });

            // Add OpenStreetMap tiles
            const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '',
                maxZoom: 18,
                minZoom: 3,
                errorTileUrl: '', // Evitar tiles quebrados
                crossOrigin: true
            });

            tileLayer.on('loading', () => {
                console.log('Tiles começando a carregar...');
            });

            tileLayer.on('load', () => {
                console.log('✅ Tiles carregados com sucesso!');
                // Forçar redimensionamento do mapa para garantir renderização
                setTimeout(() => {
                    map.invalidateSize();
                }, 100);
            });

            tileLayer.on('tileerror', (error) => {
                console.error('❌ Erro ao carregar tile:', error);
            });

            tileLayer.addTo(map);

            // Save map reference
            window.brazilMap = map;
            mapLoaded = true;
            updateMapDimensions();

            console.log('OpenStreetMap loaded successfully');
            console.log('Map center:', map.getCenter());
            console.log('Map zoom:', map.getZoom());

        } catch (error) {
            console.error('Failed to load OpenStreetMap:', error);
            // Fallback to inline map
            createInlineMap();
        }
    }

    /**
     * Helper function to load external scripts
     * @param {string} src - Script URL
     * @returns {Promise<void>}
     */
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                console.log(`Script loaded: ${src}`);
                resolve();
            };
            script.onerror = (error) => {
                console.error(`Failed to load script: ${src}`, error);
                reject(error);
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Helper function to load external CSS
     * @param {string} href - CSS URL
     * @returns {Promise<void>}
     */
    function loadCSS(href) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = () => {
                console.log(`CSS loaded: ${href}`);
                resolve();
            };
            link.onerror = (error) => {
                console.error(`Failed to load CSS: ${href}`, error);
                reject(error);
            };
            document.head.appendChild(link);
        });
    }

    /**
     * Creates an inline SVG map as fallback
     */
    function createInlineMap() {
        console.log('Creating inline fallback map');

        // Simple Brazil outline SVG
        const inlineSVG = `
            <svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width: 100%; height: 100%;">
                <defs>
                    <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#1e2746;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#151b3d;stop-opacity:1" />
                    </linearGradient>
                </defs>

                <!-- Simplified Brazil shape -->
                <path d="M 300,100 L 700,100 L 750,200 L 800,400 L 750,600 L 700,800 L 500,900 L 350,850 L 250,700 L 200,500 L 250,300 Z"
                      fill="url(#mapGradient)"
                      stroke="#00d4ff"
                      stroke-width="3"
                      opacity="0.8" />

                <!-- Grid lines for visual interest -->
                <line x1="200" y1="300" x2="800" y2="300" stroke="#2a3c66" stroke-width="1" opacity="0.3" />
                <line x1="200" y1="500" x2="800" y2="500" stroke="#2a3c66" stroke-width="1" opacity="0.3" />
                <line x1="200" y1="700" x2="800" y2="700" stroke="#2a3c66" stroke-width="1" opacity="0.3" />
                <line x1="400" y1="100" x2="400" y2="900" stroke="#2a3c66" stroke-width="1" opacity="0.3" />
                <line x1="600" y1="100" x2="600" y2="900" stroke="#2a3c66" stroke-width="1" opacity="0.3" />

                <!-- Label -->
                <text x="500" y="500" text-anchor="middle" fill="#6b7a99" font-size="48" font-weight="300" opacity="0.5">
                    BRASIL
                </text>
            </svg>
        `;

        elements.mapContainer.innerHTML = inlineSVG;
        mapLoaded = true;
        updateMapDimensions();

        console.log('Inline map created');
    }

    /**
     * Updates map dimensions for coordinate conversion
     */
    function updateMapDimensions() {
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
     * Updates pings based on coordinates using Leaflet markers
     * @param {Array} coordinates - Array of coordinate objects
     */
    function updatePings(coordinates) {
        if (!window.brazilMap) {
            console.warn('Map not available yet');
            return;
        }

        // Clear existing pings
        clearPings();

        // Check if we have coordinates
        if (!coordinates || coordinates.length === 0) {
            console.log('No coordinates to display');
            return;
        }

        // Create custom icon for pings
        const pingIcon = L.divIcon({
            className: 'leaflet-ping-icon',
            html: '<div class="ping-dot-leaflet"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        // Create markers for each coordinate
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

            // Create marker
            const marker = L.marker([coord.lat, coord.lng], {
                icon: pingIcon,
                title: coord.cidade
            }).addTo(window.brazilMap);

            // Store marker
            currentPings.push(marker);
        });

        console.log(`Created ${currentPings.length} pings`);
    }

    /**
     * Clears all pings from the map
     */
    function clearPings() {
        if (window.brazilMap && currentPings.length > 0) {
            currentPings.forEach(marker => {
                window.brazilMap.removeLayer(marker);
            });
        }
        currentPings = [];
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
        return currentPings.length;
    }

    /**
     * Handles window resize to update map dimensions
     */
    function handleResize() {
        updateMapDimensions();
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
