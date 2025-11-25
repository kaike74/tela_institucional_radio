/**
 * Metrics Module
 * Handles real-time metric updates and animations
 */

const MetricsManager = (function() {
    'use strict';

    // DOM Element References
    const elements = {
        campanhasDoMes: null,
        campanhasAtivasHoje: null,
        emissorasAtivasHoje: null,
        insercoesHoje: null,
        cidadesAtivasHoje: null,
        citiesList: null,
        lastUpdate: null,
        statusIndicator: null,
        statusDot: null,
        statusText: null,
    };

    // Current state
    let currentMetrics = {};
    let currentCities = [];

    /**
     * Initializes the metrics module
     */
    function init() {
        // Get DOM references
        elements.campanhasDoMes = document.getElementById('campanhasDoMes');
        elements.campanhasAtivasHoje = document.getElementById('campanhasAtivasHoje');
        elements.emissorasAtivasHoje = document.getElementById('emissorasAtivasHoje');
        elements.insercoesHoje = document.getElementById('insercoesHoje');
        elements.cidadesAtivasHoje = document.getElementById('cidadesAtivasHoje');
        elements.citiesList = document.getElementById('citiesList');
        elements.lastUpdate = document.getElementById('lastUpdate');
        elements.statusIndicator = document.getElementById('statusIndicator');
        elements.statusDot = elements.statusIndicator?.querySelector('.status-dot');
        elements.statusText = elements.statusIndicator?.querySelector('.status-text');

        console.log('MetricsManager initialized');
    }

    /**
     * Animates number change with counter effect
     * @param {HTMLElement} element - Element to animate
     * @param {number} newValue - New value to display
     * @param {number} duration - Animation duration in ms
     */
    function animateNumber(element, newValue, duration = 800) {
        if (!element) return;

        const numberSpan = element.querySelector('.number');
        if (!numberSpan) return;

        const oldValue = parseInt(element.getAttribute('data-count') || '0', 10);
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);

            const currentValue = Math.round(oldValue + (newValue - oldValue) * easeOut);
            numberSpan.textContent = currentValue.toLocaleString('pt-BR');

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                // Update data attribute
                element.setAttribute('data-count', newValue);
            }
        }

        requestAnimationFrame(update);
    }

    /**
     * Updates a single metric value
     * @param {string} metricId - Metric element ID
     * @param {number} value - New value
     */
    function updateMetric(metricId, value) {
        const element = elements[metricId];
        if (!element) {
            console.warn(`Metric element not found: ${metricId}`);
            return;
        }

        const oldValue = parseInt(element.getAttribute('data-count') || '0', 10);

        // Only animate if value changed
        if (oldValue !== value) {
            animateNumber(element, value);

            // Add flash effect to parent card
            const card = element.closest('.metric-card');
            if (card) {
                card.classList.add('updated');
                setTimeout(() => card.classList.remove('updated'), 800);
            }
        }
    }

    /**
     * Updates all metrics at once
     * @param {Object} metrics - Metrics object from API
     */
    function updateAllMetrics(metrics) {
        if (!metrics || typeof metrics !== 'object') {
            console.error('Invalid metrics object');
            return;
        }

        // Store current metrics
        currentMetrics = { ...metrics };

        // Update each metric
        updateMetric('campanhasDoMes', metrics.campanhasDoMes || 0);
        updateMetric('campanhasAtivasHoje', metrics.campanhasAtivasHoje || 0);
        updateMetric('emissorasAtivasHoje', metrics.emissorasAtivasHoje || 0);
        updateMetric('insercoesHoje', metrics.insercoesHoje || 0);
        updateMetric('cidadesAtivasHoje', metrics.cidadesAtivasHoje || 0);

        console.log('Metrics updated:', metrics);
    }

    /**
     * Groups coordinates by city and counts occurrences
     * @param {Array} coordinates - Array of coordinate objects
     * @returns {Array} Sorted array of {cidade, count}
     */
    function groupCitiesByCount(coordinates) {
        const cityMap = new Map();

        coordinates.forEach(coord => {
            const cidade = coord.cidade || 'Desconhecida';
            cityMap.set(cidade, (cityMap.get(cidade) || 0) + 1);
        });

        // Convert to array and sort by count (descending)
        return Array.from(cityMap.entries())
            .map(([cidade, count]) => ({ cidade, count }))
            .sort((a, b) => b.count - a.count);
    }

    /**
     * Renders cities list with animation
     * @param {Array} cities - Array of {cidade, count}
     */
    function renderCitiesList(cities) {
        if (!elements.citiesList) return;

        // Store current cities
        currentCities = cities;

        // Clear list
        elements.citiesList.innerHTML = '';

        // Check if empty
        if (!cities || cities.length === 0) {
            elements.citiesList.innerHTML = '<div class="list-loading">Nenhuma cidade ativa</div>';
            return;
        }

        // Create city items
        const fragment = document.createDocumentFragment();

        cities.forEach((city, index) => {
            const cityItem = document.createElement('div');
            cityItem.className = 'city-item';
            cityItem.style.setProperty('--item-index', index);

            const cityName = document.createElement('span');
            cityName.className = 'city-name';
            cityName.textContent = city.cidade;

            const cityCount = document.createElement('span');
            cityCount.className = 'city-count';
            cityCount.textContent = city.count > 1 ? `${city.count}x` : '';

            cityItem.appendChild(cityName);
            cityItem.appendChild(cityCount);
            fragment.appendChild(cityItem);
        });

        elements.citiesList.appendChild(fragment);

        console.log(`Rendered ${cities.length} cities`);
    }

    /**
     * Updates cities list from coordinates
     * @param {Array} coordinates - Array of coordinate objects
     */
    function updateCitiesList(coordinates) {
        if (!Array.isArray(coordinates)) {
            console.error('Invalid coordinates array');
            return;
        }

        const cities = groupCitiesByCount(coordinates);
        renderCitiesList(cities);
    }

    /**
     * Updates last update timestamp
     */
    function updateTimestamp() {
        if (!elements.lastUpdate) return;

        const now = new Date();
        const timeString = now.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });

        elements.lastUpdate.textContent = timeString;
        elements.lastUpdate.setAttribute('datetime', now.toISOString());
    }

    /**
     * Updates status indicator
     * @param {string} status - Status type: 'loading', 'online', 'error'
     * @param {string} message - Status message
     */
    function updateStatus(status, message) {
        if (!elements.statusDot || !elements.statusText) return;

        // Remove all status classes
        elements.statusDot.classList.remove('status-loading', 'status-online', 'status-error');

        // Add new status class
        elements.statusDot.classList.add(`status-${status}`);

        // Update text
        elements.statusText.textContent = message;

        console.log(`Status updated: ${status} - ${message}`);
    }

    /**
     * Refreshes all metrics and cities from API
     * @returns {Promise<void>}
     */
    async function refresh() {
        try {
            updateStatus('loading', 'Atualizando...');

            const data = await DashboardAPI.fetchDashboardData(true);

            // Update metrics
            updateAllMetrics(data.metricas);

            // Update cities list
            updateCitiesList(data.coordenadas);

            // Update timestamp
            updateTimestamp();

            // Update status
            updateStatus('online', 'Conectado');

            return data;

        } catch (error) {
            console.error('Failed to refresh metrics:', error);
            updateStatus('error', 'Erro ao atualizar');
            throw error;
        }
    }

    /**
     * Gets current metrics
     * @returns {Object} Current metrics
     */
    function getCurrentMetrics() {
        return { ...currentMetrics };
    }

    /**
     * Gets current cities
     * @returns {Array} Current cities
     */
    function getCurrentCities() {
        return [...currentCities];
    }

    // Public API
    return {
        init,
        updateMetric,
        updateAllMetrics,
        updateCitiesList,
        updateTimestamp,
        updateStatus,
        refresh,
        getCurrentMetrics,
        getCurrentCities,
    };
})();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.MetricsManager = MetricsManager;
}
