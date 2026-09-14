import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './hooks/useAuth';
import { API_BASE_URL } from './lib/api';

// Auth Pages
import Login from './pages/auth/Login';

// Dashboard
import Dashboard from './pages/dashboard/Dashboard';

// Products
import ProductList from './pages/products/ProductList';
import ProductAdd from './pages/products/ProductAdd';
import ProductEdit from './pages/products/ProductEdit';
import ProductReferenceList from './pages/products/ProductReferenceList';

// Orders
import OrderList from './pages/orders/OrderList';
import OrderDetail from './pages/orders/OrderDetail';

// Categories
import CategoryList from './pages/categories/CategoryList';
import CategoryForm from './pages/categories/CategoryForm';

// Customers
import CustomerList from './pages/customers/CustomerList';

// Settings Pages
import DeliverySettings from './pages/settings/DeliverySettings';
import PaymentSettings from './pages/settings/PaymentSettings';
import OrderConsultants from './pages/orders/OrderConsultants';
import SupportPlaceholder from './pages/support/SupportPlaceholder';

// Error Pages
import NotFound from './pages/errors/NotFound';

// Layout
import { AdminLayout } from './components/layout/AdminLayout';

// Simple auth bypass for development
const DEV_LOGIN = false;

function AppRoutes() {
  const { user, isLoading, authError, retry, lastMeStatus } = useAuth();

  // Dev mode: auto-login as admin
  const effectiveUser = DEV_LOGIN
    ? {
        id: '1',
        username: 'Admin',
        email: 'admin@example.com',
        role: 'super_admin' as const,
        permissions: {
          products: { create: true, read: true, update: true, delete: true },
          orders: { create: true, read: true, update: true, delete: true },
          settings: { update: true },
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        passwordHash: '',
      }
    : user;

  if (isLoading) {
    return null;
  }

  const token = localStorage.getItem('admin_token');
  if (!effectiveUser && token && authError === 'offline') {
    const apiHint = API_BASE_URL ? API_BASE_URL : `${window.location.origin} (via /api proxy)`
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
          <h2 style={{ marginBottom: 8 }}>Backend not reachable</h2>
          <p style={{ margin: 0, opacity: 0.8 }}>
            The API on <code>{apiHint}</code> isn’t responding. You’re still logged in locally.
            Please start the backend and retry.
          </p>
          <p style={{ marginTop: 8, marginBottom: 0, opacity: 0.7, fontSize: 12 }}>
            Debug: last <code>/api/auth/me</code> status = <code>{lastMeStatus ?? 'network error'}</code>
          </p>
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 12 }}>
            <button onClick={retry} style={{ padding: '10px 16px', borderRadius: 8, cursor: 'pointer' }}>
              Retry
            </button>
            <button onClick={() => window.location.reload()} style={{ padding: '10px 16px', borderRadius: 8, cursor: 'pointer' }}>
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes */}
      <Route path="/" element={effectiveUser ? <AdminLayout /> : <Navigate to="/login" replace />}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Products */}
        <Route path="products" element={<ProductList />} />
        <Route path="product-list" element={<ProductReferenceList />} />
        <Route path="products/add" element={<ProductAdd />} />
        <Route path="products/:id" element={<ProductEdit />} />

        {/* Categories */}
        <Route path="categories" element={<CategoryList />} />
        <Route path="categories/new" element={<CategoryForm />} />
        <Route path="categories/:id/edit" element={<CategoryForm />} />

        {/* Orders */}
        <Route path="orders" element={<OrderList />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="order-consultants" element={<OrderConsultants />} />

        {/* Customers */}
        <Route path="customers" element={<CustomerList />} />

        {/* Settings */}
        <Route path="settings" element={<Navigate to="/settings/delivery" replace />} />
        <Route path="settings/delivery" element={<DeliverySettings />} />
        <Route path="settings/payment" element={<PaymentSettings />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
