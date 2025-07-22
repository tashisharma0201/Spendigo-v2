import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// ✅ Removed direct Supabase import to prevent session conflicts
import {
  Menu as Hamburger,
  X,
  Plus,
  BarChart3,
  LogOut,
} from 'lucide-react';

// ✅ Improved Rupee Icon Component
const RupeeIcon = ({ size = 24, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor"
    className={className}
  >
    <path d="M7 6h8M7 10h6.5M7 6v4m0 0L15 18H7l6-8" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none" />
  </svg>
);

// Alternative Rupee Icon using Unicode character
const RupeeIconText = ({ size = 24, className = '' }) => (
  <div 
    className={`flex items-center justify-center font-bold ${className}`}
    style={{ 
      fontSize: `${size * 0.8}px`, 
      width: `${size}px`, 
      height: `${size}px`,
      lineHeight: 1 
    }}
  >
    ₹
  </div>
);

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // ✅ Fixed: Import logout from AuthContext
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => setIsMobileMenuOpen(false), [location.pathname]);

  // Close mobile menu on window resize
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ✅ Fixed: Proper logout using AuthContext
 // ✅ Enhanced logout with force logout fallback
const handleLogout = async () => {
  setIsMobileMenuOpen(false);
  setIsLoggingOut(true);
  
  try {
    console.log('Initiating logout...');
    
    // Use AuthContext logout method
    const result = await logout();
    
    if (result.success) {
      if (result.forced) {
        console.log('Force logout completed, redirecting...');
        // Don't navigate here - forceLogout will reload the page
        return;
      } else {
        console.log('Normal logout successful, redirecting...');
        navigate('/auth', { replace: true });
      }
    } else {
      console.error('Logout failed:', result.error);
      // Last resort: force page reload to clear everything
      window.location.href = '/auth';
    }
  } catch (error) {
    console.error('Unexpected logout error:', error);
    // Emergency fallback: force page reload
    window.location.href = '/auth';
  } finally {
    setIsLoggingOut(false);
  }
};


  const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);

  // Don't render navigation if no user is authenticated
  if (!user) return null;

  const navLinkClass = path =>
    `flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
      location.pathname === path
        ? 'bg-slate-600 text-white shadow-lg'
        : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
    }`;

  return (
    <>
      {/* Main Navigation Bar - Dark Theme */}
      <nav className="bg-slate-800 shadow-lg border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link 
              to="/add-expense" 
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="bg-white p-2 rounded-lg">
                <RupeeIconText size={24} className="text-slate-800" />
              </div>
              <span className="text-2xl font-bold text-white">
                Spendigo
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              <Link
                to="/add-expense"
                className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-all duration-200 font-medium ${
                  location.pathname === '/add-expense'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Add Expense</span>
              </Link>

              <Link
                to="/dashboard"
                className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-all duration-200 font-medium ${
                  location.pathname === '/dashboard'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center space-x-2 px-6 py-2 rounded-lg transition-all duration-200 font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                title={isLoggingOut ? 'Logging out...' : 'Logout from account'}
              >
                <LogOut className={`w-4 h-4 ${isLoggingOut ? 'animate-spin' : ''}`} />
                <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-600/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
                aria-expanded={isMobileMenuOpen}
                aria-label="Toggle navigation menu"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Hamburger className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu - Dark Theme */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-slate-800 border-t border-slate-700">
              <Link
                to="/add-expense"
                className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors ${
                  location.pathname === '/add-expense'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Plus className="w-5 h-5" />
                <span>Add Expense</span>
              </Link>

              <Link
                to="/dashboard"
                className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors ${
                  location.pathname === '/dashboard'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <BarChart3 className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium bg-green-600 text-white hover:bg-green-700 w-full text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className={`w-5 h-5 ${isLoggingOut ? 'animate-spin' : ''}`} />
                <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navigation;
