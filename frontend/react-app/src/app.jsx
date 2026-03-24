import { Routes, Route, Navigate } from 'react-router-dom'
import Login         from './pages/Login'
import Home          from './pages/Home'
import Contact       from './pages/Contact'
import Category      from './pages/Category'
import AdminLogin    from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'

export default function App() {
  return (
    <Routes>
      <Route path="/"                  element={<Login />} />
      <Route path="/home"              element={<Home />} />
      <Route path="/contact"           element={<Contact />} />
      <Route path="/category/:slug"    element={<Category />} />
      <Route path="/admin/login"       element={<AdminLogin />} />
      <Route path="/admin/dashboard"   element={<AdminDashboard />} />
      {/* Catch-all */}
      <Route path="*" element={<h1>404 Not Found</h1>} />
    </Routes>
  )
} 