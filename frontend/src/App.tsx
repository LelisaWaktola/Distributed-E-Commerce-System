import { BrowserRouter, Routes, Route } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import DistributedMonitorPage from './pages/DistributedMonitorPage';

function Layout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <CartProvider>
                    <Toaster position="top-right" toastOptions={{ style: { fontSize: '14px' } }} />
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/" element={<Layout><HomePage /></Layout>} />
                        <Route path="/products" element={<Layout><ProductsPage /></Layout>} />
                        <Route path="/products/:slug" element={<Layout><ProductDetailPage /></Layout>} />
                        <Route path="/cart" element={<Layout><CartPage /></Layout>} />
                        <Route path="/checkout" element={<Layout><CheckoutPage /></Layout>} />
                        <Route path="/orders" element={<Layout><OrdersPage /></Layout>} />
                        <Route path="/admin" element={<Layout><AdminPage /></Layout>} />
                        <Route path="/distributed" element={<Layout><DistributedMonitorPage /></Layout>} />
                    </Routes>
                </CartProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
