import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import UnauthorizedPage from '../features/auth/pages/UnauthorizedPage';
import AdminCategoriasPage from '../features/categorias/pages/AdminCategoriasPage';
import AdminPedidosPage from '../features/pedidos/pages/AdminPedidosPage';
import AdminResumenPage from '../features/pedidos/pages/AdminResumenPage';
import CarritoPage from '../features/pedidos/pages/CarritoPage';
import CheckoutPage from '../features/pedidos/pages/CheckoutPage';
import MisPedidosPage from '../features/pedidos/pages/MisPedidosPage';
import AdminProductosPage from '../features/productos/pages/AdminProductosPage';
import CatalogoPage from '../features/productos/pages/CatalogoPage';
import AdminUsuariosPage from '../features/usuarios/pages/AdminUsuariosPage';
import EstadoVacio from '../shared/components/EstadoVacio';
import MainLayout from '../shared/layout/MainLayout';
import ProtectedRoute from './ProtectedRoute';

/** Tabla de rutas de la aplicación. */
export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          {/* Públicas */}
          <Route path="/" element={<CatalogoPage />} />
          <Route path="/carrito" element={<CarritoPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Con sesión (user o admin) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/mis-pedidos" element={<MisPedidosPage />} />
          </Route>

          {/* Solo admin */}
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin/resumen" element={<AdminResumenPage />} />
            <Route path="/admin/pedidos" element={<AdminPedidosPage />} />
            <Route path="/admin/productos" element={<AdminProductosPage />} />
            <Route path="/admin/categorias" element={<AdminCategoriasPage />} />
            <Route path="/admin/usuarios" element={<AdminUsuariosPage />} />
          </Route>

          <Route
            path="*"
            element={<EstadoVacio icono="🧭" titulo="Página no encontrada" />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
