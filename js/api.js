/**
 * API Client for Cloudflare Worker Dashboard
 * Handles all HTTP requests and data fetching
 */

const DashboardAPI = (function() {
    'use strict';

    // Configuration
    const CONFIG = {
        // Cloudflare Worker URL - configure com seu endpoint
        API_BASE_URL: 'https://dashboard-institucional.kaike74.workers.dev',
        TIMEOUT: 10000, // 10 seconds
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 2000, // 2 seconds
        CACHE_DURATION: 120000, // 2 minutes
        USE_FALLBACK_DATA: true, // Ativa dados de fallback se API falhar
    };

    // Fallback data (dados de exemplo para demonstração)
    const FALLBACK_DATA = {
        metricas: {
            campanhasDoMes: 48,
            campanhasAtivasHoje: 34,
            emissorasAtivasHoje: 67,
            insercoesHoje: 554,
            cidadesAtivasHoje: 33
        },
        coordenadas: [
            { cidade: "São Paulo", lat: -23.5505, lng: -46.6333 },
            { cidade: "Rio de Janeiro", lat: -22.9068, lng: -43.1729 },
            { cidade: "Brasília", lat: -15.7975, lng: -47.8919 },
            { cidade: "Salvador", lat: -12.9714, lng: -38.5014 },
            { cidade: "Fortaleza", lat: -3.7172, lng: -38.5433 },
            { cidade: "Belo Horizonte", lat: -19.9167, lng: -43.9345 },
            { cidade: "Manaus", lat: -3.1190, lng: -60.0217 },
            { cidade: "Curitiba", lat: -25.4284, lng: -49.2733 },
            { cidade: "Recife", lat: -8.0476, lng: -34.8770 },
            { cidade: "Porto Alegre", lat: -30.0346, lng: -51.2177 },
            { cidade: "Belém", lat: -1.4558, lng: -48.4902 },
            { cidade: "Goiânia", lat: -16.6869, lng: -49.2648 },
            { cidade: "Campinas", lat: -22.9099, lng: -47.0626 },
            { cidade: "São Luís", lat: -2.5387, lng: -44.2825 },
            { cidade: "Maceió", lat: -9.6498, lng: -35.7089 },
            { cidade: "Natal", lat: -5.7945, lng: -35.211 },
            { cidade: "Campo Grande", lat: -20.4697, lng: -54.6201 },
            { cidade: "Teresina", lat: -5.0892, lng: -42.8019 },
            { cidade: "João Pessoa", lat: -7.1195, lng: -34.8450 },
            { cidade: "Florianópolis", lat: -27.5954, lng: -48.5480 },
            { cidade: "Vitória", lat: -20.3155, lng: -40.3128 },
            { cidade: "Aracaju", lat: -10.9472, lng: -37.0731 },
            { cidade: "Cuiabá", lat: -15.6014, lng: -56.0979 },
            { cidade: "Ribeirão Preto", lat: -21.1704, lng: -47.8103 },
            { cidade: "Santos", lat: -23.9608, lng: -46.3333 },
            { cidade: "Sorocaba", lat: -23.5015, lng: -47.4526 },
            { cidade: "Uberlândia", lat: -18.9146, lng: -48.2754 },
            { cidade: "Londrina", lat: -23.3045, lng: -51.1696 },
            { cidade: "Joinville", lat: -26.3045, lng: -48.8487 },
            { cidade: "Juiz de Fora", lat: -21.7642, lng: -43.3503 },
            { cidade: "Niterói", lat: -22.8839, lng: -43.1039 },
            { cidade: "Caxias do Sul", lat: -29.1634, lng: -51.1797 },
            { cidade: "Blumenau", lat: -26.9194, lng: -49.0661 }
        ]
    };

    // Fallback campaigns data (test data for demonstration when API is unavailable)
    const FALLBACK_CAMPAIGNS = [
        { name: "Campanha Verão 2025", client: "Coca-Cola", startDate: "2025-01-15", endDate: "2025-03-15" },
        { name: "Promoção Janeiro", client: "Ambev", startDate: "2025-01-01", endDate: "2025-01-31" },
        { name: "Festival de Música", client: "Spotify", startDate: "2025-02-01", endDate: "2025-02-28" },
        { name: "Campanha Carnaval", client: "Itaú", startDate: "2025-02-20", endDate: "2025-03-05" },
        { name: "Black Friday Antecipada", client: "Magazine Luiza", startDate: "2025-01-10", endDate: "2025-02-10" },
        { name: "Lançamento Produto X", client: "Samsung", startDate: "2025-01-05", endDate: "2025-02-05" },
        { name: "Campanha Sustentabilidade", client: "Natura", startDate: "2025-01-20", endDate: "2025-04-20" },
        { name: "Promoção Volta às Aulas", client: "Kalunga", startDate: "2025-01-25", endDate: "2025-02-25" }
    ];

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

            console.log('✅ Data fetched successfully:', {
                metricas: data.metricas,
                coordenadas_count: data.coordenadas.length,
            });

            return data;

        } catch (error) {
            console.error('❌ Failed to fetch dashboard data:', error);

            // Return cached data if available, even if expired
            if (cache.data) {
                console.warn('⚠️ Returning stale cached data due to error');
                return cache.data;
            }

            // Use fallback data if enabled
            if (CONFIG.USE_FALLBACK_DATA) {
                console.warn('⚠️ Using fallback data (API unavailable)');
                cache.data = FALLBACK_DATA;
                cache.timestamp = Date.now();
                return FALLBACK_DATA;
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

    /**
     * Fetches campaigns data from API
     * @returns {Promise<Array>} Array of campaign objects
     */
    async function fetchCampaigns() {
        try {
            console.log('Fetching campaigns from API...');
            const data = await fetchWithRetry(`${CONFIG.API_BASE_URL}/campaigns`);
            
            // Sort by startDate (most recent first)
            if (Array.isArray(data)) {
                data.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
            }
            
            console.log('✅ Campaigns fetched successfully:', data.length);
            return data;
            
        } catch (error) {
            console.error('❌ Failed to fetch campaigns:', error);
            
            // Use fallback data if enabled
            if (CONFIG.USE_FALLBACK_DATA) {
                console.warn('⚠️ Using fallback campaigns data');
                return [...FALLBACK_CAMPAIGNS].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
            }
            
            throw error;
        }
    }

    // Public API
    return {
        fetchDashboardData,
        fetchMetrics,
        fetchCoordinates,
        fetchCampaigns,
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
