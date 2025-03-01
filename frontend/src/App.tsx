import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import UserLayout from './routes/user/UserLayout';
import AdminLayout from './routes/admin/AdminLayout';

// User routes
import Dashboard from './routes/user/Dashboard';
import NFCScan from './routes/user/NFCScan';
import Collections from './routes/user/Collections';

// Admin routes
import AdminDashboard from './routes/admin/Dashboard';
import NFCCards from './routes/admin/NFCCards';
import LuxuryItems from './routes/admin/LuxuryItems';
import Purchases from './routes/admin/Purchases';
import LuxuryAuthentication from './routes/admin/LuxuryAuthentication';

// Other components
import Landing from './routes/Landing';
import NotFound from './routes/NotFound';
import './App.css';

function App() {
    const router = createBrowserRouter([
        {
            path: '/',
            element: <MainLayout />,
            children: [
                {
                    index: true,
                    element: <Landing />,
                },
                // Direct scan route for easier access
                {
                    path: 'scan',
                    element: <NFCScan />,
                },
                // User routes - authenticated users
                {
                    path: 'user',
                    element: <UserLayout />,
                    children: [
                        {
                            index: true,
                            element: <Dashboard />,
                        },
                        {
                            path: 'scan',
                            element: <NFCScan />,
                        },
                        {
                            path: 'collections',
                            element: <Collections />,
                        },
                    ],
                },
                // Admin routes
                {
                    path: 'admin',
                    element: <AdminLayout />,
                    children: [
                        {
                            index: true,
                            element: <AdminDashboard />,
                        },
                        {
                            path: 'nfc-cards',
                            element: <NFCCards />,
                        },
                        {
                            path: 'luxury-items',
                            element: <LuxuryItems />,
                        },
                        {
                            path: 'purchases',
                            element: <Purchases />,
                        },
                        {
                            path: 'luxury-authentication',
                            element: <LuxuryAuthentication />,
                        },
                    ],
                },
                {
                    path: '*',
                    element: <NotFound />,
                },
            ],
        },
    ]);

    return <RouterProvider router={router} />;
}

export default App;
