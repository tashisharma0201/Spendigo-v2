import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Menu as Hamburger,
  X,
  Plus,
  BarChart3,
  LogOut,
} from 'lucide-react';

// Custom Rupee Icon Component
const RupeeIcon = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M6 3h12" />
    <path d="M6 8h12" />
    <path d="m6 13 8.5 8" />
    <path d="M6 13h3" />
    <path d="M9 13c6.667 0 6.667-10 0-10" />
  </svg>
);

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
    await logout();
    navigate('/auth');
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(open => !open);

  if (!user) return null;

  const navLinkClass = path =>
    `flex items-center space-x-2 px-4 py-2 rounded transition-colors ${
      location.pathname === path
        ? 'bg-gray-900 text-white'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`;

  return (
    <>
      <nav className="bg-white sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link
              to="/dashboard"
              className="flex items-center space-x-3"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="p-2 bg-gray-900 text-white rounded">
                <RupeeIcon size={20} />
              </div>
              <span className="hidden sm:block text-xl font-bold text-gray-900">
                Spendigo
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                to="/add-expense"
                title="Add Expense"
                className={navLinkClass('/add-expense')}
              >
                <Plus size={18} />
                <span>Add Expense</span>
              </Link>

              <Link
                to="/dashboard"
                title="Dashboard"
                className={navLinkClass('/dashboard')}
              >
                <BarChart3 size={18} />
                <span>Dashboard</span>
              </Link>

              <button
                onClick={handleLogout}
                title="Logout"
                className="flex items-center space-x-2 px-4 py-2 rounded text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className={`p-2 rounded ${
                  isMobileMenuOpen
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Hamburger size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div
          className={`md:hidden bg-white border-t border-gray-200 overflow-hidden transition-[max-height] duration-300 ${
            isMobileMenuOpen ? 'max-h-60' : 'max-h-0'
          }`}
        >
          <div className="py-2 space-y-1 px-4">
            <Link
              to="/add-expense"
              onClick={toggleMobileMenu}
              className={navLinkClass('/add-expense')}
            >
              <Plus size={20} />
              <span>Add Expense</span>
            </Link>

            <Link
              to="/dashboard"
              onClick={toggleMobileMenu}
              className={navLinkClass('/dashboard')}
            >
              <BarChart3 size={20} />
              <span>Dashboard</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 w-full text-left text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors rounded"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navigation;
