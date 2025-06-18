// Utility functions for Admin Panel
const Utils = {
    /**
     * Debounce function to limit the rate of function execution
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @param {boolean} immediate - Execute immediately
     * @returns {Function} Debounced function
     */
    debounce(func, wait = CONFIG.DEBOUNCE_DELAY, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },

    /**
     * Throttle function to limit function execution rate
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    throttle(func, limit = 100) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Format date to localized string
     * @param {Date|string} date - Date to format
     * @param {string} format - Format type
     * @returns {string} Formatted date
     */
    formatDate(date, format = 'DISPLAY') {
        if (!date) return '-';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '-';

        const options = {
            DISPLAY: {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric'
            },
            DISPLAY_WITH_TIME: {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            },
            RELATIVE: null // Will use relative format
        };

        if (format === 'RELATIVE') {
            return this.getRelativeTime(d);
        }

        return d.toLocaleDateString('id-ID', options[format] || options.DISPLAY);
    },

    /**
     * Get relative time (e.g., "2 hours ago")
     * @param {Date} date - Date to convert
     * @returns {string} Relative time string
     */
    getRelativeTime(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'baru saja';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} hari lalu`;
        if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} bulan lalu`;
        return `${Math.floor(diffInSeconds / 31536000)} tahun lalu`;
    },

    /**
     * Format number with thousand separators
     * @param {number} num - Number to format
     * @returns {string} Formatted number
     */
    formatNumber(num) {
        if (num === null || num === undefined) return '0';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    },

    /**
     * Format currency in Indonesian Rupiah
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency
     */
    formatCurrency(amount) {
        if (amount === null || amount === undefined) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    },

    /**
     * Sanitize HTML to prevent XSS
     * @param {string} str - String to sanitize
     * @returns {string} Sanitized string
     */
    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Generate unique ID
     * @param {string} prefix - ID prefix
     * @returns {string} Unique ID
     */
    generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Deep clone an object
     * @param {any} obj - Object to clone
     * @returns {any} Cloned object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    },

    /**
     * Check if object is empty
     * @param {object} obj - Object to check
     * @returns {boolean} True if empty
     */
    isEmpty(obj) {
        if (obj === null || obj === undefined) return true;
        if (typeof obj === 'string') return obj.trim() === '';
        if (Array.isArray(obj)) return obj.length === 0;
        if (typeof obj === 'object') return Object.keys(obj).length === 0;
        return false;
    },

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid
     */
    isValidEmail(email) {
        return CONFIG.REGEX.EMAIL.test(email);
    },

    /**
     * Validate phone number format (Indonesian)
     * @param {string} phone - Phone number to validate
     * @returns {boolean} True if valid
     */
    isValidPhone(phone) {
        return CONFIG.REGEX.PHONE.test(phone);
    },

    /**
     * Get file extension from filename
     * @param {string} filename - Filename
     * @returns {string} File extension
     */
    getFileExtension(filename) {
        if (!filename) return '';
        return filename.split('.').pop().toLowerCase();
    },

    /**
     * Format file size in human readable format
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Convert string to title case
     * @param {string} str - String to convert
     * @returns {string} Title case string
     */
    toTitleCase(str) {
        if (!str) return '';
        return str.toLowerCase().split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    },

    /**
     * Convert camelCase to kebab-case
     * @param {string} str - String to convert
     * @returns {string} Kebab case string
     */
    toKebabCase(str) {
        return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    },

    /**
     * Convert kebab-case to camelCase
     * @param {string} str - String to convert
     * @returns {string} Camel case string
     */
    toCamelCase(str) {
        return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    },

    /**
     * Truncate text to specified length
     * @param {string} text - Text to truncate
     * @param {number} length - Maximum length
     * @param {string} suffix - Suffix to add
     * @returns {string} Truncated text
     */
    truncateText(text, length = 50, suffix = '...') {
        if (!text || text.length <= length) return text;
        return text.substring(0, length) + suffix;
    },

    /**
     * Get query parameter from URL
     * @param {string} param - Parameter name
     * @returns {string|null} Parameter value
     */
    getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    },

    /**
     * Set query parameter in URL
     * @param {string} param - Parameter name
     * @param {string} value - Parameter value
     */
    setQueryParam(param, value) {
        const url = new URL(window.location);
        url.searchParams.set(param, value);
        window.history.replaceState({}, '', url);
    },

    /**
     * Remove query parameter from URL
     * @param {string} param - Parameter name
     */
    removeQueryParam(param) {
        const url = new URL(window.location);
        url.searchParams.delete(param);
        window.history.replaceState({}, '', url);
    },

    /**
     * Storage helper functions
     */
    storage: {
        set(key, value) {
            if (!CONFIG.BROWSER_SUPPORT.localStorage) return false;
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.warn('LocalStorage set failed:', e);
                return false;
            }
        },

        get(key, defaultValue = null) {
            if (!CONFIG.BROWSER_SUPPORT.localStorage) return defaultValue;
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.warn('LocalStorage get failed:', e);
                return defaultValue;
            }
        },

        remove(key) {
            if (!CONFIG.BROWSER_SUPPORT.localStorage) return false;
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.warn('LocalStorage remove failed:', e);
                return false;
            }
        },

        clear() {
            if (!CONFIG.BROWSER_SUPPORT.localStorage) return false;
            try {
                localStorage.clear();
                return true;
            } catch (e) {
                console.warn('LocalStorage clear failed:', e);
                return false;
            }
        }
    },

    /**
     * DOM helper functions
     */
    dom: {
        /**
         * Get element by ID
         * @param {string} id - Element ID
         * @returns {Element|null} Element
         */
        get(id) {
            return document.getElementById(id);
        },

        /**
         * Query selector
         * @param {string} selector - CSS selector
         * @returns {Element|null} Element
         */
        query(selector) {
            return document.querySelector(selector);
        },

        /**
         * Query selector all
         * @param {string} selector - CSS selector
         * @returns {NodeList} Elements
         */
        queryAll(selector) {
            return document.querySelectorAll(selector);
        },

        /**
         * Create element with attributes
         * @param {string} tag - HTML tag
         * @param {object} attributes - Element attributes
         * @param {string} content - Element content
         * @returns {Element} Created element
         */
        create(tag, attributes = {}, content = '') {
            const element = document.createElement(tag);
            
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'className') {
                    element.className = value;
                } else if (key === 'innerHTML') {
                    element.innerHTML = value;
                } else {
                    element.setAttribute(key, value);
                }
            });

            if (content) {
                element.textContent = content;
            }

            return element;
        },

        /**
         * Add event listener
         * @param {Element|string} element - Element or selector
         * @param {string} event - Event type
         * @param {Function} handler - Event handler
         * @param {object} options - Event options
         */
        on(element, event, handler, options = {}) {
            const el = typeof element === 'string' ? this.query(element) : element;
            if (el) {
                el.addEventListener(event, handler, options);
            }
        },

        /**
         * Remove event listener
         * @param {Element|string} element - Element or selector
         * @param {string} event - Event type
         * @param {Function} handler - Event handler
         */
        off(element, event, handler) {
            const el = typeof element === 'string' ? this.query(element) : element;
            if (el) {
                el.removeEventListener(event, handler);
            }
        },

        /**
         * Add CSS class
         * @param {Element|string} element - Element or selector
         * @param {string} className - CSS class name
         */
        addClass(element, className) {
            const el = typeof element === 'string' ? this.query(element) : element;
            if (el) {
                el.classList.add(className);
            }
        },

        /**
         * Remove CSS class
         * @param {Element|string} element - Element or selector
         * @param {string} className - CSS class name
         */
        removeClass(element, className) {
            const el = typeof element === 'string' ? this.query(element) : element;
            if (el) {
                el.classList.remove(className);
            }
        },

        /**
         * Toggle CSS class
         * @param {Element|string} element - Element or selector
         * @param {string} className - CSS class name
         */
        toggleClass(element, className) {
            const el = typeof element === 'string' ? this.query(element) : element;
            if (el) {
                el.classList.toggle(className);
            }
        },

        /**
         * Check if element has CSS class
         * @param {Element|string} element - Element or selector
         * @param {string} className - CSS class name
         * @returns {boolean} True if has class
         */
        hasClass(element, className) {
            const el = typeof element === 'string' ? this.query(element) : element;
            return el ? el.classList.contains(className) : false;
        }
    },

    /**
     * Validation helper functions
     */
    validate: {
        /**
         * Validate form data
         * @param {object} data - Form data
         * @param {object} rules - Validation rules
         * @returns {object} Validation result
         */
        form(data, rules) {
            const errors = {};
            let isValid = true;

            Object.entries(rules).forEach(([field, rule]) => {
                const value = data[field];
                const fieldErrors = [];

                // Required validation
                if (rule.required && Utils.isEmpty(value)) {
                    fieldErrors.push(`${rule.label || field} wajib diisi`);
                }

                // Min length validation
                if (rule.minLength && value && value.length < rule.minLength) {
                    fieldErrors.push(`${rule.label || field} minimal ${rule.minLength} karakter`);
                }

                // Max length validation
                if (rule.maxLength && value && value.length > rule.maxLength) {
                    fieldErrors.push(`${rule.label || field} maksimal ${rule.maxLength} karakter`);
                }

                // Email validation
                if (rule.email && value && !Utils.isValidEmail(value)) {
                    fieldErrors.push(`${rule.label || field} harus berupa email yang valid`);
                }

                // Phone validation
                if (rule.phone && value && !Utils.isValidPhone(value)) {
                    fieldErrors.push(`${rule.label || field} harus berupa nomor telepon yang valid`);
                }

                // Custom validation
                if (rule.custom && typeof rule.custom === 'function') {
                    const customResult = rule.custom(value, data);
                    if (customResult !== true) {
                        fieldErrors.push(customResult);
                    }
                }

                if (fieldErrors.length > 0) {
                    errors[field] = fieldErrors;
                    isValid = false;
                }
            });

            return { isValid, errors };
        }
    }
};

// Make Utils globally available
window.Utils = Utils;
