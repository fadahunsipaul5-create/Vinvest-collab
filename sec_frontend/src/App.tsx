import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/home';
import Login from './components/login';
import Register from './components/register';
import RequestPasswordReset from './components/request-password-reset';
import PasswordReset from './components/password-reset';
import EmailVerification from './components/email-verification';
import Dashboard from './pages/Dashboard/Dashboard';
import Overview from './components/overview';
import Profile from './components/profile';
import PaymentSuccess from './components/payment-success';
import PaymentCancel from './components/payment-cancel';
import ValuationPage from './components/ValuationPage';
import BalanceSheet from './components/BalanceSheet';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { CompanyDataProvider } from './contexts/CompanyDataContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './App.css';

// Check if user is authenticated
const isAuthenticated = !!localStorage.getItem("access");
// Replace this with your actual Google OAuth Client ID
const GOOGLE_CLIENT_ID = '791634680391-elnan8tnv6tp3247anotm14g6g671uvi.apps.googleusercontent.com';

function App() {
  return (
    <ThemeProvider>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <CompanyDataProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/register" replace />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/email-verification" element={<EmailVerification />} />
            <Route path="/request-password-reset" element={<RequestPasswordReset />} />
            <Route path="/password-reset" element={<PasswordReset />} />
            <Route path="/home" element={<Home />} />
            <Route
              path="/profile"
              element={isAuthenticated ? <Profile /> : <Navigate to="/register" />}
            />
            <Route
              path="/dashboard"
              element={isAuthenticated ? <Dashboard /> : <Navigate to="/register" />}
            />
            <Route
              path="/overview"
              element={isAuthenticated ? <Overview selectedTicker="AAPL" /> : <Navigate to="/register" />}
            />
            <Route
              path="/valuation"
              element={isAuthenticated ? <ValuationPage /> : <Navigate to="/register" />}
            />
            <Route
              path="/balance-sheet"
              element={isAuthenticated ? <BalanceSheet /> : <Navigate to="/register" />}
            />
            <Route path="/success" element={<PaymentSuccess />} />
            <Route path="/cancel" element={<PaymentCancel />} />
          </Routes>
        </Router>
      </CompanyDataProvider>
    </GoogleOAuthProvider>
    </ThemeProvider>
  );
}

export default App;
