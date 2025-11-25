/**
 * Configuration Example
 *
 * Copy this file to customize your dashboard settings.
 * Edit js/api.js and js/dashboard.js to apply these configurations.
 */

const DASHBOARD_CONFIG = {
    // API Configuration
    api: {
        // Your Cloudflare Worker URL
        baseUrl: 'https://dashboard-institucional.YOUR_USERNAME.workers.dev',

        // Request timeout (milliseconds)
        timeout: 10000,

        // Number of retry attempts on failure
        retryAttempts: 3,

        // Delay between retries (milliseconds)
        retryDelay: 2000,

        // Cache duration (milliseconds)
        cacheDuration: 120000, // 2 minutes
    },

    // Refresh intervals
    intervals: {
        // Full metrics refresh (milliseconds)
        metrics: 120000, // 2 minutes

        // Map pings refresh (milliseconds)
        pings: 30000, // 30 seconds

        // Timestamp update (milliseconds)
        timestamp: 1000, // 1 second

        // API health check (milliseconds)
        healthCheck: 300000, // 5 minutes
    },

    // Map configuration
    map: {
        // Path to SVG map file
        svgPath: 'assets/brasil.svg',

        // Use inline fallback if SVG fails to load
        fallbackToInline: true,

        // Brazil geographic bounds
        bounds: {
            minLat: -33.75,
            maxLat: 5.27,
            minLng: -73.99,
            maxLng: -28.84,
        },
    },

    // UI Configuration
    ui: {
        // Target resolution
        width: 1920,
        height: 1080,

        // Layout proportions
        mapWidth: '60%',
        sidebarWidth: '40%',

        // Font sizes (pixels)
        fontSize: {
            base: 24,
            small: 20,
            large: 32,
            xl: 48,
            xxl: 64,
        },

        // Color scheme
        colors: {
            bgPrimary: '#0a0e27',
            bgSecondary: '#151b3d',
            bgCard: '#1e2746',
            textPrimary: '#ffffff',
            textSecondary: '#b8c5db',
            accentPrimary: '#00d4ff',
            accentSuccess: '#00ff88',
            accentWarning: '#ffaa00',
            accentError: '#ff4444',
        },
    },

    // Features
    features: {
        // Enable animations
        animations: true,

        // Enable auto-scroll for cities list
        autoScroll: true,

        // Enable keyboard shortcuts
        keyboardShortcuts: true,

        // Pause updates when tab is hidden
        pauseWhenHidden: true,

        // Show debug info in console
        debugMode: false,
    },
};

// Export for use in modules
if (typeof window !== 'undefined') {
    window.DASHBOARD_CONFIG = DASHBOARD_CONFIG;
}
