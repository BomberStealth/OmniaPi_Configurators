import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="cfg-layout">
      <Navbar />
      <main className="cfg-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
