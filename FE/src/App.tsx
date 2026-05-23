import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import FotovoltaicoPage from './pages/fotovoltaico/FotovoltaicoPage';

export default function App() {
  return (
    <BrowserRouter basename="/configuratori">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/fotovoltaico" element={<FotovoltaicoPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
