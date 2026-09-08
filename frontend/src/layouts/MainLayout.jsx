import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-surface-200 bg-white/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-surface-700">
              &copy; {new Date().getFullYear()} ParkShare. All rights reserved.
            </p>
            <p className="text-xs text-surface-700">
              Built with ❤️ for smarter parking
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
