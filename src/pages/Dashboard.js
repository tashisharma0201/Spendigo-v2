import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import avatar2 from './avatar-2.png';  // Import your avatar image

/* ─────────────────────────────────────────
   Reusable Modal Component
   ───────────────────────────────────────── */
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   Helper Functions
   ───────────────────────────────────────── */
const formatIndianCurrency = (number = 0) =>
  number.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

/* ─────────────────────────────────────────
   Main Dashboard Component
   ───────────────────────────────────────── */
const Dashboard = ({
  sources = [],
  user = { name: 'User', avatar: avatar2 },  // Use imported avatar
}) => {
  // Expenses & Balances
  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem('expenses');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [sourceBalances, setSourceBalances] = useState(() => {
    try {
      const saved = localStorage.getItem('sourceBalances');
      if (saved) return JSON.parse(saved);
    } catch {}
    // default balances
    const defaults = {};
    sources.forEach((s) => (defaults[s.id] = s.initialBalance || 0));
    return defaults;
  });

  // UI toggles & form state
  const [showDetails, setShowDetails] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    date: '',
    category: '',
    vendor: '',
    sourceId: sources[0]?.id || '',
  });

  // Derived values
  const totalBalance = useMemo(
    () => Object.values(sourceBalances).reduce((a, b) => a + b, 0),
    [sourceBalances]
  );
  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0),
    [expenses]
  );
  const dailyChartData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 30 }).map((_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (29 - i));
      const key = date.toISOString().slice(0, 10);
      const daySpend = expenses
        .filter((e) => e.date === key)
        .reduce((s, e) => s + Number(e.amount || 0), 0);
      return { date: key.slice(5), amount: daySpend };
    });
  }, [expenses]);
  const categoryData = useMemo(() => {
    const map = {};
    expenses.forEach(({ category, amount }) => {
      map[category] = (map[category] || 0) + Number(amount || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);
  useEffect(() => {
    localStorage.setItem('sourceBalances', JSON.stringify(sourceBalances));
  }, [sourceBalances]);

  // Handlers
  const handleAddExpense = (e) => {
    e.preventDefault();
    const expense = {
      ...newExpense,
      id: Date.now(),
      amount: Number(newExpense.amount),
    };
    setExpenses((prev) => [expense, ...prev]);
    setSourceBalances((prev) => ({
      ...prev,
      [expense.sourceId]: prev[expense.sourceId] - expense.amount,
    }));
    toast.success('Expense added!');
    setShowAddModal(false);
    setNewExpense({
      amount: '',
      date: '',
      category: '',
      vendor: '',
      sourceId: sources[0]?.id || '',
    });
  };

  const downloadCSV = () => {
    if (!expenses.length) {
      toast.error('No expenses to export.');
      return;
    }
    const headers = Object.keys(expenses[0]);
    const csvRows = [
      headers.join(','),
      ...expenses.map((exp) =>
        headers.map((h) => `"${String(exp[h]).replace(/"/g, '""')}"`).join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'expenses.csv';
    link.click();
  };

  return (
    <div className="min-h-screen p-6 space-y-8 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          {getGreeting()}, {user.name}!
        </h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={downloadCSV}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
          >
            Export CSV
          </button>
          <img
            src={user.avatar}
            alt="User avatar"
            className="w-10 h-10 rounded-full ring-2 ring-white"
          />
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {[
          {
            label: 'Balance',
            icon: <Wallet size={14} />,
            value: formatIndianCurrency(totalBalance),
          },
          {
            label: 'Spent',
            icon: <Activity size={14} />,
            value: showDetails
              ? formatIndianCurrency(totalExpenses)
              : '•••••',
            toggle: () => setShowDetails((prev) => !prev),
            button: true,
          },
          {
            label: 'Last 30 days',
            icon: <Target size={14} />,
            value: formatIndianCurrency(
              dailyChartData.reduce((s, d) => s + d.amount, 0)
            ),
          },
        ].map((card, idx) => (
          <div
            key={idx}
            className="p-5 rounded-lg bg-white shadow transition hover:shadow-2xl hover:scale-105"
          >
            <p className="text-sm text-gray-500 flex items-center gap-1">
              {card.icon}
              {card.label}
              {card.button && (
                <button
                  onClick={card.toggle}
                  className="ml-1 focus:outline-none"
                >
                  {showDetails ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              )}
            </p>
            <p className="mt-1 text-xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Daily Spending Chart */}
      <section>
        <h2 className="mb-2 text-lg font-semibold flex items-center gap-1 text-white">
          <BarChart3 size={18} /> Daily spending (last 30 days)
        </h2>
        {dailyChartData.every((d) => d.amount === 0) ? (
          <div className="flex flex-col items-center gap-2 text-white">
            <p>No expenses yet! Add your first to see the chart.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Add Expense
            </button>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={dailyChartData} animationDuration={800}>
              <defs>
                <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#fff' }} />
              <YAxis
                tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
                tick={{ fontSize: 11, fill: '#fff' }}
              />
              <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
              <Tooltip
                formatter={(val) => formatIndianCurrency(val)}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#3b82f6"
                fill="url(#colorSpend)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* Category Distribution */}
      <section>
        <h2 className="mb-2 text-lg font-semibold flex items-center gap-1 text-white">
          <Users size={18} /> Expense distribution
        </h2>
        {categoryData.length === 0 ? (
          <div className="flex flex-col items-center gap-2 text-white">
            <p>No categories yet! Add expenses to view distribution.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Add Expense
            </button>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                outerRadius={110}
                innerRadius={60}
                paddingAngle={4}
                animationDuration={600}
              >
                {categoryData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={
                      ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#6366f1'][
                        idx % 5
                      ]
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(val) => formatIndianCurrency(val)}
                labelFormatter={(label) => `${label}`}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* Quick Add Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-8 right-8 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition"
      >
        <Plus size={20} />
      </button>

      {/* Add Expense Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
        <h2 className="text-xl font-bold mb-4">Add New Expense</h2>
        <form onSubmit={handleAddExpense} className="space-y-4">
          <input
            required
            type="number"
            placeholder="Amount"
            value={newExpense.amount}
            onChange={(e) =>
              setNewExpense({ ...newExpense, amount: e.target.value })
            }
            className="w-full px-3 py-2 border rounded"
          />
          <input
            required
            type="date"
            value={newExpense.date}
            onChange={(e) =>
              setNewExpense({ ...newExpense, date: e.target.value })
            }
            className="w-full px-3 py-2 border rounded"
          />
          <input
            required
            type="text"
            placeholder="Category"
            value={newExpense.category}
            onChange={(e) =>
              setNewExpense({ ...newExpense, category: e.target.value })
            }
            className="w-full px-3 py-2 border rounded"
          />
          <input
            required
            type="text"
            placeholder="Vendor"
            value={newExpense.vendor}
            onChange={(e) =>
              setNewExpense({ ...newExpense, vendor: e.target.value })
            }
            className="w-full px-3 py-2 border rounded"
          />
          <select
            required
            value={newExpense.sourceId}
            onChange={(e) =>
              setNewExpense({ ...newExpense, sourceId: e.target.value })
            }
            className="w-full px-3 py-2 border rounded"
          >
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Add Expense
          </button>
        </form>
      </Modal>

      {/* Toast Notifications */}
      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
};

export default Dashboard;
