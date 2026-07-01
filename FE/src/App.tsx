import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import FotovoltaicoPage from './pages/fotovoltaico/FotovoltaicoPage';
import WesternPage from './pages/western/WesternPage';
import PreseInterbloccatePage from './pages/preseinterbloccate/PreseInterbloccatePage';
import InfoPage from './pages/InfoPage';

export default function App() {
  return (
    <BrowserRouter basename="/configuratori">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/fotovoltaico" element={<FotovoltaicoPage />} />
          <Route path="/western" element={<WesternPage />} />
          <Route path="/prese-interbloccate" element={<PreseInterbloccatePage />} />
          <Route path="/info" element={<InfoPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
