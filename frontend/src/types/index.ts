export interface User {
    id: string;
    email: string;
    username: string;
    full_name: string;
    phone: string;
    avatar_url: string;
    role: 'customer' | 'admin';
    is_active: boolean;
    created_at: string;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    description: string;
    image_url: string;
    is_active: boolean;
}

export interface Product {
    id: string;
    category_id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    original_price: number | null;
    stock_quantity: number;
    sku: string;
    image_url: string;
    images: string[];
    tags: string[];
    rating: number;
    review_count: number;
    is_active: boolean;
    is_featured: boolean;
    created_at: string;
    categories?: Category;
}

export interface CartItem {
    id: string;
    user_id: string;
    product_id: string;
    quantity: number;
    added_at: string;
    products?: Product;
}

export interface Order {
    id: string;
    order_number: string;
    user_id: string;
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
    subtotal: number;
    shipping_cost: number;
    tax_amount: number;
    total_amount: number;
    shipping_address: ShippingAddress;
    notes: string;
    placed_at: string;
    confirmed_at: string | null;
    shipped_at: string | null;
    delivered_at: string | null;
    cancelled_at: string | null;
    order_items?: OrderItem[];
    payments?: Payment[];
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string;
    product_name: string;
    product_sku: string;
    product_image: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

export interface Payment {
    id: string;
    order_id: string;
    user_id: string;
    amount: number;
    currency: string;
    method: 'card' | 'paypal' | 'bank_transfer' | 'crypto' | 'cash_on_delivery';
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
    transaction_id: string | null;
    card_last_four: string | null;
    card_brand: string | null;
    processed_at: string | null;
    created_at: string;
}

export interface ShippingAddress {
    full_name: string;
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    phone: string;
}

export interface ServiceHealth {
    id: string;
    service_name: string;
    node_id: string;
    status: 'healthy' | 'degraded' | 'down';
    port: number;
    last_ping: string;
    uptime_seconds: number;
    request_count: number;
    error_count: number;
    avg_response_ms: number;
}

export interface InterServiceCall {
    id: string;
    from_service: string;
    to_service: string;
    endpoint: string;
    method: string;
    status_code: number;
    response_time_ms: number;
    success: boolean;
    error_message: string | null;
    called_at: string;
}
