// api.js - API Client для работы с backend
class FitnessAPI {
    constructor(baseURL = 'http://localhost:3000') {
        this.baseURL = baseURL;
        this.telegramUser = null;
    }

    // Инициализация с данными Telegram
    init(telegramUser) {
        this.telegramUser = telegramUser;
    }

    // Получить headers с авторизацией
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'X-Telegram-Id': this.telegramUser?.id || '',
            'X-Telegram-Username': this.telegramUser?.username || '',
            'X-Telegram-Firstname': this.telegramUser?.first_name || '',
            'X-Telegram-Lastname': this.telegramUser?.last_name || ''
        };
    }

    // Generic request method
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                ...options,
                headers: {
                    ...this.getHeaders(),
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // === USER API ===
    async getUser() {
        return this.request('/api/user');
    }

    async updateUser(data) {
        return this.request('/api/user', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // === MEASUREMENTS API ===
    async getMeasurements() {
        return this.request('/api/measurements');
    }

    async getLatestMeasurement() {
        return this.request('/api/measurements/latest');
    }

    async saveMeasurement(formData) {
        const headers = this.getHeaders();
        delete headers['Content-Type']; // Let browser set it for FormData

        return this.request('/api/measurements', {
            method: 'POST',
            headers,
            body: formData
        });
    }

    // === NUTRITION API ===
    async getNutrition(date) {
        const dateParam = date ? `?date=${date}` : '';
        return this.request(`/api/nutrition${dateParam}`);
    }

    async saveNutrition(data) {
        return this.request('/api/nutrition', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async markMealEaten(nutritionId, mealId, formData) {
        const headers = this.getHeaders();
        delete headers['Content-Type'];

        return this.request(`/api/nutrition/${nutritionId}/meal/${mealId}`, {
            method: 'PUT',
            headers,
            body: formData
        });
    }

    async updateWater(nutritionId, amount) {
        return this.request(`/api/nutrition/${nutritionId}/water`, {
            method: 'PUT',
            body: JSON.stringify({ amount })
        });
    }

    // === CONDITION API ===
    async getConditions() {
        return this.request('/api/conditions');
    }

    async getLatestCondition() {
        return this.request('/api/conditions/latest');
    }

    async saveCondition(data) {
        return this.request('/api/conditions', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // === WORKOUT API ===
    async getWorkouts() {
        return this.request('/api/workouts');
    }

    async getTodayWorkout() {
        return this.request('/api/workouts/today');
    }

    async saveWorkout(data) {
        return this.request('/api/workouts', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateExercise(workoutId, exerciseId, formData) {
        const headers = this.getHeaders();
        delete headers['Content-Type'];

        return this.request(`/api/workouts/${workoutId}/exercise/${exerciseId}`, {
            method: 'PUT',
            headers,
            body: formData
        });
    }

    async completeWorkout(workoutId, rating, notes) {
        return this.request(`/api/workouts/${workoutId}/complete`, {
            method: 'PUT',
            body: JSON.stringify({ rating, notes })
        });
    }

    // === CHAT API ===
    async getMessages() {
        return this.request('/api/messages');
    }

    async sendMessage(content, messageType = 'text', file = null) {
        if (file) {
            const formData = new FormData();
            formData.append('content', content);
            formData.append('messageType', messageType);
            formData.append('file', file);

            const headers = this.getHeaders();
            delete headers['Content-Type'];

            return this.request('/api/messages', {
                method: 'POST',
                headers,
                body: formData
            });
        } else {
            return this.request('/api/messages', {
                method: 'POST',
                body: JSON.stringify({ content, messageType })
            });
        }
    }

    // === STATISTICS API ===
    async getStats() {
        return this.request('/api/stats');
    }
}

// Export для использования
const api = new FitnessAPI();
