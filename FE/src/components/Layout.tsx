import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
  const location = useLocation();
  return (
    <div className="cfg-layout">
      <Navbar />
      <main className="cfg-main">
        <div key={location.pathname} className="cfg-page-fade">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
