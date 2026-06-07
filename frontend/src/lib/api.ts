const USER_SVC = import.meta.env.VITE_API_USER_SERVICE || 'http://localhost:8081';
const PRODUCT_SVC = import.meta.env.VITE_API_PRODUCT_SERVICE || 'http://localhost:8082';
const ORDER_SVC = import.meta.env.VITE_API_ORDER_SERVICE || 'http://localhost:8083';
const PAYMENT_SVC = import.meta.env.VITE_API_PAYMENT_SERVICE || 'http://localhost:8084';

function getToken(): string | null {
    return localStorage.getItem('auth_token');
}

async function request(url: string, options: RequestInit = {}) {
    const token = getToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || `Request failed: ${res.status}`);
    return data;
}

// User Service API
export const userApi = {
    register: (email: string, password: string, name: string, phone: string = '') =>
        request(`${USER_SVC}/api/users/register`, {
            method: 'POST',
            body: JSON.stringify({ email, password, name, phone }),
        }),

    login: (email: string, password: string) =>
        request(`${USER_SVC}/api/users/login`, {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),

    getProfile: (userId: number) =>
        request(`${USER_SVC}/api/users/${userId}`),

    updateProfile: (userId: number, data: { name?: string; phone?: string }) =>
        request(`${USER_SVC}/api/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    validateToken: (token: string) =>
        request(`${USER_SVC}/api/users/validate/${token}`),

    health: () =>
        request(`${USER_SVC}/api/users/health`),
};

// Product Service API
export const productApi = {
    getAll: (page = 0, size = 20) =>
        request(`${PRODUCT_SVC}/api/products?page=${page}&size=${size}`),

    getById: (id: number) =>
        request(`${PRODUCT_SVC}/api/products/${id}`),

    getBySlug: (slug: string) =>
        request(`${PRODUCT_SVC}/api/products/slug/${slug}`),

    create: (data: any) =>
        request(`${PRODUCT_SVC}/api/products`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    update: (id: number, data: any) =>
        request(`${PRODUCT_SVC}/api/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    delete: (id: number) =>
        request(`${PRODUCT_SVC}/api/products/${id}`, { method: 'DELETE' }),

    checkStock: (id: number) =>
        request(`${PRODUCT_SVC}/api/products/stock/check/${id}`),

    getCategories: () =>
        request(`${PRODUCT_SVC}/api/categories`),

    health: () =>
        request(`${PRODUCT_SVC}/api/products/health`),
};

// Order Service API
export const orderApi = {
    getCart: (userId: number) =>
        request(`${ORDER_SVC}/api/cart/${userId}`),

    addToCart: (userId: number, productId: number, quantity: number = 1) =>
        request(`${ORDER_SVC}/api/cart`, {
            method: 'POST',
            body: JSON.stringify({ userId, productId, quantity }),
        }),

    removeFromCart: (userId: number, productId: number) =>
        request(`${ORDER_SVC}/api/cart/${userId}/${productId}`, { method: 'DELETE' }),

    createOrder: (userId: number, shippingAddress: string, notes: string = '', paymentMethod: string = 'CREDIT_CARD') =>
        request(`${ORDER_SVC}/api/orders`, {
            method: 'POST',
            body: JSON.stringify({ userId, shippingAddress, notes, paymentMethod }),
        }),

    getOrders: (userId: number) =>
        request(`${ORDER_SVC}/api/orders/${userId}`),

    getOrderDetail: (orderId: number) =>
        request(`${ORDER_SVC}/api/orders/detail/${orderId}`),

    health: () =>
        request(`${ORDER_SVC}/api/orders/health`),
};

// Payment Service API
export const paymentApi = {
    getByOrderId: (orderId: number) =>
        request(`${PAYMENT_SVC}/api/payments/${orderId}`),

    getByTransactionId: (transactionId: string) =>
        request(`${PAYMENT_SVC}/api/payments/status/${transactionId}`),

    health: () =>
        request(`${PAYMENT_SVC}/api/payments/health`),
};
