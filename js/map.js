/**
 * Map Module
 * Handles Brazil SVG map rendering and animated pings
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
     * Loads SVG map from file or creates inline fallback
     * @returns {Promise<void>}
     */
    async function loadMap() {
        if (mapLoaded) {
            console.log('Map already loaded');
            return;
        }

        try {
            // Try to load external SVG
            const response = await fetch(config.svgPath);

            if (response.ok) {
                const svgText = await response.text();
                elements.mapContainer.innerHTML = svgText;

                // Get SVG element
                const svgElement = elements.mapContainer.querySelector('svg');
                if (svgElement) {
                    // Set viewBox and preserve aspect ratio
                    if (!svgElement.hasAttribute('viewBox')) {
                        svgElement.setAttribute('viewBox', '0 0 1000 1000');
                    }
                    svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                    svgElement.style.width = '100%';
                    svgElement.style.height = '100%';

                    mapLoaded = true;
                    updateMapDimensions();
                    console.log('SVG map loaded successfully');
                    return;
                }
            }

            throw new Error('Failed to load SVG map');

        } catch (error) {
            console.warn('Could not load external SVG:', error.message);

            if (config.fallbackToInline) {
                createInlineMap();
            } else {
                throw error;
            }
        }
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
     * Updates pings based on coordinates
     * @param {Array} coordinates - Array of coordinate objects
     */
    function updatePings(coordinates) {
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
     * Clears all pings from the map
     */
    function clearPings() {
        if (elements.pingsContainer) {
            elements.pingsContainer.innerHTML = '';
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
