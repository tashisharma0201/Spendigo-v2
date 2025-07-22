import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import {
  Eye,
  EyeOff,
  Wallet,
  BarChart3,
  Activity,
  Users,
  Target,
  Plus,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Smartphone,
  Building2,
  Calendar,
  Filter,
  Search,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import avatar2 from './avatar-2.png';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';





/* ─────────────────────────────────────────
   Reusable Modal Component
───────────────────────────────────────── */
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // State Management
  const [expenses, setExpenses] = useState([]);
  const [paymentSources, setPaymentSources] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('month');
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [addBalanceForm, setAddBalanceForm] = useState({
    sourceId: '',
    amount: ''
  });

  // ✅ Fixed: Default sources without hardcoded IDs
  const defaultSources = [
    {
      source_type: 'CASH',
      name: 'Cash',
      color: '#10b981',
      description: 'Physical cash payments'
    },
    {
      source_type: 'BANK',
      name: 'Bank Account',
      color: '#0ea5e9',
      description: 'Bank account transfers and payments'
    },
    {
      source_type: 'UPI',
      name: 'UPI',
      color: '#3b82f6',
      description: 'UPI payments (PhonePe, Google Pay, etc.)'
    }
  ];

  // Navigation function
  const goToAddExpense = () => {
    navigate('/add-expense');
  };

  // ✅ Fixed: Enhanced fetch expenses with better error handling
  const fetchExpenses = async () => {
    if (!user) return;
    
    try {
      setError(''); // Clear previous errors
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          payment_sources(name, color, source_type),
          expense_categories(name)
        `)
        .eq('user_id', user.id)
        .order('expense_date', { ascending: false });

      if (error) throw error;
      
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError('Failed to load expenses');
      toast.error('Failed to load expenses');
    }
  };

  // ✅ Fixed: Enhanced fetch payment sources
  const fetchPaymentSources = async () => {
    if (!user) return;
    
    try {
      setError('');
      const { data, error } = await supabase
        .from('payment_sources')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setPaymentSources(data || []);
    } catch (error) {
      console.error('Error fetching payment sources:', error);
      setError('Failed to load payment sources');
      toast.error('Failed to load payment sources');
    }
  };

  // ✅ Fixed: Enhanced fetch expense categories
  const fetchExpenseCategories = async () => {
    if (!user) return;
    
    try {
      setError('');
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .or(`user_id.eq.${user.id},is_default.eq.true`)
        .order('name', { ascending: true });

      if (error) throw error;
      
      setExpenseCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
      toast.error('Failed to load categories');
    }
  };

  // ✅ Fixed: Proper source initialization without hardcoded IDs
  const initializeDefaultSources = async () => {
    if (!user) return;
    
    try {
      // Check if user already has sources
      const { data: existingSources, error: checkError } = await supabase
        .from('payment_sources')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (checkError) throw checkError;
      
      // If no sources exist, create default ones
      if (!existingSources || existingSources.length === 0) {
        const sourcesToInsert = defaultSources.map(source => ({
          user_id: user.id,
          source_type: source.source_type,
          name: source.name,
          color: source.color,
          description: source.description,
          initial_balance: 0,
          current_balance: 0,
          is_active: true
        }));

        const { error: insertError } = await supabase
          .from('payment_sources')
          .insert(sourcesToInsert);

        if (insertError) throw insertError;
        
        console.log('Default payment sources initialized');
      }
    } catch (error) {
      console.error('Error initializing default sources:', error);
      setError('Failed to initialize payment sources');
    }
  };

  // ✅ Enhanced: Load all data with comprehensive error handling
  const loadDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    
    try {
      await initializeDefaultSources();
      await Promise.all([
        fetchExpenses(),
        fetchPaymentSources(),
        fetchExpenseCategories()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please try refreshing the page.');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const refreshData = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success('Data refreshed!');
  };

  // Initial load
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  // ✅ Enhanced: Real-time subscriptions with better error handling
  useEffect(() => {
    if (!user) return;

    let expensesSubscription, sourcesSubscription;

    const setupSubscriptions = async () => {
      try {
        // Subscribe to expenses changes
        expensesSubscription = supabase
          .channel(`expenses-${user.id}`)
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'expenses', 
              filter: `user_id=eq.${user.id}` 
            },
            (payload) => {
              console.log('Expenses change detected:', payload);
              fetchExpenses();
            }
          )
          .subscribe();

        // Subscribe to payment sources changes
        sourcesSubscription = supabase
          .channel(`sources-${user.id}`)
          .on('postgres_changes',
            { 
              event: '*', 
              schema: 'public', 
              table: 'payment_sources', 
              filter: `user_id=eq.${user.id}` 
            },
            (payload) => {
              console.log('Sources change detected:', payload);
              fetchPaymentSources();
            }
          )
          .subscribe();
      } catch (error) {
        console.error('Error setting up subscriptions:', error);
      }
    };

    setupSubscriptions();

    return () => {
      if (expensesSubscription) supabase.removeChannel(expensesSubscription);
      if (sourcesSubscription) supabase.removeChannel(sourcesSubscription);
    };
  }, [user]);

  // Calculate total balance
  const totalBalance = useMemo(() => {
    return paymentSources.reduce((sum, source) => sum + (source.current_balance || 0), 0);
  }, [paymentSources]);

  // Calculate total expenses
  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  // Calculate monthly expenses
  const monthlyExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.expense_date);
      return expenseDate.getMonth() === currentMonth && 
             expenseDate.getFullYear() === currentYear;
    }).reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  // Expense categories data for pie chart
  const expensesByCategory = useMemo(() => {
    const categories = {};
    expenses.forEach(expense => {
      const categoryName = expense.expense_categories?.name || 'Other';
      categories[categoryName] = (categories[categoryName] || 0) + expense.amount;
    });
    
    return Object.entries(categories).map(([category, amount]) => ({
      name: category,
      value: amount,
      percentage: totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : '0.0'
    }));
  }, [expenses, totalExpenses]);

  // Recent expenses data for area chart
  const recentExpensesData = useMemo(() => {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayExpenses = expenses
        .filter(expense => expense.expense_date === dateStr)
        .reduce((sum, expense) => sum + expense.amount, 0);
      
      last7Days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        amount: dayExpenses
      });
    }
    
    return last7Days;
  }, [expenses]);

  // Format currency
  const formatCurrency = (amount) => {
    if (isNaN(amount) || amount === null || amount === undefined) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // ✅ Enhanced: Handle add balance with better error handling
  const handleAddBalance = async () => {
    if (!addBalanceForm.sourceId || !addBalanceForm.amount || parseFloat(addBalanceForm.amount) <= 0) {
      toast.error('Please select a source and enter a valid amount');
      return;
    }

    const amount = parseFloat(addBalanceForm.amount);
    
    try {
      // Get current balance
      const { data: source, error: fetchError } = await supabase
        .from('payment_sources')
        .select('current_balance, initial_balance')
        .eq('id', addBalanceForm.sourceId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Update balance
      const newBalance = (source.current_balance || 0) + amount;
      const newInitialBalance = (source.initial_balance || 0) + amount;

      const { error: updateError } = await supabase
        .from('payment_sources')
        .update({ 
          current_balance: newBalance,
          initial_balance: newInitialBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', addBalanceForm.sourceId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Add balance history record
      await supabase
        .from('balance_history')
        .insert({
          payment_source_id: addBalanceForm.sourceId,
          transaction_type: 'DEPOSIT',
          amount_change: amount,
          balance_before: source.current_balance || 0,
          balance_after: newBalance
        });

      setAddBalanceForm({ sourceId: '', amount: '' });
      setShowAddBalanceModal(false);
      toast.success('Balance added successfully!');
      
      // Refresh payment sources
      await fetchPaymentSources();
    } catch (error) {
      console.error('Error adding balance:', error);
      toast.error('Failed to add balance. Please try again.');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  // Dashboard cards data
  const dashboardCards = [
    {
      id: 'total-balance',
      label: 'Total Balance',
      value: isBalanceVisible ? formatCurrency(totalBalance) : '****',
      icon: <Wallet className="w-6 h-6" />,
      change: '+2.5%',
      changeType: 'positive',
      button: totalBalance === 0 ? (
        <button
          onClick={() => setShowAddBalanceModal(true)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Add Balance
        </button>
      ) : null
    },
    {
      id: 'monthly-expenses',
      label: 'Monthly Expenses',
      value: formatCurrency(monthlyExpenses),
      icon: <BarChart3 className="w-6 h-6" />,
      change: '-5.2%',
      changeType: 'negative'
    },
    {
      id: 'total-expenses',
      label: 'Total Expenses',
      value: formatCurrency(totalExpenses),
      icon: <Activity className="w-6 h-6" />,
      change: '+12.3%',
      changeType: 'positive'
    },
    {
      id: 'active-sources',
      label: 'Active Sources',
      value: paymentSources.length.toString(),
      icon: <Users className="w-6 h-6" />,
      change: 'Stable',
      changeType: 'neutral'
    }
  ];

  // Colors for pie chart
  const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* ✅ Added: Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button 
              onClick={() => {
                setError('');
                loadDashboardData();
              }}
              className="text-sm underline hover:no-underline mr-2"
            >
              Retry
            </button>
            <button 
              onClick={() => setError('')}
              className="text-red-500 hover:text-red-700 text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <img
                src={avatar2}
                alt="Profile"
                className="w-15 h-15 rounded-full"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hello, {user?.email?.split('@')[0]}!</h1>
                <p className="text-gray-600">
                  Welcome back! Here's your financial overview.
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="p-2 text-gray-400 hover:text-gray-600"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={() => setIsBalanceVisible(!isBalanceVisible)}
                className="p-2 text-gray-400 hover:text-gray-600"
                title={isBalanceVisible ? 'Hide balances' : 'Show balances'}
              >
                {isBalanceVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
              
              <button
                onClick={goToAddExpense}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add Expense</span>
              </button>
              
              
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardCards.map((card) => (
            <div key={card.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {card.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.label}</p>
                    {card.button && (
                      <div className="mt-1">
                        {card.button}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  {card.change && (
                    <p className={`text-sm flex items-center ${
                      card.changeType === 'positive' ? 'text-green-600' : 
                      card.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {card.changeType === 'positive' && <ArrowUpRight className="w-4 h-4 mr-1" />}
                      {card.changeType === 'negative' && <ArrowDownRight className="w-4 h-4 mr-1" />}
                      {card.change}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Expenses Trend Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Expenses Trend</h3>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
                <option value="year">Last 12 months</option>
              </select>
            </div>
            
            {recentExpensesData.some(d => d.amount > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={recentExpensesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), 'Amount']}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <BarChart3 className="w-16 h-16 mb-4" />
                <p className="text-lg font-medium mb-2">No expenses yet!</p>
                <p className="text-sm mb-4">Start tracking your expenses to see trends</p>
                <button
                  onClick={goToAddExpense}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Add First Expense
                </button>
              </div>
            )}
          </div>

          {/* Category Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Category Distribution</h3>
            
            {expensesByCategory.length > 0 ? (
              <div className="flex flex-col">
                <div className="flex items-center justify-center mb-4">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={expensesByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {expensesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Category Legend */}
                <div className="space-y-2">
                  {expensesByCategory.map((category, index) => (
                    <div key={category.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: pieColors[index % pieColors.length] }}
                        />
                        <span className="text-sm text-gray-700">{category.name}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(category.value)} ({category.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Target className="w-16 h-16 mb-4" />
                <p className="text-lg font-medium mb-2">No categories yet!</p>
                <p className="text-sm mb-4">Add expenses to see category breakdown</p>
                <button
                  onClick={goToAddExpense}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Add First Expense
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Payment Sources */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Payment Sources</h3>
            <button
              onClick={() => setShowAddBalanceModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              Add Balance
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {paymentSources.map((source) => {
              const balance = source.current_balance || 0;
              const IconComponent = source.source_type === 'CASH' ? Wallet : 
                                  source.source_type === 'BANK' ? Building2 : Smartphone;
              
              return (
                <div key={source.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ 
                        backgroundColor: `${source.color || '#3b82f6'}20`, 
                        color: source.color || '#3b82f6'
                      }}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{source.name}</h4>
                      <p className="text-sm text-gray-600">{source.description}</p>
                    </div>
                  </div>
                  <p 
                    className="text-xl font-bold" 
                    style={{ color: source.color || '#3b82f6' }}
                  >
                    {isBalanceVisible ? formatCurrency(balance) : '****'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
            <button
              onClick={goToAddExpense}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All
            </button>
          </div>
          
          {expenses.length > 0 ? (
            <div className="space-y-4">
              {expenses.slice(0, 5).map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{expense.vendor}</p>
                      <p className="text-sm text-gray-600">
                        {expense.expense_categories?.name || 'Other'} • {expense.expense_date}
                      </p>
                      {expense.description && (
                        <p className="text-xs text-gray-500">{expense.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">-{formatCurrency(expense.amount)}</p>
                    <p className="text-xs text-gray-500">{expense.payment_sources?.name}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No expenses recorded yet</p>
              <button
                onClick={goToAddExpense}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Your First Expense
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Balance Modal */}
      <Modal isOpen={showAddBalanceModal} onClose={() => setShowAddBalanceModal(false)}>
        <h3 className="text-lg font-semibold mb-4">Add Balance to Payment Source</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Payment Source
            </label>
            <select
              value={addBalanceForm.sourceId}
              onChange={(e) => setAddBalanceForm(prev => ({ ...prev, sourceId: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a payment source</option>
              {paymentSources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name} - {formatCurrency(source.current_balance || 0)}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount to Add
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={addBalanceForm.amount}
              onChange={(e) => setAddBalanceForm(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="Enter amount to add"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleAddBalance}
              disabled={!addBalanceForm.sourceId || !addBalanceForm.amount}
              className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Balance
            </button>
            <button
              onClick={() => {
                setShowAddBalanceModal(false);
                setAddBalanceForm({ sourceId: '', amount: '' });
              }}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
