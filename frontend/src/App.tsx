import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminUsersPage from './pages/AdminUsersPage';
import CategoriasPage from './pages/CategoriasPage';
import IngredientesPage from './pages/IngredientesPage';
import LoginPage from './pages/LoginPage';
import ProductsPage from './pages/ProductsPage';
import RegisterPage from './pages/RegisterPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// App.tsx sin estado de datos ni llamadas a la API: sólo Navbar + definición de rutas
export default function App() {
  return (
    <div className="min-h-screen bg-stone-100">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          {/* Públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Cualquier usuario autenticado (user o admin) */}
          <Route element={<ProtectedRoute />}>
            {/* Sin sesión, ProtectedRoute lleva a /login */}
            <Route path="/" element={<Navigate to="/categorias" replace />} />
            {/* Los nombres en español vienen del TP8 (su consigna pedía conservarlos) */}
            <Route path="/categorias" element={<CategoriasPage />} />
            <Route path="/productos" element={<ProductsPage />} />
            <Route path="/ingredientes" element={<IngredientesPage />} />
            {/* Alias con los nombres en inglés de la consigna del TP9 */}
            <Route path="/categories" element={<Navigate to="/categorias" replace />} />
            <Route path="/products" element={<Navigate to="/productos" replace />} />
            <Route path="/ingredients" element={<Navigate to="/ingredientes" replace />} />
          </Route>

          {/* Sólo admin */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>

          <Route path="*" element={<p className="text-stone-500">Página no encontrada</p>} />
        </Routes>
      </main>
    </div>
  );
}
