import { Routes, Route } from 'react-router-dom'
import Home          from './pages/Home'
import Category      from './pages/Category'
import AdminLogin    from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'

export default function App() {
  return (
    <Routes>
      <Route path="/"                  element={<Home />} />
      <Route path="/home"              element={<Home />} />
      <Route path="/category/:slug"    element={<Category />} />
      <Route path="/admin/login"       element={<AdminLogin />} />
      <Route path="/admin/dashboard"   element={<AdminDashboard />} />
      {/* Catch-all */}
      <Route path="*" element={<Home />} />
    </Routes>
  )
}