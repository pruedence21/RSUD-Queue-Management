// API communication handler for Admin Panel
class AdminAPI {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
        this.timeout = CONFIG.API_TIMEOUT;
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }

    /**
     * Get authorization headers
     * @returns {object} Headers with authorization
     */
    getAuthHeaders() {
        const token = Utils.storage.get(CONFIG.TOKEN_KEY);
        return {
            ...this.defaultHeaders,
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }

    /**
     * Handle API response
     * @param {Response} response - Fetch response
     * @returns {Promise} Parsed response
     */
    async handleResponse(response) {
        const contentType = response.headers.get('Content-Type');
        const isJson = contentType && contentType.includes('application/json');
        
        let data;
        try {
            data = isJson ? await response.json() : await response.text();
        } catch (error) {
            throw new Error('Failed to parse response');
        }

        if (!response.ok) {
            // Handle different error types
            if (response.status === 401) {
                // Unauthorized - redirect to login
                this.handleUnauthorized();
                throw new Error(data.message || CONFIG.MESSAGES.SESSION_EXPIRED);
            } else if (response.status === 403) {
                throw new Error(data.message || CONFIG.MESSAGES.ACCESS_DENIED);
            } else if (response.status === 404) {
                throw new Error(data.message || CONFIG.MESSAGES.DATA_NOT_FOUND);
            } else if (response.status >= 500) {
                throw new Error(data.message || 'Server error occurred');
            } else {
                throw new Error(data.message || 'Request failed');
            }
        }

        return data;
    }

    /**
     * Handle unauthorized access
     */
    handleUnauthorized() {
        // Clear stored auth data
        Utils.storage.remove(CONFIG.TOKEN_KEY);
        Utils.storage.remove(CONFIG.USER_KEY);
        Utils.storage.remove(CONFIG.REFRESH_TOKEN_KEY);
        
        // Redirect to login
        window.location.href = '/admin/';
    }

    /**
     * Make HTTP request
     * @param {string} endpoint - API endpoint
     * @param {object} options - Request options
     * @returns {Promise} Response data
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            method: 'GET',
            headers: this.getAuthHeaders(),
            ...options
        };

        // Add timeout using AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        config.signal = controller.signal;

        try {
            const response = await fetch(url, config);
            clearTimeout(timeoutId);
            return await this.handleResponse(response);
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            
            if (!navigator.onLine) {
                throw new Error('No internet connection');
            }
            
            throw error;
        }
    }

    /**
     * GET request
     * @param {string} endpoint - API endpoint
     * @param {object} params - Query parameters
     * @returns {Promise} Response data
     */
    async get(endpoint, params = {}) {
        const query = new URLSearchParams(params).toString();
        const url = query ? `${endpoint}?${query}` : endpoint;
        return this.request(url);
    }

    /**
     * POST request
     * @param {string} endpoint - API endpoint
     * @param {object} data - Request body
     * @returns {Promise} Response data
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT request
     * @param {string} endpoint - API endpoint
     * @param {object} data - Request body
     * @returns {Promise} Response data
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * PATCH request
     * @param {string} endpoint - API endpoint
     * @param {object} data - Request body
     * @returns {Promise} Response data
     */
    async patch(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     * @param {string} endpoint - API endpoint
     * @returns {Promise} Response data
     */
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    // ============================================
    // Authentication API Methods
    // ============================================

    /**
     * Login user
     * @param {object} credentials - Login credentials
     * @returns {Promise} Login response
     */
    async login(credentials) {
        return this.post('/auth/login', credentials);
    }

    /**
     * Logout user
     * @returns {Promise} Logout response
     */
    async logout() {
        return this.post('/auth/logout');
    }

    /**
     * Get current user profile
     * @returns {Promise} User profile
     */
    async getProfile() {
        return this.get('/auth/profile');
    }

    // ============================================
    // Dashboard API Methods
    // ============================================

    /**
     * Get general dashboard statistics
     * @returns {Promise} Dashboard stats
     */
    async getDashboardStats() {
        return this.get('/dashboard/stats');
    }

    /**
     * Get today's queue statistics
     * @returns {Promise} Today's queue stats
     */
    async getTodayQueueStats() {
        return this.get('/dashboard/antrian-today');
    }

    /**
     * Get this week's queue statistics
     * @returns {Promise} Week's queue stats
     */
    async getWeekQueueStats() {
        return this.get('/dashboard/antrian-week');
    }

    /**
     * Get activity log
     * @param {object} params - Query parameters
     * @returns {Promise} Activity log
     */
    async getActivityLog(params = {}) {
        return this.get('/dashboard/activity-log', params);
    }

    /**
     * Get system alerts
     * @returns {Promise} System alerts
     */
    async getSystemAlerts() {
        return this.get('/dashboard/alerts');
    }

    /**
     * Get system performance metrics
     * @returns {Promise} Performance metrics
     */
    async getSystemPerformance() {
        return this.get('/dashboard/performance');
    }

    // ============================================
    // Poli API Methods
    // ============================================

    /**
     * Get all poli
     * @param {object} params - Query parameters
     * @returns {Promise} Poli list
     */
    async getPoli(params = {}) {
        return this.get('/poli', params);
    }

    /**
     * Get poli by ID
     * @param {number} id - Poli ID
     * @returns {Promise} Poli data
     */
    async getPoliById(id) {
        return this.get(`/poli/${id}`);
    }

    /**
     * Create new poli
     * @param {object} data - Poli data
     * @returns {Promise} Created poli
     */
    async createPoli(data) {
        return this.post('/poli', data);
    }

    /**
     * Update poli
     * @param {number} id - Poli ID
     * @param {object} data - Updated poli data
     * @returns {Promise} Updated poli
     */
    async updatePoli(id, data) {
        return this.put(`/poli/${id}`, data);
    }

    /**
     * Delete poli
     * @param {number} id - Poli ID
     * @returns {Promise} Delete response
     */
    async deletePoli(id) {
        return this.delete(`/poli/${id}`);
    }

    /**
     * Toggle poli status
     * @param {number} id - Poli ID
     * @returns {Promise} Toggle response
     */
    async togglePoliStatus(id) {
        return this.patch(`/poli/${id}/toggle-status`);
    }

    // ============================================
    // Dokter API Methods  
    // ============================================

    /**
     * Get all dokter
     * @param {object} params - Query parameters
     * @returns {Promise} Dokter list
     */
    async getDokter(params = {}) {
        return this.get('/dokter', params);
    }

    /**
     * Get dokter by ID
     * @param {number} id - Dokter ID
     * @returns {Promise} Dokter data
     */
    async getDokterById(id) {
        return this.get(`/dokter/${id}`);
    }

    /**
     * Create new dokter
     * @param {object} data - Dokter data
     * @returns {Promise} Created dokter
     */
    async createDokter(data) {
        return this.post('/dokter', data);
    }

    /**
     * Update dokter
     * @param {number} id - Dokter ID
     * @param {object} data - Updated dokter data
     * @returns {Promise} Updated dokter
     */
    async updateDokter(id, data) {
        return this.put(`/dokter/${id}`, data);
    }

    /**
     * Delete dokter
     * @param {number} id - Dokter ID
     * @returns {Promise} Delete response
     */
    async deleteDokter(id) {
        return this.delete(`/dokter/${id}`);
    }

    /**
     * Toggle dokter status
     * @param {number} id - Dokter ID
     * @returns {Promise} Toggle response
     */
    async toggleDokterStatus(id) {
        return this.patch(`/dokter/${id}/toggle-status`);
    }

    /**
     * Get dokter by poli
     * @param {number} poliId - Poli ID
     * @returns {Promise} Dokter list
     */
    async getDokterByPoli(poliId) {
        return this.get(`/dokter/by-poli/${poliId}`);
    }

    // ============================================
    // Users API Methods
    // ============================================

    /**
     * Get all users
     * @param {object} params - Query parameters
     * @returns {Promise} Users list
     */
    async getUsers(params = {}) {
        return this.get('/users', params);
    }

    /**
     * Get user by ID
     * @param {number} id - User ID
     * @returns {Promise} User data
     */
    async getUserById(id) {
        return this.get(`/users/${id}`);
    }

    /**
     * Create new user
     * @param {object} data - User data
     * @returns {Promise} Created user
     */
    async createUser(data) {
        return this.post('/users', data);
    }

    /**
     * Update user
     * @param {number} id - User ID
     * @param {object} data - Updated user data
     * @returns {Promise} Updated user
     */
    async updateUser(id, data) {
        return this.put(`/users/${id}`, data);
    }

    /**
     * Delete user
     * @param {number} id - User ID
     * @returns {Promise} Delete response
     */
    async deleteUser(id) {
        return this.delete(`/users/${id}`);
    }

    /**
     * Toggle user status
     * @param {number} id - User ID
     * @returns {Promise} Toggle response
     */
    async toggleUserStatus(id) {
        return this.patch(`/users/${id}/toggle-status`);
    }

    /**
     * Reset user password
     * @param {number} id - User ID
     * @param {object} data - Password data
     * @returns {Promise} Reset response
     */
    async resetUserPassword(id, data) {
        return this.patch(`/users/${id}/reset-password`, data);
    }

    // ============================================
    // Settings API Methods
    // ============================================

    /**
     * Get all settings
     * @returns {Promise} Settings list
     */
    async getSettings() {
        return this.get('/settings');
    }

    /**
     * Get setting by key
     * @param {string} key - Setting key
     * @returns {Promise} Setting data
     */
    async getSettingByKey(key) {
        return this.get(`/settings/${key}`);
    }

    /**
     * Update setting
     * @param {string} key - Setting key
     * @param {object} data - Setting data
     * @returns {Promise} Updated setting
     */
    async updateSetting(key, data) {
        return this.put(`/settings/${key}`, data);
    }

    /**
     * Batch update settings
     * @param {object} data - Settings data
     * @returns {Promise} Update response
     */
    async batchUpdateSettings(data) {
        return this.post('/settings/batch', data);
    }

    /**
     * Get settings by category
     * @param {string} category - Settings category
     * @returns {Promise} Settings list
     */
    async getSettingsByCategory(category) {
        return this.get(`/settings/categories`, { category });
    }

    // ============================================
    // Antrian API Methods (for dashboard)
    // ============================================

    /**
     * Get antrian list
     * @param {object} params - Query parameters
     * @returns {Promise} Antrian list
     */
    async getAntrian(params = {}) {
        return this.get('/antrian', params);
    }

    /**
     * Get antrian by ID
     * @param {number} id - Antrian ID
     * @returns {Promise} Antrian data
     */
    async getAntrianById(id) {
        return this.get(`/antrian/${id}`);
    }
}

// Create global API instance
const API = new AdminAPI();

// Make API globally available
window.API = API;
