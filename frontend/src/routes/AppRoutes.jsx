import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import ProtectedRoute from '../components/ProtectedRoute';

// Pages
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Profile from '../pages/Profile';

// Role Dashboards
import DriverDashboard from '../pages/dashboards/DriverDashboard';
import HostDashboard from '../pages/dashboards/HostDashboard';
import LegacyAdminDashboard from '../pages/dashboards/AdminDashboard';

// Admin Layout & Suite Pages
import AdminLayout from '../layouts/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminHosts from '../pages/admin/AdminHosts';
import AdminParking from '../pages/admin/AdminParking';
import AdminBookings from '../pages/admin/AdminBookings';
import AdminPayments from '../pages/admin/AdminPayments';
import AdminVerification from '../pages/admin/AdminVerification';
import AdminReviews from '../pages/admin/AdminReviews';
import AdminDisputes from '../pages/admin/AdminDisputes';
import AdminAnalytics from '../pages/admin/AdminAnalytics';

// Parking Marketplace Pages
import BrowseParking from '../pages/parking/BrowseParking';
import ParkingDetails from '../pages/parking/ParkingDetails';
import MyListings from '../pages/host/MyListings';
import AddParking from '../pages/host/AddParking';
import EditParking from '../pages/host/EditParking';

// Booking Pages
import BookingCheckout from '../pages/booking/BookingCheckout';
import MyBookings from '../pages/booking/MyBookings';
import BookingDetails from '../pages/booking/BookingDetails';
import HostBookings from '../pages/host/HostBookings';
import QRBookingPass from '../pages/booking/QRBookingPass';

// Payment & Scanner Pages
import PaymentCheckout from '../pages/payment/PaymentCheckout';
import BookingSuccess from '../pages/payment/BookingSuccess';
import HostScanner from '../pages/host/HostScanner';

// Trust & Communication Pages
import HostVerification from '../pages/trust/HostVerification';
import ReviewsPage from '../pages/trust/ReviewsPage';
import FavoritesPage from '../pages/trust/FavoritesPage';
import NotificationsPage from '../pages/trust/NotificationsPage';
import DisputesPage from '../pages/trust/DisputesPage';

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/parking" element={<BrowseParking />} />
        <Route path="/parking/:id" element={<ParkingDetails />} />

        {/* Protected — any authenticated user */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking/:parkingId"
          element={
            <ProtectedRoute>
              <BookingCheckout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings/:id"
          element={
            <ProtectedRoute>
              <BookingDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/:bookingId"
          element={
            <ProtectedRoute>
              <PaymentCheckout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking-success"
          element={
            <ProtectedRoute>
              <BookingSuccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking/:id/qr"
          element={
            <ProtectedRoute>
              <QRBookingPass />
            </ProtectedRoute>
          }
        />
        <Route
          path="/verification"
          element={
            <ProtectedRoute>
              <HostVerification />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reviews"
          element={
            <ProtectedRoute>
              <ReviewsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <FavoritesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/disputes"
          element={
            <ProtectedRoute>
              <DisputesPage />
            </ProtectedRoute>
          }
        />

        {/* Role-based dashboards */}
        <Route
          path="/driver/dashboard"
          element={
            <ProtectedRoute allowedRoles={['DRIVER']}>
              <DriverDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/host/dashboard"
          element={
            <ProtectedRoute allowedRoles={['HOST']}>
              <HostDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/host/parking"
          element={
            <ProtectedRoute allowedRoles={['HOST']}>
              <MyListings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/host/parking/add"
          element={
            <ProtectedRoute allowedRoles={['HOST']}>
              <AddParking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/host/parking/edit/:id"
          element={
            <ProtectedRoute allowedRoles={['HOST']}>
              <EditParking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/host/bookings"
          element={
            <ProtectedRoute allowedRoles={['HOST']}>
              <HostBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/host/scanner"
          element={
            <ProtectedRoute allowedRoles={['HOST', 'ADMIN']}>
              <HostScanner />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Admin Operations Console — Protected to ADMIN role only with dedicated responsive layout */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/hosts" element={<AdminHosts />} />
        <Route path="/admin/parking" element={<AdminParking />} />
        <Route path="/admin/bookings" element={<AdminBookings />} />
        <Route path="/admin/payments" element={<AdminPayments />} />
        <Route path="/admin/verification" element={<AdminVerification />} />
        <Route path="/admin/reviews" element={<AdminReviews />} />
        <Route path="/admin/disputes" element={<AdminDisputes />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
