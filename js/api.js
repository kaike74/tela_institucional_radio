/**
 * API Client for Cloudflare Worker Dashboard
 * Handles all HTTP requests and data fetching
 */

const DashboardAPI = (function() {
    'use strict';

    // Configuration
    const CONFIG = {
        // TODO: Replace with your actual Cloudflare Worker URL
        API_BASE_URL: 'https://dashboard-institucional.kaike74.workers.dev',
        TIMEOUT: 10000, // 10 seconds
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 2000, // 2 seconds
        CACHE_DURATION: 120000, // 2 minutes
    };

    // Cache storage
    let cache = {
        data: null,
        timestamp: null,
    };

    /**
     * Makes HTTP GET request with timeout and retry logic
     * @param {string} url - The URL to fetch
     * @param {number} attempt - Current attempt number
     * @returns {Promise<Object>} Response data
     */
    async function fetchWithRetry(url, attempt = 1) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

        try {
            const response = await fetch(url, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                },
                cache: 'no-cache',
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            clearTimeout(timeoutId);

            // Retry logic
            if (attempt < CONFIG.RETRY_ATTEMPTS) {
                console.warn(`API request failed (attempt ${attempt}/${CONFIG.RETRY_ATTEMPTS}):`, error.message);
                console.log(`Retrying in ${CONFIG.RETRY_DELAY / 1000}s...`);

                await sleep(CONFIG.RETRY_DELAY);
                return fetchWithRetry(url, attempt + 1);
            }

            // All retries failed
            throw new Error(`API request failed after ${CONFIG.RETRY_ATTEMPTS} attempts: ${error.message}`);
        }
    }

    /**
     * Sleep utility for retry delays
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     */
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Validates API response structure
     * @param {Object} data - Response data to validate
     * @returns {boolean} True if valid
     */
    function validateResponse(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid response: not an object');
        }

        // Check for required fields
        if (!data.metricas || typeof data.metricas !== 'object') {
            throw new Error('Invalid response: missing metricas object');
        }

        if (!Array.isArray(data.coordenadas)) {
            throw new Error('Invalid response: coordenadas must be an array');
        }

        // Validate metrics structure
        const requiredMetrics = [
            'campanhasDoMes',
            'campanhasAtivasHoje',
            'emissorasAtivasHoje',
            'insercoesHoje',
            'cidadesAtivasHoje',
        ];

        for (const metric of requiredMetrics) {
            if (typeof data.metricas[metric] !== 'number') {
                throw new Error(`Invalid response: metricas.${metric} must be a number`);
            }
        }

        return true;
    }

    /**
     * Checks if cached data is still valid
     * @returns {boolean} True if cache is valid
     */
    function isCacheValid() {
        if (!cache.data || !cache.timestamp) {
            return false;
        }

        const age = Date.now() - cache.timestamp;
        return age < CONFIG.CACHE_DURATION;
    }

    /**
     * Fetches dashboard data from Cloudflare Worker
     * @param {boolean} forceRefresh - Skip cache and fetch fresh data
     * @returns {Promise<Object>} Dashboard data
     */
    async function fetchDashboardData(forceRefresh = false) {
        // Return cached data if valid and not forcing refresh
        if (!forceRefresh && isCacheValid()) {
            console.log('Returning cached data');
            return cache.data;
        }

        try {
            console.log('Fetching fresh data from API...');
            const data = await fetchWithRetry(CONFIG.API_BASE_URL);

            // Validate response structure
            validateResponse(data);

            // Update cache
            cache.data = data;
            cache.timestamp = Date.now();

            console.log('Data fetched successfully:', {
                metricas: data.metricas,
                coordenadas_count: data.coordenadas.length,
            });

            return data;

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);

            // Return cached data if available, even if expired
            if (cache.data) {
                console.warn('Returning stale cached data due to error');
                return cache.data;
            }

            throw error;
        }
    }

    /**
     * Gets only metrics data
     * @returns {Promise<Object>} Metrics object
     */
    async function fetchMetrics() {
        const data = await fetchDashboardData();
        return data.metricas;
    }

    /**
     * Gets only coordinates data
     * @returns {Promise<Array>} Array of city coordinates
     */
    async function fetchCoordinates() {
        const data = await fetchDashboardData();
        return data.coordenadas;
    }

    /**
     * Clears API cache (useful for manual refresh)
     */
    function clearCache() {
        cache.data = null;
        cache.timestamp = null;
        console.log('API cache cleared');
    }

    /**
     * Gets cache status
     * @returns {Object} Cache information
     */
    function getCacheStatus() {
        return {
            hasData: !!cache.data,
            timestamp: cache.timestamp,
            age: cache.timestamp ? Date.now() - cache.timestamp : null,
            valid: isCacheValid(),
        };
    }

    /**
     * Updates API configuration
     * @param {Object} config - Configuration object
     */
    function updateConfig(config) {
        Object.assign(CONFIG, config);
        console.log('API config updated:', CONFIG);
    }

    /**
     * Health check endpoint
     * @returns {Promise<boolean>} True if API is healthy
     */
    async function healthCheck() {
        try {
            await fetchWithRetry(CONFIG.API_BASE_URL);
            return true;
        } catch (error) {
            console.error('Health check failed:', error);
            return false;
        }
    }

    // Public API
    return {
        fetchDashboardData,
        fetchMetrics,
        fetchCoordinates,
        clearCache,
        getCacheStatus,
        updateConfig,
        healthCheck,
        get config() {
            return { ...CONFIG };
        },
    };
})();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.DashboardAPI = DashboardAPI;
}
