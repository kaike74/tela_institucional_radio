/**
 * Metrics Module
 * Handles real-time metric updates and animations
 */

const MetricsManager = (function() {
    'use strict';

    // DOM Element References
    const elements = {
        campanhasDoMes: null,
        emissorasAtivasHoje: null,
        insercoesHoje: null,
        campaignsList: null,
        lastUpdate: null,
        statusIndicator: null,
        statusDot: null,
        statusText: null,
    };

    // Current state
    let currentMetrics = {};
    let currentCampaigns = [];

    /**
     * Initializes the metrics module
     */
    function init() {
        // Get DOM references
        elements.campanhasDoMes = document.getElementById('campanhasDoMes');
        elements.emissorasAtivasHoje = document.getElementById('emissorasAtivasHoje');
        elements.insercoesHoje = document.getElementById('insercoesHoje');
        elements.campaignsList = document.getElementById('campaignsList');
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

        // Update each metric (only the 3 we display)
        updateMetric('campanhasDoMes', metrics.campanhasDoMes || 0);
        updateMetric('emissorasAtivasHoje', metrics.emissorasAtivasHoje || 0);
        updateMetric('insercoesHoje', metrics.insercoesHoje || 0);

        console.log('Metrics updated:', metrics);
    }

    /**
     * Updates campaigns list from API
     * @param {Array} campaigns - Array of campaign objects
     */
    function updateCampaignsList(campaigns) {
        if (!elements.campaignsList) return;

        // Store current campaigns
        currentCampaigns = campaigns || [];

        // Clear list
        elements.campaignsList.innerHTML = '';

        // Check if empty
        if (!campaigns || campaigns.length === 0) {
            elements.campaignsList.innerHTML = '<div class="list-loading">Nenhuma campanha ativa</div>';
            return;
        }

        // Create campaign items (limit to 10)
        const fragment = document.createDocumentFragment();

        campaigns.slice(0, 10).forEach((campaign, index) => {
            const item = document.createElement('div');
            item.className = 'campaign-item';
            item.style.setProperty('--item-index', index);

            const startDate = new Date(campaign.startDate).toLocaleDateString('pt-BR');
            const endDate = new Date(campaign.endDate).toLocaleDateString('pt-BR');

            item.textContent = `${campaign.name}, ${campaign.client} - ${startDate} a ${endDate}`;

            fragment.appendChild(item);
        });

        elements.campaignsList.appendChild(fragment);

        console.log(`Rendered ${Math.min(campaigns.length, 10)} campaigns`);
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
     * Refreshes all metrics and campaigns from API
     * @returns {Promise<void>}
     */
    async function refresh() {
        try {
            updateStatus('loading', 'Atualizando...');

            const data = await DashboardAPI.fetchDashboardData(true);

            // Update metrics
            updateAllMetrics(data.metricas);

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
     * Refreshes campaigns list
     * @returns {Promise<void>}
     */
    async function refreshCampaigns() {
        try {
            const campaigns = await DashboardAPI.fetchCampaigns();
            updateCampaignsList(campaigns);
        } catch (error) {
            console.error('Failed to refresh campaigns:', error);
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
     * Gets current campaigns
     * @returns {Array} Current campaigns
     */
    function getCurrentCampaigns() {
        return [...currentCampaigns];
    }

    // Public API
    return {
        init,
        updateMetric,
        updateAllMetrics,
        updateCampaignsList,
        updateTimestamp,
        updateStatus,
        refresh,
        refreshCampaigns,
        getCurrentMetrics,
        getCurrentCampaigns,
    };
})();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.MetricsManager = MetricsManager;
}
