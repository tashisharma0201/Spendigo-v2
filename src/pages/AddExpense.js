import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Edit2, Trash2, Eye, DollarSign, Calendar, Building, Tag, Check, AlertCircle, CreditCard, Wallet, Building2, Smartphone, PiggyBank, TrendingUp, TrendingDown, BarChart3, PieChart, Filter, Search, Bell, MoreVertical, Banknote, Grid, List, Settings, ArrowUpRight, ArrowDownRight, Target, Activity, Mic, MicOff, Volume2, Brain, Loader2 } from 'lucide-react';

const ExpenseTracker = () => {
  const [expenses, setExpenses] = useState([]);
  const [selectedSources, setSelectedSources] = useState(['all']);
  const [activeSourceView, setActiveSourceView] = useState('all');
  const [sourceBalances, setSourceBalances] = useState({});
  const [showAddBalanceForm, setShowAddBalanceForm] = useState(false);

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
  const [maxRecordingTime] = useState(30); // 30 seconds max

  // Speech Recognition Refs
  const recognitionRef = useRef(null);
  const recordingTimerRef = useRef(null);

  // Perplexity API key
  const PERPLEXITY_API_KEY = process.env.REACT_APP_PERPLEXITY_API_KEY;

  // Fixed sources - Cash, Bank, UPI only with 0 initial balance
  const [sources] = useState([
    {
      id: 'cash_001',
      type: 'CASH',
      name: 'Cash',
      balance: 0,
      initialBalance: 0,
      isActive: true,
      alertThreshold: 500,
      color: '#10b981',
      description: 'Physical cash payments'
    },
    {
      id: 'bank_001',
      type: 'BANK',
      name: 'Bank Account',
      balance: 0,
      initialBalance: 0,
      isActive: true,
      alertThreshold: 1000,
      color: '#0ea5e9',
      description: 'Bank account transfers and payments'
    },
    {
      id: 'upi_001',
      type: 'UPI',
      name: 'UPI',
      balance: 0,
      initialBalance: 0,
      isActive: true,
      alertThreshold: 500,
      color: '#3b82f6',
      description: 'UPI payments (PhonePe, Google Pay, etc.)'
    }
  ]);

  const [currentExpense, setCurrentExpense] = useState({
    amount: '',
    vendor: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    sourceId: ''
  });

  // Add Balance Form State
  const [addBalanceForm, setAddBalanceForm] = useState({
    sourceId: '',
    amount: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  const categories = [
    'Food & Drink',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Healthcare',
    'Utilities',
    'Travel',
    'Education',
    'Business',
    'Other'
  ];

  // Source types and their properties
  const sourceTypes = [
    { id: 'UPI', name: 'UPI Account', icon: Smartphone, color: '#3b82f6', description: 'PhonePe, Google Pay, Paytm, etc.' },
    { id: 'BANK', name: 'Bank Account', icon: Building2, color: '#0ea5e9', description: 'Bank transfers and payments' },
    { id: 'CASH', name: 'Cash', icon: Wallet, color: '#10b981', description: 'Physical cash payments' }
  ];

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

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedExpenses = localStorage.getItem('expenses');
    const savedSourceBalances = localStorage.getItem('sourceBalances');
    const savedInitialBalances = localStorage.getItem('initialBalances');
    
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    }
    
    if (savedSourceBalances) {
      setSourceBalances(JSON.parse(savedSourceBalances));
    } else {
      const initialBalances = {};
      sources.forEach(source => {
        initialBalances[source.id] = 0;
      });
      setSourceBalances(initialBalances);
      localStorage.setItem('sourceBalances', JSON.stringify(initialBalances));
    }

    if (savedInitialBalances) {
      const initialBalances = JSON.parse(savedInitialBalances);
      sources.forEach(source => {
        if (initialBalances[source.id] !== undefined) {
          source.initialBalance = initialBalances[source.id];
        }
      });
    }
  }, []);

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
      
      // Start timer
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

  // Perplexity AI Processing (adapted from paste2.txt)
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
            content: `You are an expert financial voice assistant specializing in expense tracking and categorization. You process spoken expense descriptions and extract structured financial data.

CORE CAPABILITIES:
- Natural language expense processing from voice input
- Intelligent payment source detection from voice keywords
- Enhanced date extraction from natural language
- Real-time business verification using current data
- Intelligent categorization based on current business information
- Accurate amount and date extraction with validation

PAYMENT SOURCE DETECTION (PRIORITY FEATURE):
Available sources: Cash (cash_001), UPI (upi_001), Bank Account (bank_001)

Keywords for each source:
- Cash: "cash", "physical money", "notes", "coins", "wallet"
- UPI: "upi", "phonepe", "google pay", "gpay", "paytm", "phone pe", "digital payment"
- Bank Account: "bank", "card", "debit", "credit", "account", "transfer"

If no specific payment method mentioned, select source with highest balance.

DATE EXTRACTION ENHANCEMENT:
- Natural language: "today", "yesterday", "tomorrow", "last Monday", "two days ago", "3 days ago"
- Specific dates: "on 15th June", "June 15th", "15/06", "15-06-2025"
- Relative dates: "last week", "this morning", "last night"
- Default to current date (2025-06-24) if not specified

INDIAN MARKET FOCUS:
- Primary currency: Indian Rupee (₹, Rs, INR, Rupees)
- Indian number format: 1,00,000 (lakhs), 10,00,000 (10 lakhs)
- Common Indian businesses and chains
- Indian payment methods and terminology

VOICE INPUT PROCESSING RULES:
Amount Extraction:
- Listen for: "I spent", "paid", "cost", "price was", "amount", "bill was"
- Currency mentions: "rupees", "Rs", "INR", "bucks"
- Number formats: "fifty rupees", "hundred and fifty", "one thousand two hundred"
- Support both words and numbers: "twenty five" = 25, "1500" = 1500

Vendor Extraction:
- Business names: restaurants, shops, online platforms
- Use real-time search to verify and standardize business names
- Handle variations: "Starbucks", "star bucks", "that coffee place"
- Context clues: "at McDonald's", "from Amazon", "Zomato order"

Category Classification (use exactly one):
Food & Drink, Transportation, Shopping, Entertainment, Healthcare, Utilities, Travel, Education, Business, Other

Special Voice Patterns with Source Detection:
- "I paid cash for coffee at Starbucks 250 rupees" → Source: cash_001, Vendor: Starbucks, Amount: 250
- "UPI payment to Uber for 180 yesterday" → Source: upi_001, Vendor: Uber, Amount: 180, Date: yesterday
- "Bank transfer for electricity bill 1500 two days ago" → Source: bank_001, Category: Utilities, Date: 2 days ago
- "Amazon order via card for 2500" → Source: bank_001, Vendor: Amazon, Amount: 2500

RESPONSE FORMAT: Return ONLY valid JSON:
{
  "vendor": "Standardized Business Name",
  "amount": 25.99,
  "date": "2025-06-24", 
  "category": "Food & Drink",
  "description": "Brief description of purchase (max 50 chars)",
  "sourceId": "cash_001",
  "confidence": 85,
  "reasoning": "Explanation of categorization, source detection, and date processing"
}

CONFIDENCE SCORING:
90-100: Clear vendor, amount, source, and date from voice input
80-89: Good extraction with minor assumptions
70-79: Reasonable extraction, some inference required
60-69: Fair extraction, moderate uncertainty
50-59: Poor voice quality, significant guessing
0-49: Very unclear input, highly uncertain extraction

If any form field is unclear (like category/vendor), assign a reasonable value based on context.
ALWAYS include sourceId in response based on voice keywords or highest balance fallback.
Use your real-time search capabilities to verify business names and enhance categorization accuracy when possible.`
          },
          {
            role: "user", 
            content: `Process this voice input for expense tracking. Extract vendor, amount, date, category, and payment source:\n\n"${voiceText}"`
          }
        ],
        temperature: 0.2,
        max_tokens: 400,
        stream: false
      })
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        if (retryCount < maxRetries) {
          const delay = baseDelay * Math.pow(2, retryCount) + Math.random() * 1000;
          console.log(`Rate limit hit, retrying in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return extractDataWithPerplexity(voiceText, retryCount + 1);
        } else {
          throw new Error('Rate limit exceeded after maximum retries. Please wait a few minutes and try again.');
        }
      }
      
      if (response.status === 401) {
        throw new Error('Invalid Perplexity API key. Please check your configuration.');
      }
      
      if (response.status === 403) {
        throw new Error('Access forbidden. Check your API key permissions or account credits.');
      }
      
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from Perplexity API');
    }
    
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    if (error.message.includes('Rate limit') || error.message.includes('API error')) {
      throw error;
    }
    console.error('Perplexity API Error Details:', error);
    throw new Error(`API call failed: ${error.message}`);
  }
};

  // Basic text processing fallback
const extractBasicDataFromVoice = (text) => {
  const lowerText = text.toLowerCase();
  
  // Extract amount (same as before)
  const amountPatterns = [
    /(?:spent|paid|cost|price|amount|bill).*?(\d+(?:\.\d{2})?)\s*(?:rupees|rs|inr|bucks)?/i,
    /(\d+(?:\.\d{2})?)\s*(?:rupees|rs|inr|bucks)/i,
    /(?:rupees|rs|inr)\s*(\d+(?:\.\d{2})?)/i,
    /(\d+(?:\.\d{2})?)/
  ];
  
  let amount = 0;
  for (const pattern of amountPatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      amount = parseFloat(match[1]);
      break;
    }
  }
  
  // Extract vendor (same as before)
  const vendorPatterns = [
    /(?:at|from|on)\s+([a-zA-Z][a-zA-Z\s&'.-]{2,30})/i,
    /([a-zA-Z][a-zA-Z\s&'.-]{2,30})\s+(?:for|cost|paid)/i
  ];
  
  let vendor = '';
  for (const pattern of vendorPatterns) {
    const match = text.match(pattern);
    if (match) {
      vendor = match[1].trim();
      break;
    }
  }
  
  // Enhanced source detection
  let detectedSourceId = '';
  
  // Check for specific payment method keywords
  if (lowerText.includes('cash') || lowerText.includes('physical money') || lowerText.includes('notes')) {
    detectedSourceId = 'cash_001';
  } else if (lowerText.includes('upi') || lowerText.includes('phonepe') || lowerText.includes('google pay') || 
             lowerText.includes('paytm') || lowerText.includes('gpay') || lowerText.includes('phone pe')) {
    detectedSourceId = 'upi_001';
  } else if (lowerText.includes('bank') || lowerText.includes('card') || lowerText.includes('debit') || 
             lowerText.includes('credit') || lowerText.includes('account')) {
    detectedSourceId = 'bank_001';
  } else {
    // Fallback: Select source with highest balance
    const sourceWithHighestBalance = sources.reduce((prev, current) => {
      const prevBalance = sourceBalances[prev.id] || 0;
      const currentBalance = sourceBalances[current.id] || 0;
      return currentBalance > prevBalance ? current : prev;
    });
    detectedSourceId = sourceWithHighestBalance.id;
  }
  
  // Enhanced date extraction
  let detectedDate = new Date().toISOString().split('T')[0]; // Default to today
  
  // Check for specific date mentions
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (lowerText.includes('yesterday')) {
    detectedDate = yesterday.toISOString().split('T')[0];
  } else if (lowerText.includes('tomorrow')) {
    detectedDate = tomorrow.toISOString().split('T')[0];
  } else if (lowerText.includes('today') || lowerText.includes('just now') || lowerText.includes('right now')) {
    detectedDate = today.toISOString().split('T')[0];
  } else {
    // Check for "X days ago" pattern
    const daysAgoMatch = lowerText.match(/(\d+)\s*days?\s*ago/);
    if (daysAgoMatch) {
      const daysAgo = parseInt(daysAgoMatch[1]);
      const dateAgo = new Date(today);
      dateAgo.setDate(dateAgo.getDate() - daysAgo);
      detectedDate = dateAgo.toISOString().split('T')[0];
    }
    
    // Check for specific date formats
    const datePatterns = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // DD/MM/YYYY or MM/DD/YYYY
      /(\d{1,2})-(\d{1,2})-(\d{4})/,   // DD-MM-YYYY or MM-DD-YYYY
      /(\d{4})-(\d{1,2})-(\d{1,2})/    // YYYY-MM-DD
    ];
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        // Assume DD/MM/YYYY format for first two patterns
        if (pattern === datePatterns[2]) {
          // YYYY-MM-DD format
          detectedDate = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
        } else {
          // DD/MM/YYYY format
          const day = match[1].padStart(2, '0');
          const month = match[2].padStart(2, '0');
          const year = match[3];
          detectedDate = `${year}-${month}-${day}`;
        }
        break;
      }
    }
  }
  
  // Basic category detection (same as before)
  let category = 'Other';
  if (lowerText.includes('coffee') || lowerText.includes('restaurant') || lowerText.includes('food') || 
      lowerText.includes('lunch') || lowerText.includes('dinner') || lowerText.includes('breakfast')) {
    category = 'Food & Drink';
  } else if (lowerText.includes('uber') || lowerText.includes('taxi') || lowerText.includes('bus') || 
             lowerText.includes('transport') || lowerText.includes('metro') || lowerText.includes('auto')) {
    category = 'Transportation';
  } else if (lowerText.includes('amazon') || lowerText.includes('shop') || lowerText.includes('store') || 
             lowerText.includes('bought') || lowerText.includes('purchase')) {
    category = 'Shopping';
  } else if (lowerText.includes('bill') || lowerText.includes('electricity') || lowerText.includes('water') || 
             lowerText.includes('utility') || lowerText.includes('gas') || lowerText.includes('internet')) {
    category = 'Utilities';
  } else if (lowerText.includes('movie') || lowerText.includes('entertainment') || lowerText.includes('game') || 
             lowerText.includes('concert')) {
    category = 'Entertainment';
  } else if (lowerText.includes('doctor') || lowerText.includes('medicine') || lowerText.includes('hospital') || 
             lowerText.includes('health')) {
    category = 'Healthcare';
  }
  
  return {
    vendor: vendor || 'Voice Entry',
    amount: amount,
    date: detectedDate,
    category: category,
    description: text.substring(0, 50),
    confidence: 40,
    reasoning: 'Basic voice text parsing with source and date detection',
    sourceId: detectedSourceId
  };
};

  // Process voice transcript
  const processVoiceTranscript = async (text) => {
  setIsProcessingVoice(true);
  setVoiceError('');
  
  try {
    let result;
    
    if (!canMakeApiCall()) {
      console.log('Rate limit prevention: using enhanced basic voice parsing');
      setAiError('Rate limit prevention active. Using enhanced parsing to avoid API limits.');
      setTimeout(() => setAiError(''), 5000);
      result = extractBasicDataFromVoice(text);
    } else {
      try {
        setIsProcessingAI(true);
        console.log('Processing voice input with Perplexity AI...');
        result = await extractDataWithPerplexity(text);
        
        // If AI didn't detect source, use our enhanced detection
        if (!result.sourceId) {
          const basicResult = extractBasicDataFromVoice(text);
          result.sourceId = basicResult.sourceId;
        }
        
        setAiSuccess(true);
        setTimeout(() => setAiSuccess(false), 5000);
      } catch (error) {
        // console.error('Perplexity AI parsing failed:', error);
        setAiError(`AI parsing failed: ${error.message}`);
        setTimeout(() => setAiError(''), 5000);
        result = extractBasicDataFromVoice(text);
      }
    }
    
    // Auto-fill form with extracted data including source
    setCurrentExpense(prev => ({
      ...prev,
      amount: result.amount > 0 ? result.amount.toFixed(2) : '',
      vendor: result.vendor || '',
      date: result.date || new Date().toISOString().split('T')[0],
      category: result.category || 'Other',
      description: result.description || '',
      sourceId: result.sourceId || '' // Auto-select detected source
    }));
    
    setAiCategorizedData(result);
    setVoiceSuccess(true);
    setTimeout(() => setVoiceSuccess(false), 5000);
    
  } catch (error) {
    console.error('Voice processing failed:', error);
    setVoiceError('Failed to process voice input. Please try again or enter details manually.');
    setTimeout(() => setVoiceError(''), 5000);
  } finally {
    setIsProcessingVoice(false);
    setIsProcessingAI(false);
  }
};

  // Calculate source balances from transactions and initial balances
  const calculateSourceBalances = () => {
    const balances = {};
    
    sources.forEach(source => {
      balances[source.id] = source.initialBalance;
    });
    
    expenses.forEach(expense => {
      if (expense.sourceId && balances[expense.sourceId] !== undefined) {
        balances[expense.sourceId] -= expense.amount;
      }
    });
    
    return balances;
  };

  // Update source balance calculations whenever expenses change
  useEffect(() => {
    const newBalances = calculateSourceBalances();
    setSourceBalances(newBalances);
    localStorage.setItem('sourceBalances', JSON.stringify(newBalances));
  }, [expenses, sources]);

  // Add Balance to Source Function
  const handleAddBalance = () => {
    if (!addBalanceForm.sourceId || !addBalanceForm.amount || parseFloat(addBalanceForm.amount) <= 0) {
      alert('Please select a source and enter a valid amount');
      return;
    }

    const amount = parseFloat(addBalanceForm.amount);
    
    const updatedSources = sources.map(source => {
      if (source.id === addBalanceForm.sourceId) {
        return { ...source, initialBalance: source.initialBalance + amount };
      }
      return source;
    });

    const initialBalances = {};
    updatedSources.forEach(source => {
      initialBalances[source.id] = source.initialBalance;
    });
    localStorage.setItem('initialBalances', JSON.stringify(initialBalances));

    sources.forEach((source, index) => {
      if (source.id === addBalanceForm.sourceId) {
        sources[index].initialBalance += amount;
      }
    });

    const newBalances = calculateSourceBalances();
    setSourceBalances(newBalances);
    localStorage.setItem('sourceBalances', JSON.stringify(newBalances));

    setAddBalanceForm({ sourceId: '', amount: '' });
    setShowAddBalanceForm(false);

    window.dispatchEvent(new CustomEvent('expensesUpdated', { 
      detail: expenses 
    }));
  };

  // Filter expenses based on selected sources
  const getFilteredExpenses = () => {
    if (selectedSources.includes('all')) {
      return expenses;
    }
    return expenses.filter(expense => selectedSources.includes(expense.sourceId));
  };

  // Get balance status for UI styling
  const getBalanceStatus = (balance, threshold) => {
    if (balance > threshold * 2) return { status: 'high', color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' };
    if (balance > threshold) return { status: 'medium', color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' };
    return { status: 'low', color: 'text-rose-700', bgColor: 'bg-rose-50', borderColor: 'border-rose-200' };
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

  const handleSubmit = () => {
    if (!currentExpense.amount || !currentExpense.vendor || !currentExpense.date || !currentExpense.category || !currentExpense.sourceId) {
      alert('Please fill in all required fields including payment source');
      return;
    }
    
    let updatedExpenses;
    
    if (isEditing) {
      updatedExpenses = expenses.map(expense => 
        expense.id === editingId 
          ? { ...currentExpense, id: editingId, amount: parseFloat(currentExpense.amount) }
          : expense
      );
      setIsEditing(false);
      setEditingId(null);
    } else {
      const newExpense = {
        ...currentExpense,
        id: Date.now(),
        amount: parseFloat(currentExpense.amount)
      };
      updatedExpenses = [newExpense, ...expenses];
    }
    
    localStorage.setItem('expenses', JSON.stringify(updatedExpenses));
    setExpenses(updatedExpenses);
    
    window.dispatchEvent(new CustomEvent('expensesUpdated', { 
      detail: updatedExpenses 
    }));
    
    resetForm();
  };
  
  const resetForm = () => {
    setCurrentExpense({
      amount: '',
      vendor: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      description: '',
      sourceId: ''
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
      amount: expense.amount.toString()
    });
    setIsEditing(true);
    setEditingId(expense.id);
    setShowForm(true);
  };
  
  const deleteExpense = (id) => {
    const updatedExpenses = expenses.filter(expense => expense.id !== id);
    setExpenses(updatedExpenses);
    localStorage.setItem('expenses', JSON.stringify(updatedExpenses));
  };
  
  const filteredExpenses = getFilteredExpenses();
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  const totalSourceBalance = Object.values(sourceBalances).reduce((sum, balance) => sum + balance, 0);

  const getSourceTypeInfo = (type) => {
    return sourceTypes.find(st => st.id === type) || sourceTypes[0];
  };

  const getSourceById = (id) => {
    return sources.find(source => source.id === id);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Dashboard Header with Cards */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            {/* Main Stats Card */}
            <div className="lg:col-span-8 bg-gradient-to-br from-blue-600 to-teal-600 text-white p-8">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Spendigo - Voice Enabled</h1>
                  <p className="text-blue-100 text-lg">Track expenses with voice commands and AI categorization</p>
                </div>
                <div className="mt-4 lg:mt-0">
                  <div className="text-right">
                    <p className="text-blue-100 text-sm">Total Balance</p>
                    <p className="text-4xl font-bold">{formatIndianCurrency(totalSourceBalance)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Add Card */}
            <div className="lg:col-span-4 bg-white border border-slate-200 p-6 flex flex-col justify-center gap-3">
              <button
                onClick={() => setShowForm(true)}
                className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white p-3 hover:from-emerald-600 hover:to-blue-600 transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
              >
                <Plus size={18} />
                Add Expense
              </button>
              
              <button
                onClick={() => setShowAddBalanceForm(true)}
                className="w-full bg-gradient-to-r from-violet-500 to-purple-500 text-white p-3 hover:from-violet-600 hover:to-purple-600 transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
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
              className={`p-6 border-2 transition-all duration-200 ${
                selectedSources.includes('all')
                  ? 'border-slate-800 bg-slate-800 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <Activity size={24} className={selectedSources.includes('all') ? 'text-white' : 'text-slate-600'} />
                <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700">ALL</span>
              </div>
              <h3 className="font-bold text-lg">All Sources</h3>
              <p className="text-sm opacity-75 mb-2">Combined Balance</p>
              <p className="text-xl font-bold">{formatIndianCurrency(totalSourceBalance)}</p>
            </button>

            {sources.map(source => {
              const typeInfo = getSourceTypeInfo(source.type);
              const Icon = typeInfo.icon;
              const balance = sourceBalances[source.id] || 0;
              const balanceStatus = getBalanceStatus(balance, source.alertThreshold);
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
                  className={`p-6 border-2 transition-all duration-200 ${
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
                    <span 
                      className={`text-xs px-2 py-1 ${balance === 0 ? 'bg-slate-100 text-slate-600' : balanceStatus.bgColor + ' ' + balanceStatus.color}`}
                    >
                      {balance === 0 ? 'EMPTY' : balanceStatus.status.toUpperCase()}
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

        {/* Add Balance Form - Overlay Style */}
        {showAddBalanceForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-800">Add Balance</h2>
                  <button
                    onClick={() => {
                      setShowAddBalanceForm(false);
                      setAddBalanceForm({ sourceId: '', amount: '' });
                    }}
                    className="p-2 text-slate-400 hover:text-slate-600"
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
                      const typeInfo = getSourceTypeInfo(source.type);
                      const Icon = typeInfo.icon;
                      const balance = sourceBalances[source.id] || 0;
                      const isSelected = addBalanceForm.sourceId === source.id;
                      
                      return (
                        <button
                          key={source.id}
                          type="button"
                          onClick={() => setAddBalanceForm({...addBalanceForm, sourceId: source.id})}
                          className={`p-4 border-2 transition-all flex items-center gap-3 ${
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
                      className="w-full pl-8 pr-4 py-3 border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="px-6 py-3 border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddBalance}
                    className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-600 hover:to-purple-600 font-medium"
                  >
                    Add Balance
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Expense Form with Voice Recording - Overlay Style */}
{/* Add Expense Form with Voice Recording - FIXED SCROLLABLE MODAL */}
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
          maxHeight: 'calc(90vh - 140px)' // Subtract header and footer height
        }}
      >
        {/* Voice Recording Section */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
            <Mic size={20} />
            Voice Expense Entry
          </h3>
          
          {/* Browser Support Check */}
          {!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) && (
            <div className="mb-4 p-3 bg-orange-100 border border-orange-300 rounded-lg">
              <div className="flex items-center gap-2 text-orange-700">
                <AlertCircle size={16} />
                <span className="text-sm">Voice recognition not supported in this browser. Please use Chrome, Edge, or Safari.</span>
              </div>
            </div>
          )}

          {/* Rate Limit Warning */}
          {apiCallCount > 10 && (
            <div className="mb-4 p-3 bg-orange-100 border border-orange-300 rounded-lg">
              <div className="flex items-center gap-3 text-sm text-orange-700">
                <AlertCircle size={20} />
                <span>Approaching AI API rate limit ({apiCallCount}/15 calls this minute). Basic parsing will be used if limit is reached.</span>
              </div>
            </div>
          )}

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

          {/* Recording Progress */}
          {isRecording && (
            <div className="mb-4">
              <div className="flex items-center gap-2 text-red-600 font-medium mb-2">
                <Volume2 size={16} className="animate-bounce" />
                Recording... {recordingDuration}/{maxRecordingTime}s
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-600 h-2 rounded-full transition-all duration-1000" 
                  style={{ width: `${(recordingDuration / maxRecordingTime) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

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
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-purple-600 font-medium">
                  <Brain size={16} className="animate-pulse" />
                  Perplexity AI analyzing and categorizing...
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full animate-pulse"></div>
                </div>
              </div>
            )}
            {voiceSuccess && (
              <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
                <Check size={16} />
                Voice processed successfully! Form auto-filled with extracted data.
              </div>
            )}
            {aiSuccess && (
              <div className="flex items-center gap-2 text-purple-600 font-medium text-sm">
                <Brain size={16} />
                AI enhancement completed! Data verified and categorized.
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

          {/* AI Analysis Results */}
          {/* {aiCategorizedData && (
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                <Brain size={16} />
                AI Analysis Results (Confidence: {aiCategorizedData.confidence}%)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-purple-600 font-medium">Vendor:</span>
                  <span className="ml-2 text-gray-700">{aiCategorizedData.vendor}</span>
                </div>
                <div>
                  <span className="text-purple-600 font-medium">Amount:</span>
                  <span className="ml-2 text-gray-700">{formatIndianCurrency(aiCategorizedData.amount)}</span>
                </div>
                <div>
                  <span className="text-purple-600 font-medium">Category:</span>
                  <span className="ml-2 text-gray-700">{aiCategorizedData.category}</span>
                </div>
                <div>
                  <span className="text-purple-600 font-medium">Processed by:</span>
                  <span className="ml-2 text-gray-700">Voice + AI</span>
                </div>
              </div>
              {aiCategorizedData.reasoning && (
                <div className="mt-2">
                  <span className="text-purple-600 font-medium text-sm">AI Reasoning:</span>
                  <p className="text-xs text-gray-600 mt-1">{aiCategorizedData.reasoning}</p>
                </div>
              )}
            </div>
          )} */}
        </div>

        {/* Payment Source Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">Select Payment Source</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {sources.filter(source => source.isActive).map(source => {
              const typeInfo = getSourceTypeInfo(source.type);
              const Icon = typeInfo.icon;
              const balance = sourceBalances[source.id] || 0;
              const isSelected = currentExpense.sourceId === source.id;
              
              return (
                <button
                  key={source.id}
                  type="button"
                  onClick={() => setCurrentExpense({...currentExpense, sourceId: source.id})}
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

        {/* Balance Warning */}
        {currentExpense.sourceId && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            {(() => {
              const selectedSource = getSourceById(currentExpense.sourceId);
              const balance = sourceBalances[currentExpense.sourceId] || 0;
              const amount = parseFloat(currentExpense.amount) || 0;
              const newBalance = balance - amount;
              
              if (balance === 0) {
                return (
                  <div className="flex items-center gap-2 text-amber-700">
                    <AlertCircle size={20} />
                    <div>
                      <p className="font-semibold">No Balance Available</p>
                      <p className="text-sm">Add balance to this source before making expenses.</p>
                    </div>
                  </div>
                );
              } else if (amount > balance) {
                return (
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle size={20} />
                    <div>
                      <p className="font-semibold">Insufficient Balance!</p>
                      <p className="text-sm">This transaction exceeds available funds by {formatIndianCurrency(amount - balance)}</p>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Current Balance:</p>
                      <p className="text-lg font-bold text-blue-800">{formatIndianCurrency(balance)}</p>
                    </div>
                    {amount > 0 && (
                      <div className="text-left sm:text-right">
                        <p className="text-sm font-medium text-blue-700">After Transaction:</p>
                        <p className="text-lg font-bold text-blue-800">{formatIndianCurrency(newBalance)}</p>
                      </div>
                    )}
                  </div>
                );
              }
            })()}
          </div>
        )}

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
              value={currentExpense.date}
              onChange={(e) => setCurrentExpense({...currentExpense, date: e.target.value})}
              className="w-full px-4 py-3 border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg"
              required
            />
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-2">Category</label>
            <select
              id="category"
              value={currentExpense.category}
              onChange={(e) => setCurrentExpense({...currentExpense, category: e.target.value})}
              className="w-full px-4 py-3 border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg"
              required
            >
              <option value="">Select category</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
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

        {/* Extra padding at bottom to ensure content is not cut off */}
        <div style={{ height: '20px' }}></div>
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



        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Expenses List - Always List Mode */}
          <div className="lg:col-span-8">
            <div className="bg-white border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-800">Recent Transactions</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">
                      {filteredExpenses.length} transaction{filteredExpenses.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {filteredExpenses.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle size={48} className="text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 text-lg font-medium mb-2">No transactions found</p>
                    <p className="text-slate-500">Add balance to your sources and start tracking expenses with voice or manual entry</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredExpenses.map(expense => {
                      const source = getSourceById(expense.sourceId);
                      const typeInfo = source ? getSourceTypeInfo(source.type) : null;
                      const Icon = typeInfo?.icon;
                      
                      return (
                        <div key={expense.id} className="border border-slate-200 p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              {source && (
                                <div 
                                  className="w-10 h-10 flex items-center justify-center text-white"
                                  style={{ backgroundColor: source.color }}
                                >
                                  {Icon && <Icon size={16} />}
                                </div>
                              )}
                              <div>
                                <h3 className="font-semibold text-slate-800">{expense.vendor}</h3>
                                <p className="text-sm text-slate-600">{expense.category}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg text-slate-800">{formatIndianCurrency(expense.amount)}</p>
                              <p className="text-sm text-slate-600">{expense.date}</p>
                            </div>
                          </div>
                          
                          {expense.description && (
                            <p className="text-sm text-slate-600 mb-3">{expense.description}</p>
                          )}
                          
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => editExpense(expense)}
                              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => deleteExpense(expense.id)}
                              className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
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

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Category Breakdown */}
            <div className="bg-white border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-800">Spending Categories</h3>
              </div>
              <div className="p-6">
                {Object.keys(expensesByCategory).length === 0 ? (
                  <p className="text-slate-500 text-center py-4">No expenses yet</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(expensesByCategory)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([category, amount]) => {
                        const percentage = ((amount / totalExpenses) * 100).toFixed(1);
                        return (
                          <div key={category} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-slate-700">{category}</span>
                              <span className="text-sm font-bold text-slate-800">{formatIndianCurrency(amount)}</span>
                            </div>
                            <div className="w-full bg-slate-200 h-2">
                              <div 
                                className="h-2 bg-gradient-to-r from-blue-500 to-teal-500 transition-all duration-500" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-slate-500">{percentage}% of total spending</p>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* Voice Usage Stats */}
            <div className="bg-white border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-800">Voice Assistant</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <Mic size={20} className="text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-purple-800">Voice Recording</p>
                      <p className="text-xs text-purple-600">Say your expense naturally</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Brain size={20} className="text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">AI Processing</p>
                      <p className="text-xs text-blue-600">Smart categorization with Perplexity</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">
                      API Calls: {apiCallCount}/15 per minute
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-800">Quick Stats</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Average Transaction</span>
                  <span className="font-bold text-slate-800">
                    {formatIndianCurrency(filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Largest Expense</span>
                  <span className="font-bold text-slate-800">
                    {formatIndianCurrency(filteredExpenses.length > 0 ? Math.max(...filteredExpenses.map(e => e.amount)) : 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Total Categories</span>
                  <span className="font-bold text-slate-800">{Object.keys(expensesByCategory).length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTracker;
