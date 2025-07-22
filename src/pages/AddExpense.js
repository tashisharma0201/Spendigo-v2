import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Edit2, Trash2, Eye, DollarSign, Calendar, Building, Tag, Check, AlertCircle, CreditCard, Wallet, Building2, Smartphone, PiggyBank, TrendingUp, TrendingDown, BarChart3, PieChart, Filter, Search, Bell, MoreVertical, Banknote, Grid, List, Settings, ArrowUpRight, ArrowDownRight, Target, Activity, Mic, MicOff, Volume2, Brain, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const ExpenseTracker = () => {
  const { user } = useAuth();
  
  // ✅ Fixed: Added all missing state variables
  const [expenses, setExpenses] = useState([]);
  const [sources, setSources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedSources, setSelectedSources] = useState(['all']);
  const [activeSourceView, setActiveSourceView] = useState('all');
  const [sourceBalances, setSourceBalances] = useState({});
  const [showAddBalanceForm, setShowAddBalanceForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Voice Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const [voiceSuccess, setVoiceSuccess] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiSuccess, setAiSuccess] = useState(false);
  const [aiCategorizedData, setAiCategorizedData] = useState(null);
  const [lastApiCall, setLastApiCall] = useState(0);
  const [apiCallCount, setApiCallCount] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [maxRecordingTime] = useState(30);

  // Speech Recognition Refs
  const recognitionRef = useRef(null);
  const recordingTimerRef = useRef(null);

  // Perplexity API key
  const PERPLEXITY_API_KEY = process.env.REACT_APP_PERPLEXITY_API_KEY;

  // ✅ Fixed: Updated currentExpense state structure with proper field mapping
  const [currentExpense, setCurrentExpense] = useState({
    amount: '',
    vendor: '',
    expense_date: new Date().toISOString().split('T')[0], // Maps to expense_date in DB
    categoryId: '',                                        // Maps to category_id (UUID)
    description: '',
    payment_source_id: '',                                // Maps to payment_source_id in DB
    
    // Voice input fields
    is_voice_input: false,
    voice_transcript: null,
    ai_confidence_score: null,
    ai_reasoning: null
  });

  // Add Balance Form State
  const [addBalanceForm, setAddBalanceForm] = useState({
    sourceId: '',
    amount: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Source types and their properties
  const sourceTypes = [
    { id: 'UPI', name: 'UPI Account', icon: Smartphone, color: '#3b82f6', description: 'PhonePe, Google Pay, Paytm, etc.' },
    { id: 'BANK', name: 'Bank Account', icon: Building2, color: '#0ea5e9', description: 'Bank transfers and payments' },
    { id: 'CASH', name: 'Cash', icon: Wallet, color: '#10b981', description: 'Physical cash payments' }
  ];

  // ✅ Fixed: Fetch expenses with proper joins and field mapping
  const fetchExpenses = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          payment_sources(id, name, color, source_type),
          expense_categories(id, name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError('Failed to load expenses');
    }
  };

  // ✅ Fixed: Fetch payment sources from correct table
  const fetchPaymentSources = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('payment_sources')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setSources(data || []);
      
      // Calculate current balances
      const balances = {};
      if (data) {
        data.forEach(source => {
          balances[source.id] = source.current_balance || 0;
        });
      }
      
      setSourceBalances(balances);
    } catch (error) {
      console.error('Error fetching payment sources:', error);
      setError('Failed to load payment sources');
    }
  };

  // ✅ Fixed: Fetch categories from database
  const fetchCategories = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .or(`user_id.eq.${user.id},is_default.eq.true`)
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
    }
  };

  // ✅ Fixed: Initialize default payment sources for new users
  const initializeDefaultSources = async () => {
    if (!user?.id) return;
    
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
        const defaultSources = [
          {
            user_id: user.id,
            source_type: 'CASH',
            name: 'Cash',
            color: '#10b981',
            description: 'Physical cash payments',
            initial_balance: 0,
            current_balance: 0
          },
          {
            user_id: user.id,
            source_type: 'BANK',
            name: 'Bank Account',
            color: '#0ea5e9',
            description: 'Bank account transfers and payments',
            initial_balance: 0,
            current_balance: 0
          },
          {
            user_id: user.id,
            source_type: 'UPI',
            name: 'UPI',
            color: '#3b82f6',
            description: 'UPI payments (PhonePe, Google Pay, etc.)',
            initial_balance: 0,
            current_balance: 0
          }
        ];

        const { error: insertError } = await supabase
          .from('payment_sources')
          .insert(defaultSources);

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error initializing default sources:', error);
    }
  };

  // ✅ Fixed: Save expense with proper field mapping and voice data
  const saveExpense = async (expense) => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([{
          user_id: user.id,
          payment_source_id: expense.payment_source_id,
          category_id: expense.categoryId,
          amount: parseFloat(expense.amount),
          vendor: expense.vendor,
          description: expense.description,
          expense_date: expense.expense_date,
          
          // Voice input fields
          is_voice_input: expense.is_voice_input || false,
          voice_transcript: expense.voice_transcript || null,
          ai_confidence_score: expense.ai_confidence_score || null,
          ai_reasoning: expense.ai_reasoning || null
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Update payment source balance
      await updatePaymentSourceBalance(expense.payment_source_id, parseFloat(expense.amount));
      
      return data;
    } catch (error) {
      console.error('Error saving expense:', error);
      throw error;
    }
  };

  // ✅ Fixed: Update payment source balance and add history
  const updatePaymentSourceBalance = async (sourceId, expenseAmount) => {
    try {
      // Get current balance
      const { data: source, error: fetchError } = await supabase
        .from('payment_sources')
        .select('current_balance')
        .eq('id', sourceId)
        .single();

      if (fetchError) throw fetchError;

      const newBalance = (source.current_balance || 0) - expenseAmount;

      // Update balance
      const { error: updateError } = await supabase
        .from('payment_sources')
        .update({ current_balance: newBalance })
        .eq('id', sourceId);

      if (updateError) throw updateError;

      // Add balance history entry
      await supabase
        .from('balance_history')
        .insert({
          payment_source_id: sourceId,
          transaction_type: 'EXPENSE',
          amount_change: -expenseAmount,
          balance_before: source.current_balance || 0,
          balance_after: newBalance
        });

    } catch (error) {
      console.error('Error updating source balance:', error);
      throw error;
    }
  };

  // ✅ Fixed: Update expense with proper field mapping
  const updateExpense = async (id, expense) => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .update({
          payment_source_id: expense.payment_source_id,
          category_id: expense.categoryId,
          amount: parseFloat(expense.amount),
          vendor: expense.vendor,
          description: expense.description,
          expense_date: expense.expense_date
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  };

  const deleteExpenseFromDB = async (id) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  };

  // ✅ Fixed: Add balance to payment source
  const updateSourceBalance = async (sourceId, additionalAmount) => {
    try {
      // Get current balance
      const { data: source, error: fetchError } = await supabase
        .from('payment_sources')
        .select('current_balance, initial_balance')
        .eq('id', sourceId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Update balance
      const newBalance = (source.current_balance || 0) + additionalAmount;
      const newInitialBalance = (source.initial_balance || 0) + additionalAmount;

      const { error: updateError } = await supabase
        .from('payment_sources')
        .update({ 
          current_balance: newBalance,
          initial_balance: newInitialBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', sourceId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Add balance history record
      await supabase
        .from('balance_history')
        .insert({
          payment_source_id: sourceId,
          transaction_type: 'DEPOSIT',
          amount_change: additionalAmount,
          balance_before: source.current_balance || 0,
          balance_after: newBalance
        });

    } catch (error) {
      console.error('Error updating source balance:', error);
      throw error;
    }
  };

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setVoiceTranscript(prev => prev + ' ' + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setVoiceError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
        clearInterval(recordingTimerRef.current);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
        clearInterval(recordingTimerRef.current);
      };
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  // ✅ Fixed: Load data from Supabase on component mount
  useEffect(() => {
    if (user) {
      const loadData = async () => {
        setLoading(true);
        try {
          await initializeDefaultSources();
          await Promise.all([
            fetchExpenses(),
            fetchPaymentSources(),
            fetchCategories()
          ]);
        } catch (error) {
          console.error('Error loading data:', error);
          setError('Failed to load data');
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [user]);

  // Voice Recording Functions
  const startVoiceRecording = () => {
    if (!recognitionRef.current) {
      setVoiceError('Speech recognition not supported in this browser');
      return;
    }

    setVoiceTranscript('');
    setVoiceError('');
    setVoiceSuccess(false);
    setAiCategorizedData(null);
    setRecordingDuration(0);

    try {
      recognitionRef.current.start();
      setIsRecording(true);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= maxRecordingTime - 1) {
            stopVoiceRecording();
            return maxRecordingTime;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      setVoiceError('Failed to start recording: ' + error.message);
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    clearInterval(recordingTimerRef.current);
    
    if (voiceTranscript.trim()) {
      processVoiceTranscript(voiceTranscript.trim());
    }
  };

  // API Rate Limiting
  const canMakeApiCall = () => {
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCall;
    
    if (timeSinceLastCall > 60000) {
      setApiCallCount(1);
      setLastApiCall(now);
      return true;
    }
    
    if (apiCallCount < 15) {
      setApiCallCount(prev => prev + 1);
      setLastApiCall(now);
      return true;
    }
    
    return false;
  };

  // Perplexity AI Processing
  const extractDataWithPerplexity = async (voiceText, retryCount = 0) => {
    if (!PERPLEXITY_API_KEY) {
      throw new Error('Perplexity API key not configured');
    }
    
    const maxRetries = 3;
    const baseDelay = 1000;
    
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "sonar-pro",
          messages: [
            {
              role: "system",
              content: `You are an expert financial voice assistant. Extract structured expense data from voice input.

RESPONSE FORMAT: Return ONLY valid JSON:
{
  "vendor": "Business Name",
  "amount": 25.99,
  "date": "2025-07-21", 
  "category": "Food & Drink",
  "description": "Brief description",
  "payment_source_id": "source_id",
  "confidence": 85,
  "reasoning": "Brief explanation"
}

Categories: Food & Drink, Transportation, Shopping, Entertainment, Healthcare, Utilities, Travel, Education, Business, Other

Payment Sources:
- Cash payments: return "cash_source"
- UPI payments: return "upi_source"  
- Bank/Card payments: return "bank_source"`
            },
            {
              role: "user", 
              content: `Extract expense data from: "${voiceText}"`
            }
          ],
          temperature: 0.2,
          max_tokens: 400,
          stream: false
        })
      });
      
      if (!response.ok) {
        if (response.status === 429 && retryCount < maxRetries) {
          const delay = baseDelay * Math.pow(2, retryCount);
          await new Promise(resolve => setTimeout(resolve, delay));
          return extractDataWithPerplexity(voiceText, retryCount + 1);
        }
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      throw new Error(`API call failed: ${error.message}`);
    }
  };

  // Basic text processing fallback
  const extractBasicDataFromVoice = (text) => {
    const lowerText = text.toLowerCase();
    
    // Extract amount
    const amountMatch = lowerText.match(/(\d+(?:\.\d{2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
    
    // Extract vendor
    const vendorMatch = text.match(/(?:at|from|on)\s+([a-zA-Z][a-zA-Z\s&'.-]{2,30})/i);
    const vendor = vendorMatch ? vendorMatch[1].trim() : 'Voice Entry';
    
    // Detect payment source
    let detectedSourceId = sources.length > 0 ? sources[0].id : '';
    if (lowerText.includes('cash')) detectedSourceId = sources.find(s => s.source_type === 'CASH')?.id || '';
    if (lowerText.includes('upi') || lowerText.includes('phonepe')) detectedSourceId = sources.find(s => s.source_type === 'UPI')?.id || '';
    if (lowerText.includes('bank') || lowerText.includes('card')) detectedSourceId = sources.find(s => s.source_type === 'BANK')?.id || '';
    
    // Basic category detection
    let categoryId = categories.find(c => c.name === 'Other')?.id || '';
    if (lowerText.includes('coffee') || lowerText.includes('food')) {
      categoryId = categories.find(c => c.name === 'Food & Drink')?.id || categoryId;
    }
    
    return {
      vendor,
      amount,
      date: new Date().toISOString().split('T')[0],
      categoryId,
      description: text.substring(0, 50),
      payment_source_id: detectedSourceId,
      confidence: 40,
      reasoning: 'Basic voice parsing'
    };
  };

  // ✅ Fixed: Process voice transcript with proper field mapping
  const processVoiceTranscript = async (text) => {
    setIsProcessingVoice(true);
    setVoiceError('');
    
    try {
      let result;
      
      if (!canMakeApiCall()) {
        result = extractBasicDataFromVoice(text);
      } else {
        try {
          setIsProcessingAI(true);
          result = await extractDataWithPerplexity(text);
          
          // Map AI result to correct field names
          if (result.payment_source_id) {
            // Map AI source names to actual source IDs
            const sourceMap = {
              'cash_source': sources.find(s => s.source_type === 'CASH')?.id,
              'upi_source': sources.find(s => s.source_type === 'UPI')?.id,
              'bank_source': sources.find(s => s.source_type === 'BANK')?.id
            };
            result.payment_source_id = sourceMap[result.payment_source_id] || sources[0]?.id;
          }
          
          // Map category name to category ID
          const categoryObj = categories.find(c => c.name === result.category);
          result.categoryId = categoryObj?.id || categories[0]?.id;
          
          setAiSuccess(true);
          setTimeout(() => setAiSuccess(false), 5000);
        } catch (error) {
          setAiError(`AI parsing failed: ${error.message}`);
          setTimeout(() => setAiError(''), 5000);
          result = extractBasicDataFromVoice(text);
        }
      }
      
      // ✅ Fixed: Auto-fill form with correct field mapping
      setCurrentExpense(prev => ({
        ...prev,
        amount: result.amount > 0 ? result.amount.toFixed(2) : '',
        vendor: result.vendor || '',
        expense_date: result.date || new Date().toISOString().split('T')[0],
        categoryId: result.categoryId || '',
        description: result.description || '',
        payment_source_id: result.payment_source_id || '',
        
        // Voice metadata
        is_voice_input: true,
        voice_transcript: text,
        ai_confidence_score: result.confidence || null,
        ai_reasoning: result.reasoning || null
      }));
      
      setAiCategorizedData(result);
      setVoiceSuccess(true);
      setTimeout(() => setVoiceSuccess(false), 5000);
      
    } catch (error) {
      console.error('Voice processing failed:', error);
      setVoiceError('Failed to process voice input');
      setTimeout(() => setVoiceError(''), 5000);
    } finally {
      setIsProcessingVoice(false);
      setIsProcessingAI(false);
    }
  };

  // Add Balance to Source Function
  const handleAddBalance = async () => {
    if (!addBalanceForm.sourceId || !addBalanceForm.amount || parseFloat(addBalanceForm.amount) <= 0) {
      setError('Please select a source and enter a valid amount');
      return;
    }

    const amount = parseFloat(addBalanceForm.amount);
    
    try {
      await updateSourceBalance(addBalanceForm.sourceId, amount);
      
      // Refresh data
      await fetchPaymentSources();
      
      setAddBalanceForm({ sourceId: '', amount: '' });
      setShowAddBalanceForm(false);
      setSuccess('Balance added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to update balance');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Filter expenses based on selected sources
  const getFilteredExpenses = () => {
    if (selectedSources.includes('all')) {
      return expenses;
    }
    return expenses.filter(expense => 
      selectedSources.includes(expense.payment_source_id)
    );
  };

  const formatIndianCurrency = (amount) => {
    if (isNaN(amount) || amount === 0) return '₹0.00';
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // ✅ Fixed: Handle submit with proper validation and field mapping
  const handleSubmit = async () => {
    if (!currentExpense.amount || !currentExpense.vendor || !currentExpense.expense_date || 
        !currentExpense.categoryId || !currentExpense.payment_source_id) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      if (isEditing) {
        const updatedExpense = await updateExpense(editingId, currentExpense);
        setExpenses(expenses.map(expense => 
          expense.id === editingId ? updatedExpense : expense
        ));
        setIsEditing(false);
        setEditingId(null);
      } else {
        const newExpense = await saveExpense(currentExpense);
        setExpenses([newExpense, ...expenses]);
      }
      
      resetForm();
      setSuccess('Expense saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Refresh data
      await fetchPaymentSources();
    } catch (error) {
      setError('Failed to save expense');
      setTimeout(() => setError(''), 3000);
    }
  };
  
  const resetForm = () => {
    setCurrentExpense({
      amount: '',
      vendor: '',
      expense_date: new Date().toISOString().split('T')[0],
      categoryId: '',
      description: '',
      payment_source_id: '',
      is_voice_input: false,
      voice_transcript: null,
      ai_confidence_score: null,
      ai_reasoning: null
    });
    setShowForm(false);
    
    // Reset voice states
    setVoiceTranscript('');
    setVoiceError('');
    setVoiceSuccess(false);
    setAiCategorizedData(null);
    setAiError('');
    setAiSuccess(false);
    setRecordingDuration(0);
  };

  const editExpense = (expense) => {
    setCurrentExpense({
      ...expense,
      amount: expense.amount.toString(),
      categoryId: expense.category_id,
      payment_source_id: expense.payment_source_id
    });
    setIsEditing(true);
    setEditingId(expense.id);
    setShowForm(true);
  };
  
  const deleteExpense = async (id) => {
    try {
      await deleteExpenseFromDB(id);
      setExpenses(expenses.filter(expense => expense.id !== id));
      setSuccess('Expense deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to delete expense');
      setTimeout(() => setError(''), 3000);
    }
  };
  
  const filteredExpenses = getFilteredExpenses();
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalSourceBalance = Object.values(sourceBalances).reduce((sum, balance) => sum + balance, 0);
  
  const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
    const categoryName = expense.expense_categories?.name || 'Other';
    acc[categoryName] = (acc[categoryName] || 0) + expense.amount;
    return acc;
  }, {});

  const getSourceTypeInfo = (type) => {
    return sourceTypes.find(st => st.id === type) || sourceTypes[0];
  };

  const getSourceById = (id) => {
    return sources.find(source => source.id === id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading your expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle size={20} />
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <Check size={20} />
            {success}
          </div>
        )}

        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            {/* Main Stats Card */}
            <div className="lg:col-span-8 bg-gradient-to-br from-blue-600 to-teal-600 text-white p-8 rounded-lg">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Say It. Track It. Done.</h1>
                  <p className="text-blue-100 text-lg">Manage your spending with voice input and automatic <br />AI-based categorization.</p>
                </div>
                <div className="mt-4 lg:mt-0">
                  <div className="text-right">
                    <p className="text-blue-100 font-bold text-2xl">Total Balance</p>
                    <p className="text-4xl font-bold">{formatIndianCurrency(totalSourceBalance)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Add Card */}
            <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-lg flex flex-col justify-center gap-3">
              <button
                onClick={() => setShowForm(true)}
                className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white p-3 rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
              >
                <Plus size={18} />
                Add Expense
              </button>
              
              <button
                onClick={() => setShowAddBalanceForm(true)}
                className="w-full bg-gradient-to-r from-violet-500 to-purple-500 text-white p-3 rounded-lg hover:from-violet-600 hover:to-purple-600 transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
              >
                <Wallet size={18} />
                Add Balance
              </button>
              
              <div className="mt-2 text-center">
                <p className="text-sm text-slate-600">Total Spent This Period</p>
                <p className="text-2xl font-bold text-slate-800">{formatIndianCurrency(totalExpenses)}</p>
              </div>
            </div>
          </div>

          {/* Payment Sources Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <button
              onClick={() => setSelectedSources(['all'])}
              className={`p-6 border-2 rounded-lg transition-all duration-200 ${
                selectedSources.includes('all')
                  ? 'border-slate-800 bg-slate-800 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <Activity size={24} className={selectedSources.includes('all') ? 'text-white' : 'text-slate-600'} />
                <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded">ALL</span>
              </div>
              <h3 className="font-bold text-lg">All Sources</h3>
              <p className="text-sm opacity-75 mb-2">Combined Balance</p>
              <p className="text-xl font-bold">{formatIndianCurrency(totalSourceBalance)}</p>
            </button>

            {sources.map(source => {
              const typeInfo = getSourceTypeInfo(source.source_type);
              const Icon = typeInfo.icon;
              const balance = sourceBalances[source.id] || 0;
              const isSelected = selectedSources.includes(source.id);
              
              return (
                <button
                  key={source.id}
                  onClick={() => {
                    if (selectedSources.includes(source.id)) {
                      setSelectedSources(['all']);
                    } else {
                      setSelectedSources([source.id]);
                    }
                  }}
                  className={`p-6 border-2 rounded-lg transition-all duration-200 ${
                    isSelected
                      ? `border-blue-500 bg-blue-50 text-blue-900`
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                  style={{
                    borderColor: isSelected ? source.color : undefined,
                    backgroundColor: isSelected ? `${source.color}15` : undefined
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <Icon size={24} className={isSelected ? 'text-current' : 'text-slate-600'} />
                    <span className={`text-xs px-2 py-1 rounded bg-slate-100 text-slate-600`}>
                      {balance === 0 ? 'EMPTY' : 'ACTIVE'}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg">{source.name}</h3>
                  <p className="text-sm opacity-75 mb-2">{source.description}</p>
                  <p className="text-xl font-bold">{formatIndianCurrency(balance)}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Add Balance Form */}
        {showAddBalanceForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full rounded-lg">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-800">Add Balance</h2>
                  <button
                    onClick={() => {
                      setShowAddBalanceForm(false);
                      setAddBalanceForm({ sourceId: '', amount: '' });
                    }}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">Select Payment Source</label>
                  <div className="grid grid-cols-1 gap-2">
                    {sources.map(source => {
                      const typeInfo = getSourceTypeInfo(source.source_type);
                      const Icon = typeInfo.icon;
                      const balance = sourceBalances[source.id] || 0;
                      const isSelected = addBalanceForm.sourceId === source.id;
                      
                      return (
                        <button
                          key={source.id}
                          type="button"
                          onClick={() => setAddBalanceForm({...addBalanceForm, sourceId: source.id})}
                          className={`p-4 border-2 rounded-lg transition-all flex items-center gap-3 ${
                            isSelected
                              ? `border-blue-500 bg-blue-50`
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                          style={{
                            borderColor: isSelected ? source.color : undefined,
                            backgroundColor: isSelected ? `${source.color}15` : undefined
                          }}
                        >
                          <Icon size={20} style={{ color: source.color }} />
                          <div className="flex-1 text-left">
                            <div className="font-medium">{source.name}</div>
                            <div className="text-sm text-slate-600">Current: {formatIndianCurrency(balance)}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label htmlFor="balance-amount" className="block text-sm font-medium text-slate-700 mb-2">Amount to Add</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-500">₹</span>
                    <input
                      id="balance-amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={addBalanceForm.amount}
                      onChange={(e) => setAddBalanceForm({...addBalanceForm, amount: e.target.value})}
                      className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                  <button
                    onClick={() => {
                      setShowAddBalanceForm(false);
                      setAddBalanceForm({ sourceId: '', amount: '' });
                    }}
                    className="px-6 py-3 border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddBalance}
                    className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-600 hover:to-purple-600 font-medium rounded-lg"
                  >
                    Add Balance
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Expense Form */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-2xl w-full rounded-lg shadow-xl" style={{ height: '90vh', display: 'flex', flexDirection: 'column' }}>
              
              {/* Fixed Header */}
              <div className="p-6 border-b border-slate-200" style={{ flexShrink: 0 }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-800">
                    {isEditing ? 'Edit Expense' : 'Add New Expense'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Scrollable Content Area */}
              <div 
                className="p-6 space-y-6" 
                style={{ 
                  flex: 1, 
                  overflowY: 'auto', 
                  maxHeight: 'calc(90vh - 140px)'
                }}
              >
                {/* Voice Recording Section */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
                    <Mic size={20} />
                    Voice Expense Entry
                  </h3>
                  
                  {/* Voice Recording Controls */}
                  <div className="flex items-center gap-4 mb-4 flex-wrap">
                    {!isRecording ? (
                      <button
                        onClick={startVoiceRecording}
                        disabled={isProcessingVoice || isProcessingAI}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Mic size={20} />
                        Start Recording
                      </button>
                    ) : (
                      <button
                        onClick={stopVoiceRecording}
                        className="flex items-center gap-2 px-6 py-3 bg-red-800 text-white font-semibold rounded-lg hover:bg-red-900 transition-colors animate-pulse"
                      >
                        <MicOff size={20} />
                        Stop Recording ({maxRecordingTime - recordingDuration}s)
                      </button>
                    )}
                    
                    {voiceTranscript && (
                      <button
                        onClick={() => processVoiceTranscript(voiceTranscript)}
                        disabled={isProcessingVoice || isProcessingAI}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                      >
                        <Brain size={16} />
                        Process Again
                      </button>
                    )}
                  </div>

                  {/* Voice Transcript */}
                  {voiceTranscript && (
                    <div className="mb-4 p-4 bg-white border border-purple-200 rounded-lg">
                      <h4 className="text-sm font-semibold text-purple-700 mb-2">Voice Transcript:</h4>
                      <p className="text-gray-700 italic">"{voiceTranscript}"</p>
                    </div>
                  )}

                  {/* Processing Status */}
                  <div className="space-y-3">
                    {isProcessingVoice && (
                      <div className="flex items-center gap-2 text-blue-600 font-medium">
                        <Loader2 size={16} className="animate-spin" />
                        Processing voice input...
                      </div>
                    )}
                    {isProcessingAI && (
                      <div className="flex items-center gap-2 text-purple-600 font-medium">
                        <Brain size={16} className="animate-pulse" />
                        AI analyzing and categorizing...
                      </div>
                    )}
                    {voiceSuccess && (
                      <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
                        <Check size={16} />
                        Voice processed successfully!
                      </div>
                    )}
                    {voiceError && (
                      <div className="flex items-center gap-2 text-red-600 font-medium text-sm">
                        <AlertCircle size={16} />
                        {voiceError}
                      </div>
                    )}
                    {aiError && (
                      <div className="flex items-center gap-2 text-orange-600 font-medium text-sm">
                        <AlertCircle size={16} />
                        {aiError}
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Source Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">Select Payment Source</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {sources.filter(source => source.is_active).map(source => {
                      const typeInfo = getSourceTypeInfo(source.source_type);
                      const Icon = typeInfo.icon;
                      const balance = sourceBalances[source.id] || 0;
                      const isSelected = currentExpense.payment_source_id === source.id;
                      
                      return (
                        <button
                          key={source.id}
                          type="button"
                          onClick={() => setCurrentExpense({...currentExpense, payment_source_id: source.id})}
                          className={`p-4 border-2 transition-all rounded-lg ${
                            isSelected
                              ? `border-blue-500 bg-blue-50`
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                          style={{
                            borderColor: isSelected ? source.color : undefined,
                            backgroundColor: isSelected ? `${source.color}15` : undefined
                          }}
                        >
                          <Icon size={20} className="mx-auto mb-2" style={{ color: source.color }} />
                          <div className="text-sm font-medium">{source.name}</div>
                          <div className="text-xs text-slate-600">{formatIndianCurrency(balance)}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-2">Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-slate-500">₹</span>
                      <input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={currentExpense.amount}
                        onChange={(e) => setCurrentExpense({...currentExpense, amount: e.target.value})}
                        className="w-full pl-8 pr-4 py-3 border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="vendor" className="block text-sm font-medium text-slate-700 mb-2">Vendor</label>
                    <input
                      id="vendor"
                      type="text"
                      value={currentExpense.vendor}
                      onChange={(e) => setCurrentExpense({...currentExpense, vendor: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg"
                      placeholder="e.g., Starbucks"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                    <input
                      id="date"
                      type="date"
                      value={currentExpense.expense_date}
                      onChange={(e) => setCurrentExpense({...currentExpense, expense_date: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                    <select
                      id="category"
                      value={currentExpense.categoryId}
                      onChange={(e) => setCurrentExpense({...currentExpense, categoryId: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg"
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">Description (Optional)</label>
                  <input
                    id="description"
                    type="text"
                    value={currentExpense.description}
                    onChange={(e) => setCurrentExpense({...currentExpense, description: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
              
              {/* Fixed Footer */}
              <div className="p-6 border-t border-slate-200 bg-gray-50" style={{ flexShrink: 0 }}>
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <button
                    onClick={resetForm}
                    className="px-6 py-3 border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white hover:from-blue-600 hover:to-teal-600 font-medium rounded-lg transition-colors"
                  >
                    {isEditing ? 'Update Expense' : 'Add Expense'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expenses List */}
        <div className="bg-white border border-slate-200 rounded-lg">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">Recent Transactions</h2>
            <p className="text-sm text-slate-600">{filteredExpenses.length} transactions</p>
          </div>
          
          <div className="p-6">
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle size={48} className="text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 text-lg font-medium mb-2">No transactions found</p>
                <p className="text-slate-500">Add balance and start tracking expenses</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredExpenses.map(expense => {
                  const source = expense.payment_sources;
                  const category = expense.expense_categories;
                  
                  return (
                    <div key={expense.id} className="border border-slate-200 p-4 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          {source && (
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                              style={{ backgroundColor: source.color }}
                            >
                              <Wallet size={16} />
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-slate-800">{expense.vendor}</h3>
                            <p className="text-sm text-slate-600">{category?.name || 'Other'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-slate-800">{formatIndianCurrency(expense.amount)}</p>
                          <p className="text-sm text-slate-600">{expense.expense_date}</p>
                        </div>
                      </div>
                      
                      {expense.description && (
                        <p className="text-sm text-slate-600 mb-3">{expense.description}</p>
                      )}
                      
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => editExpense(expense)}
                          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => deleteExpense(expense.id)}
                          className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTracker;
