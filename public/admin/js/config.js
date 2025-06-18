// Configuration constants for Admin Panel
const CONFIG = {
    // API Configuration
    API_BASE_URL: '/api',
    API_TIMEOUT: 10000,
    
    // Authentication
    TOKEN_KEY: 'rsud_admin_token',
    USER_KEY: 'rsud_admin_user',
    REFRESH_TOKEN_KEY: 'rsud_admin_refresh_token',
    
    // UI Configuration
    DEBOUNCE_DELAY: 300,
    TOAST_DURATION: 5000,
    MODAL_ANIMATION_DURATION: 300,
    
    // Pagination
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
    
    // Data Refresh Intervals (in milliseconds)
    DASHBOARD_REFRESH_INTERVAL: 30000, // 30 seconds
    STATS_REFRESH_INTERVAL: 60000,     // 1 minute
    
    // File Upload
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
    
    // Validation Rules
    VALIDATION: {
        USERNAME_MIN_LENGTH: 3,
        USERNAME_MAX_LENGTH: 50,
        PASSWORD_MIN_LENGTH: 6,
        NAME_MIN_LENGTH: 2,
        NAME_MAX_LENGTH: 100
    },
    
    // Status Constants
    STATUS: {
        ACTIVE: 'aktif',
        INACTIVE: 'tidak_aktif',
        PENDING: 'pending',
        COMPLETED: 'selesai',
        CANCELLED: 'batal'
    },
    
    // User Roles
    ROLES: {
        ADMIN: 'admin',
        PETUGAS: 'petugas'
    },
    
    // Queue Status
    QUEUE_STATUS: {
        WAITING: 'MENUNGGU',
        CALLED: 'DIPANGGIL', 
        IN_PROGRESS: 'SEDANG_DILAYANI',
        COMPLETED: 'SELESAI',
        SKIPPED: 'TERLEWAT',
        CANCELLED: 'BATAL'
    },
    
    // Alert Types
    ALERT_TYPES: {
        SUCCESS: 'success',
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info'
    },
    
    // HTTP Status Codes
    HTTP_STATUS: {
        OK: 200,
        CREATED: 201,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        INTERNAL_SERVER_ERROR: 500
    },
    
    // Local Storage Keys
    STORAGE_KEYS: {
        SIDEBAR_COLLAPSED: 'sidebar_collapsed',
        THEME_PREFERENCE: 'theme_preference',
        LAST_ACTIVE_PAGE: 'last_active_page',
        TABLE_PAGE_SIZE: 'table_page_size'
    },
    
    // Date/Time Formats
    DATE_FORMATS: {
        DISPLAY: 'DD/MM/YYYY',
        DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm',
        API: 'YYYY-MM-DD',
        API_WITH_TIME: 'YYYY-MM-DD HH:mm:ss'
    },
    
    // Regular Expressions
    REGEX: {
        EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        PHONE: /^(\+62|62|0)[0-9]{9,13}$/,
        ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
        ALPHANUMERIC_SPACE: /^[a-zA-Z0-9\s]+$/
    },
    
    // Error Messages
    MESSAGES: {
        NETWORK_ERROR: 'Terjadi kesalahan jaringan. Silakan coba lagi.',
        SESSION_EXPIRED: 'Sesi Anda telah berakhir. Silakan login kembali.',
        ACCESS_DENIED: 'Anda tidak memiliki akses untuk melakukan operasi ini.',
        DATA_NOT_FOUND: 'Data tidak ditemukan.',
        VALIDATION_ERROR: 'Data yang dimasukkan tidak valid.',
        SAVE_SUCCESS: 'Data berhasil disimpan.',
        UPDATE_SUCCESS: 'Data berhasil diperbarui.',
        DELETE_SUCCESS: 'Data berhasil dihapus.',
        DELETE_CONFIRM: 'Apakah Anda yakin ingin menghapus data ini?',
        UNSAVED_CHANGES: 'Anda memiliki perubahan yang belum disimpan. Yakin ingin keluar?'
    },
    
    // Chart Colors
    CHART_COLORS: {
        PRIMARY: '#2563eb',
        SUCCESS: '#10b981',
        WARNING: '#f59e0b',
        ERROR: '#ef4444',
        INFO: '#06b6d4',
        GRAY: '#6b7280'
    }
};

// Environment-specific configurations
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    CONFIG.DEBUG = true;
    CONFIG.API_TIMEOUT = 30000; // Longer timeout for development
} else {
    CONFIG.DEBUG = false;
}

// Browser capability detection
CONFIG.BROWSER_SUPPORT = {
    localStorage: typeof(Storage) !== "undefined",
    fetch: typeof(fetch) !== "undefined",
    promise: typeof(Promise) !== "undefined",
    arrow: (function() {
        try {
            eval("(x) => x");
            return true;
        } catch (e) {
            return false;
        }
    })()
};

// Freeze configuration to prevent modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.VALIDATION);
Object.freeze(CONFIG.STATUS);
Object.freeze(CONFIG.ROLES);
Object.freeze(CONFIG.QUEUE_STATUS);
Object.freeze(CONFIG.ALERT_TYPES);
Object.freeze(CONFIG.HTTP_STATUS);
Object.freeze(CONFIG.STORAGE_KEYS);
Object.freeze(CONFIG.DATE_FORMATS);
Object.freeze(CONFIG.REGEX);
Object.freeze(CONFIG.MESSAGES);
Object.freeze(CONFIG.CHART_COLORS);
Object.freeze(CONFIG.BROWSER_SUPPORT);

// Export for module usage (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
