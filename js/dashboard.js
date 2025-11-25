/**
 * Main Dashboard Controller
 * Orchestrates all modules and handles refresh cycles
 */

const Dashboard = (function() {
    'use strict';

    // Refresh intervals (in milliseconds)
    const INTERVALS = {
        METRICS: 120000,      // 2 minutes - Full data refresh
        PINGS: 30000,         // 30 seconds - Ping animation refresh
        TIMESTAMP: 1000,      // 1 second - Clock update
        HEALTH_CHECK: 300000, // 5 minutes - API health check
    };

    // Interval IDs for cleanup
    let intervals = {
        metrics: null,
        pings: null,
        timestamp: null,
        healthCheck: null,
    };

    // State
    let initialized = false;
    let lastSuccessfulUpdate = null;
    let consecutiveFailures = 0;
    const MAX_FAILURES = 3;

    /**
     * Initializes the dashboard
     */
    async function init() {
        if (initialized) {
            console.warn('Dashboard already initialized');
            return;
        }

        console.log('Initializing dashboard...');

        try {
            // Initialize all modules
            MetricsManager.init();
            MapManager.init();

            // Load map
            await MapManager.loadMap();

            // Initial data load
            await loadInitialData();

            // Start refresh cycles
            startRefreshCycles();

            // Handle window resize
            window.addEventListener('resize', handleResize);

            // Handle visibility change (pause when hidden)
            document.addEventListener('visibilitychange', handleVisibilityChange);

            // Handle online/offline events
            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);

            // Keyboard shortcuts for manual refresh
            document.addEventListener('keydown', handleKeyPress);

            initialized = true;
            console.log('Dashboard initialized successfully');

        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
            showError('Erro ao inicializar dashboard');
            throw error;
        }
    }

    /**
     * Loads initial data from API
     */
    async function loadInitialData() {
        try {
            MetricsManager.updateStatus('loading', 'Carregando dados...');

            const data = await DashboardAPI.fetchDashboardData(true);

            // Update metrics
            MetricsManager.updateAllMetrics(data.metricas);

            // Load campaigns
            await MetricsManager.refreshCampaigns();

            // Update map pings
            MapManager.updatePings(data.coordenadas);

            // Update timestamp
            MetricsManager.updateTimestamp();

            // Update status
            MetricsManager.updateStatus('online', 'Conectado');

            lastSuccessfulUpdate = Date.now();
            consecutiveFailures = 0;

            console.log('Initial data loaded successfully');

        } catch (error) {
            console.error('Failed to load initial data:', error);
            handleUpdateError(error);
            throw error;
        }
    }

    /**
     * Refreshes all data (metrics, campaigns, pings)
     */
    async function refreshAll() {
        try {
            console.log('Refreshing all data...');

            const data = await MetricsManager.refresh();

            // Update pings with new coordinates
            MapManager.updatePings(data.coordenadas);

            // Refresh campaigns
            await MetricsManager.refreshCampaigns();

            lastSuccessfulUpdate = Date.now();
            consecutiveFailures = 0;

            console.log('All data refreshed successfully');

        } catch (error) {
            console.error('Failed to refresh data:', error);
            handleUpdateError(error);
        }
    }

    /**
     * Refreshes only pings (lighter operation)
     */
    async function refreshPings() {
        try {
            const coordinates = await DashboardAPI.fetchCoordinates();
            MapManager.updatePings(coordinates);
            console.log('Pings refreshed');

        } catch (error) {
            console.error('Failed to refresh pings:', error);
        }
    }

    /**
     * Starts all refresh cycles
     */
    function startRefreshCycles() {
        // Stop any existing intervals
        stopRefreshCycles();

        // Main metrics refresh (2 minutes)
        intervals.metrics = setInterval(refreshAll, INTERVALS.METRICS);

        // Pings refresh (30 seconds)
        intervals.pings = setInterval(refreshPings, INTERVALS.PINGS);

        // Timestamp update (1 second)
        intervals.timestamp = setInterval(() => {
            MetricsManager.updateTimestamp();
        }, INTERVALS.TIMESTAMP);

        // Health check (5 minutes)
        intervals.healthCheck = setInterval(performHealthCheck, INTERVALS.HEALTH_CHECK);

        console.log('Refresh cycles started', INTERVALS);
    }

    /**
     * Stops all refresh cycles
     */
    function stopRefreshCycles() {
        Object.keys(intervals).forEach(key => {
            if (intervals[key]) {
                clearInterval(intervals[key]);
                intervals[key] = null;
            }
        });

        console.log('Refresh cycles stopped');
    }

    /**
     * Performs API health check
     */
    async function performHealthCheck() {
        try {
            const isHealthy = await DashboardAPI.healthCheck();

            if (!isHealthy) {
                console.warn('Health check failed');
                MetricsManager.updateStatus('error', 'API indisponível');
            } else if (consecutiveFailures > 0) {
                // Recovered from previous failures
                console.log('Health check passed - recovered from failures');
                MetricsManager.updateStatus('online', 'Conectado');
                consecutiveFailures = 0;
            }

        } catch (error) {
            console.error('Health check error:', error);
        }
    }

    /**
     * Handles update errors
     * @param {Error} error - The error that occurred
     */
    function handleUpdateError(error) {
        consecutiveFailures++;

        if (consecutiveFailures >= MAX_FAILURES) {
            MetricsManager.updateStatus('error', 'Falha na atualização');
            showError(`Erro após ${consecutiveFailures} tentativas`);
        } else {
            MetricsManager.updateStatus('error', `Tentando reconectar...`);
        }
    }

    /**
     * Shows error toast
     * @param {string} message - Error message
     */
    function showError(message) {
        const errorToast = document.getElementById('errorToast');
        if (!errorToast) return;

        const messageElement = errorToast.querySelector('.error-message');
        if (messageElement) {
            messageElement.textContent = message;
        }

        errorToast.classList.add('show');

        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorToast.classList.remove('show');
        }, 5000);
    }

    /**
     * Handles window resize
     */
    function handleResize() {
        MapManager.handleResize();

        // Refresh pings to reposition them
        refreshPings();
    }

    /**
     * Handles visibility change (tab focus)
     */
    function handleVisibilityChange() {
        if (document.hidden) {
            console.log('Dashboard hidden - pausing refresh cycles');
            stopRefreshCycles();
        } else {
            console.log('Dashboard visible - resuming refresh cycles');
            refreshAll().then(() => {
                startRefreshCycles();
            });
        }
    }

    /**
     * Handles online event
     */
    function handleOnline() {
        console.log('Network connection restored');
        MetricsManager.updateStatus('loading', 'Reconectando...');
        refreshAll();
    }

    /**
     * Handles offline event
     */
    function handleOffline() {
        console.log('Network connection lost');
        MetricsManager.updateStatus('error', 'Sem conexão');
        showError('Conexão com a internet perdida');
    }

    /**
     * Handles keyboard shortcuts
     * @param {KeyboardEvent} event - Keyboard event
     */
    function handleKeyPress(event) {
        // F5 or Ctrl+R - Manual refresh
        if (event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
            event.preventDefault();
            console.log('Manual refresh triggered');
            refreshAll();
        }

        // Ctrl+Shift+C - Clear cache
        if (event.ctrlKey && event.shiftKey && event.key === 'C') {
            event.preventDefault();
            console.log('Cache cleared');
            DashboardAPI.clearCache();
            refreshAll();
        }

        // Ctrl+Shift+D - Debug info
        if (event.ctrlKey && event.shiftKey && event.key === 'D') {
            event.preventDefault();
            printDebugInfo();
        }
    }

    /**
     * Prints debug information to console
     */
    function printDebugInfo() {
        console.group('Dashboard Debug Info');
        console.log('Initialized:', initialized);
        console.log('Last successful update:', lastSuccessfulUpdate ? new Date(lastSuccessfulUpdate) : 'Never');
        console.log('Consecutive failures:', consecutiveFailures);
        console.log('Map loaded:', MapManager.isLoaded);
        console.log('Pings count:', MapManager.getPingsCount());
        console.log('Current metrics:', MetricsManager.getCurrentMetrics());
        console.log('Current campaigns:', MetricsManager.getCurrentCampaigns());
        console.log('API cache status:', DashboardAPI.getCacheStatus());
        console.groupEnd();
    }

    /**
     * Destroys the dashboard (cleanup)
     */
    function destroy() {
        console.log('Destroying dashboard...');

        // Stop refresh cycles
        stopRefreshCycles();

        // Remove event listeners
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        document.removeEventListener('keydown', handleKeyPress);

        // Clear map
        MapManager.clearPings();

        initialized = false;
        console.log('Dashboard destroyed');
    }

    /**
     * Gets dashboard statistics
     * @returns {Object} Dashboard statistics
     */
    function getStats() {
        return {
            initialized,
            lastUpdate: lastSuccessfulUpdate,
            failures: consecutiveFailures,
            uptime: lastSuccessfulUpdate ? Date.now() - lastSuccessfulUpdate : 0,
            pingsCount: MapManager.getPingsCount(),
            metrics: MetricsManager.getCurrentMetrics(),
            campaigns: MetricsManager.getCurrentCampaigns(),
        };
    }

    // Public API
    return {
        init,
        refreshAll,
        refreshPings,
        destroy,
        getStats,
        showError,
        get intervals() {
            return { ...INTERVALS };
        },
        get isInitialized() {
            return initialized;
        },
    };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        Dashboard.init().catch(error => {
            console.error('Failed to initialize dashboard:', error);
        });
    });
} else {
    // DOM already loaded
    Dashboard.init().catch(error => {
        console.error('Failed to initialize dashboard:', error);
    });
}

// Export for debugging in console
if (typeof window !== 'undefined') {
    window.Dashboard = Dashboard;
}
