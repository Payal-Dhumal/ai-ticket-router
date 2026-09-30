import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Home,
  FileText,
  List,
  BarChart2,
  Settings,
  Headphones,
  Calendar,
  Bell,
  ChevronDown,
  Download,
  Filter,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RotateCcw,
  Sliders,
  Target,
  ShieldCheck,
  Users,
  Check,
  UploadCloud,
  Play,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  User,
  Box,
  HelpCircle,
  Sparkles,
  Wrench,
  Tag,
  PieChart,
  BarChart3,
  Activity,
  Save,
  RefreshCw,
  Cpu,
  Inbox,
  Trash2,
  X,
  ExternalLink,
  Copy,
} from 'lucide-react';

// 21 Pre-built real customer inquiry samples across 8 domains
const SAMPLE_SUGGESTIONS = [
  // Payment Issues
  {
    tag: 'Billing & Payments',
    text: 'My credit card was charged twice for order #48291. Please refund the duplicate transaction immediately.',
  },
  {
    tag: 'Billing & Payments',
    text: 'My payment was deducted from my bank account but the website showed order failed. Where is my money?',
  },
  {
    tag: 'Billing & Payments',
    text: 'Why was I charged an extra $25 on my monthly subscription invoice this month without notice?',
  },
  // Order Issues
  {
    tag: 'Product Issue',
    text: 'I received order #55120 today but item SKU-901 was missing from the box.',
  },
  {
    tag: 'Product Issue',
    text: 'I mistakenly ordered 5 units of the wireless mouse instead of 1 unit. Can you modify order #44910?',
  },
  {
    tag: 'Product Issue',
    text: 'The order confirmation shows the wrong color for the jacket I purchased. Can you change it to Navy Blue?',
  },
  // Delivery Issues
  {
    tag: 'Delivery Issue',
    text: 'My package has not arrived and tracking says delivered yesterday. Where is it?',
  },
  {
    tag: 'Delivery Issue',
    text: 'The courier left the package in the rain and the contents are completely water-damaged.',
  },
  {
    tag: 'Delivery Issue',
    text: 'Tracking number TRK-99214 hasn\'t updated in 6 days and the estimated delivery date has passed.',
  },
  // Refund Requests
  {
    tag: 'Billing & Payments',
    text: 'I would like to return the damaged item I received last week and request a full refund.',
  },
  {
    tag: 'Billing & Payments',
    text: 'I returned order #39102 two weeks ago according to tracking, but have not received my refund yet.',
  },
  // Product Issues
  {
    tag: 'Product Issue',
    text: 'The wireless headphones I received make a loud buzzing noise in the left ear and won\'t charge.',
  },
  {
    tag: 'Product Issue',
    text: 'The blender stopped working after two days of light use. The motor smells burnt.',
  },
  // Account Issues
  {
    tag: 'Account Access',
    text: 'I am locked out of my account and not receiving the password reset email.',
  },
  {
    tag: 'Account Access',
    text: 'I lost access to my two-factor authentication device and cannot log into my dashboard.',
  },
  // Technical Issues
  {
    tag: 'Technical Issue',
    text: 'The mobile application crashes every time I open the checkout screen on iOS 17.',
  },
  {
    tag: 'Technical Issue',
    text: 'I keep getting error code 500 when attempting to upload documents in the customer portal.',
  },
  // Cancellation Requests
  {
    tag: 'Account Management',
    text: 'Please cancel order #77192 immediately before it ships from the fulfillment warehouse.',
  },
  {
    tag: 'Account Management',
    text: 'I want to cancel my annual Pro subscription and ensure auto-renewal is turned off.',
  },
  // Product & General Inquiries
  {
    tag: 'Product Inquiry',
    text: 'Can you confirm if this laptop bag is waterproof and fits a 15-inch MacBook Pro?',
  },
  {
    tag: 'General Inquiry',
    text: 'What is the warranty coverage period for international purchases and how do claims work?',
  },
];

const CATEGORY_FILTERS = [
  'All',
  'Billing & Payments',
  'Account Access',
  'Product Issue',
  'Product Inquiry',
  'Technical Issue',
  'General Inquiry',
  'Account Management',
];

const CATEGORY_COLORS = [
  '#0284c7', // blue
  '#ea580c', // orange
  '#16a34a', // green
  '#9333ea', // purple
  '#db2777', // pink
  '#475569', // slate
  '#0891b2', // cyan
  '#d97706', // amber
];

const TIME_FILTER_OPTIONS = [
  { id: 'Today', label: 'Today', subtext: 'Past 24 hours' },
  { id: 'This Week', label: 'This Week', subtext: 'Past 7 days' },
  { id: 'This Month', label: 'This Month', subtext: 'Past 30 days' },
  { id: 'All Time', label: 'All Time', subtext: 'Complete ticket history' },
];

const getTimeRangeLabel = (filter) => {
  const now = new Date();
  const formatShort = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formatFull = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (filter === 'Today') {
    return formatFull(now);
  }
  if (filter === 'This Week') {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    return `${formatShort(start)} - ${formatFull(now)}`;
  }
  if (filter === 'This Month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return `${formatShort(start)} - ${formatFull(now)}`;
  }
  if (filter === 'All Time') {
    return 'All Time History';
  }
  return filter;
};

export default function App() {
  const [activeNav, setActiveNav] = useState('dashboard'); // 'dashboard', 'single', 'batch', 'tickets', 'analytics', 'settings'
  const [threshold, setThreshold] = useState(0.70);
  const [status, setStatus] = useState({ configured: true, loading: false });
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Time filter dropdown state
  const [timeFilter, setTimeFilter] = useState('This Week');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showHeaderDateDropdown, setShowHeaderDateDropdown] = useState(false);

  const timeDropdownRef = useRef(null);
  const headerDateDropdownRef = useRef(null);

  // Ticket processing records - strictly real session data
  const [ticketsList, setTicketsList] = useState([]);
  const [tablePriorityFilter, setTablePriorityFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;

  // Actions menu & Ticket Details Modal State
  const [openActionRowId, setOpenActionRowId] = useState(null);
  const [selectedTicketDetail, setSelectedTicketDetail] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Reset to first page whenever priority or time filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [timeFilter, tablePriorityFilter]);

  // Load real classified tickets from backend store on mount
  useEffect(() => {
    fetch('/api/tickets')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.tickets)) {
          setTicketsList(data.tickets.map((t) => ({ ...t, timestamp: t.timestamp || Date.now() })));
        }
      })
      .catch((err) => {
        console.error('Failed to load tickets:', err);
      });
  }, []);

  // Single Ticket Analysis State
  const [ticketInput, setTicketInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [singleResult, setSingleResult] = useState(null);
  const [singleError, setSingleError] = useState(null);

  // Batch Processing State
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [batchError, setBatchError] = useState(null);

  // Settings State
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [autoEscalate, setAutoEscalate] = useState(true);
  const [defaultDepartment, setDefaultDepartment] = useState('General Support');

  const inputContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Close dropdowns & suggestions on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (inputContainerRef.current && !inputContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(event.target)) {
        setShowTimeDropdown(false);
      }
      if (headerDateDropdownRef.current && !headerDateDropdownRef.current.contains(event.target)) {
        setShowHeaderDateDropdown(false);
      }
      if (!event.target.closest('[data-action-cell]')) {
        setOpenActionRowId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch backend status
  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => setStatus({ configured: data.configured, loading: false }))
      .catch(() => setStatus({ configured: false, loading: false }));
  }, []);

  // Handle single ticket analysis
  const handleAnalyzeSingle = async () => {
    const text = ticketInput.trim();
    if (!text) {
      setSingleError('Please enter a customer support message to analyze.');
      return;
    }

    setSingleError(null);
    setIsAnalyzing(true);
    setShowSuggestions(false);

    try {
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket: text, threshold }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Analysis request failed');
      }

      setSingleResult(data);

      let confNum = data.category_probability_raw;
      if (confNum === undefined || confNum === null || isNaN(confNum)) {
        confNum = parseFloat(data.category_probability) / 100;
      }

      const newTicketRecord = {
        ticket_id: `TICK-${String(ticketsList.length + 1).padStart(4, '0')}`,
        ticket: text.length > 55 ? text.substring(0, 52) + '...' : text,
        category: data.category,
        priority: data.priority,
        confidence: data.category_probability,
        confidence_num: confNum,
        department: data.department,
        status: data.is_low_confidence ? 'Review' : 'Routed',
        created_at: 'Just now',
        timestamp: Date.now(),
        recommended_action: data.recommended_action,
      };

      setTicketsList((prev) => [newTicketRecord, ...prev]);
    } catch (err) {
      setSingleError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run 15 tickets from evaluation dataset
  const handleRunSampleBatch = async () => {
    setBatchError(null);
    setIsBatchAnalyzing(true);

    try {
      const res = await fetch(`/api/batch-sample?limit=15&threshold=${threshold}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed processing sample batch');

      const records = data.records || [];
      const newItems = records.map((r, idx) => {
        let confNum = r.category_probability_raw;
        if (confNum === undefined || confNum === null || isNaN(confNum)) {
          confNum = parseFloat(r.category_probability) / 100;
        }
        return {
          ticket_id: r.ticket_id || `TICK-${String(idx + 1).padStart(4, '0')}`,
          ticket: r.ticket.length > 55 ? r.ticket.substring(0, 52) + '...' : r.ticket,
          category: r.category,
          priority: r.priority,
          confidence: r.category_probability || r.probability || '0%',
          confidence_num: confNum,
          department: r.department,
          status: r.is_low_confidence ? 'Review' : 'Routed',
          created_at: 'Just now',
          timestamp: Date.now(),
          recommended_action: r.recommended_action,
        };
      });

      setTicketsList((prev) => [...newItems, ...prev]);
    } catch (err) {
      setBatchError(err.message);
    } finally {
      setIsBatchAnalyzing(false);
    }
  };

  // Upload CSV
  const handleUploadBatch = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBatchError(null);
    setIsBatchAnalyzing(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/batch-upload?threshold=${threshold}&limit=30`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed processing uploaded CSV');

      const records = data.records || [];
      const newItems = records.map((r, idx) => {
        let confNum = r.category_probability_raw;
        if (confNum === undefined || confNum === null || isNaN(confNum)) {
          confNum = parseFloat(r.category_probability) / 100;
        }
        return {
          ticket_id: r.ticket_id || `CSV-${String(idx + 1).padStart(4, '0')}`,
          ticket: r.ticket.length > 55 ? r.ticket.substring(0, 52) + '...' : r.ticket,
          category: r.category,
          priority: r.priority,
          confidence: r.category_probability || r.probability || '0%',
          confidence_num: confNum,
          department: r.department,
          status: r.is_low_confidence ? 'Review' : 'Routed',
          created_at: 'Just now',
          timestamp: Date.now(),
          recommended_action: r.recommended_action,
        };
      });

      setTicketsList((prev) => [...newItems, ...prev]);
    } catch (err) {
      setBatchError(err.message);
    } finally {
      setIsBatchAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Export CSV
  const handleDownloadCSV = () => {
    if (ticketsList.length === 0) return;
    const headers = ['ticket_id', 'ticket', 'category', 'confidence', 'priority', 'department', 'status', 'created_at'];
    const rows = ticketsList.map((r) =>
      headers
        .map((h) => {
          const val = r[h] !== undefined ? String(r[h]) : '';
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'support_tickets_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save Settings handler
  const handleSaveSettings = () => {
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  // Filter tickets by selected time range
  const timeFilteredTickets = useMemo(() => {
    if (timeFilter === 'All Time') return ticketsList;
    const now = Date.now();
    return ticketsList.filter((r) => {
      if (!r.timestamp) return true;
      const tTime = typeof r.timestamp === 'number' ? r.timestamp : new Date(r.timestamp).getTime();
      if (isNaN(tTime)) return true;

      if (timeFilter === 'Today') {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        return tTime >= startOfToday.getTime();
      } else if (timeFilter === 'This Week') {
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        return tTime >= sevenDaysAgo;
      } else if (timeFilter === 'This Month') {
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
        return tTime >= thirtyDaysAgo;
      }
      return true;
    });
  }, [ticketsList, timeFilter]);

  // KPI Calculations strictly computed from active time-filtered tickets
  const totalAnalyzed = timeFilteredTickets.length;
  const autoRoutedCount = useMemo(() => {
    return timeFilteredTickets.filter((t) => t.status === 'Routed').length;
  }, [timeFilteredTickets]);
  const reviewCount = useMemo(() => {
    return timeFilteredTickets.filter((t) => t.status === 'Review' || t.status === 'Unrouted').length;
  }, [timeFilteredTickets]);

  const avgConfidence = useMemo(() => {
    if (totalAnalyzed === 0) return '—';
    const totalProb = timeFilteredTickets.reduce((acc, t) => acc + (t.confidence_num !== undefined ? t.confidence_num : 0.8), 0);
    return Math.round((totalProb / totalAnalyzed) * 100) + '%';
  }, [timeFilteredTickets, totalAnalyzed]);

  // Real Category Distribution for Analytics
  const categoryDistribution = useMemo(() => {
    if (totalAnalyzed === 0) return [];
    const counts = {};
    timeFilteredTickets.forEach((t) => {
      const cat = t.category || 'General Inquiry';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([category, count], idx) => ({
        category,
        count,
        percentage: ((count / totalAnalyzed) * 100).toFixed(1),
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      }))
      .sort((a, b) => b.count - a.count);
  }, [timeFilteredTickets, totalAnalyzed]);

  // Real Priority Breakdown for Analytics
  const priorityBreakdown = useMemo(() => {
    const counts = { High: 0, Medium: 0, Low: 0 };
    timeFilteredTickets.forEach((t) => {
      const p = String(t.priority || '').trim();
      const norm = p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
      if (counts[norm] !== undefined) {
        counts[norm] += 1;
      } else if (norm === 'Urgent') {
        counts.High += 1;
      }
    });
    return counts;
  }, [timeFilteredTickets]);

  // Department distribution for Analytics
  const departmentDistribution = useMemo(() => {
    const counts = {};
    timeFilteredTickets.forEach((t) => {
      const dept = t.department || 'General Support';
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([department, count]) => ({
        department,
        count,
        percentage: ((count / totalAnalyzed) * 100).toFixed(1),
      }))
      .sort((a, b) => b.count - a.count);
  }, [timeFilteredTickets, totalAnalyzed]);

  // Filtered tickets for display (filtered by priority if selected)
  const filteredTickets = useMemo(() => {
    return timeFilteredTickets.filter((r) => {
      const matchPriority =
        tablePriorityFilter === 'All' ||
        (r.priority && String(r.priority).toLowerCase() === tablePriorityFilter.toLowerCase());
      return matchPriority;
    });
  }, [timeFilteredTickets, tablePriorityFilter]);

  // Pagination slice
  const totalEntries = filteredTickets.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  // Intent badge renderer matching the exact screenshot palette
  const renderIntentBadge = (intent) => {
    const text = String(intent || '').trim();
    if (text.includes('Billing') || text.includes('Payment')) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: 500,
            backgroundColor: '#ffedd5',
            color: '#ea580c',
            border: '1px solid #fed7aa',
          }}
        >
          <CreditCard size={12} color="#ea580c" />
          <span>{text}</span>
        </span>
      );
    }
    if (text.includes('Account Access')) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: 500,
            backgroundColor: '#dbeafe',
            color: '#2563eb',
            border: '1px solid #bfdbfe',
          }}
        >
          <User size={12} color="#2563eb" />
          <span>{text}</span>
        </span>
      );
    }
    if (text.includes('Product Issue')) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: 500,
            backgroundColor: '#e0f2fe',
            color: '#0284c7',
            border: '1px solid #bae6fd',
          }}
        >
          <Box size={12} color="#0284c7" />
          <span>{text}</span>
        </span>
      );
    }
    if (text.includes('Product Inquiry')) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: 500,
            backgroundColor: '#fce7f3',
            color: '#db2777',
            border: '1px solid #fbcfe8',
          }}
        >
          <Sparkles size={12} color="#db2777" />
          <span>{text}</span>
        </span>
      );
    }
    if (text.includes('Technical')) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: 500,
            backgroundColor: '#f3e8ff',
            color: '#9333ea',
            border: '1px solid #e9d5ff',
          }}
        >
          <Wrench size={12} color="#9333ea" />
          <span>{text}</span>
        </span>
      );
    }
    if (text.includes('Account Management')) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: 500,
            backgroundColor: '#dcfce7',
            color: '#16a34a',
            border: '1px solid #bbf7d0',
          }}
        >
          <Tag size={12} color="#16a34a" />
          <span>{text}</span>
        </span>
      );
    }
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 8px',
          borderRadius: '6px',
          fontSize: '0.74rem',
          fontWeight: 500,
          backgroundColor: '#f1f5f9',
          color: '#475569',
          border: '1px solid #e2e8f0',
        }}
      >
        <HelpCircle size={12} color="#475569" />
        <span>{text}</span>
      </span>
    );
  };

  // Priority Pill Renderer matching screenshot
  const renderPriorityPill = (priority) => {
    const p = String(priority || '').toLowerCase();
    if (p.includes('high') || p.includes('urgent')) {
      return (
        <span
          style={{
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: '9999px',
            fontSize: '0.74rem',
            fontWeight: 600,
            backgroundColor: '#fef2f2',
            color: '#ef4444',
            border: '1px solid #fee2e2',
          }}
        >
          High
        </span>
      );
    }
    if (p.includes('medium')) {
      return (
        <span
          style={{
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: '9999px',
            fontSize: '0.74rem',
            fontWeight: 600,
            backgroundColor: '#fffbeb',
            color: '#f59e0b',
            border: '1px solid #fef3c7',
          }}
        >
          Medium
        </span>
      );
    }
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '3px 10px',
          borderRadius: '9999px',
          fontSize: '0.74rem',
          fontWeight: 600,
          backgroundColor: '#f0f9ff',
          color: '#0284c7',
          border: '1px solid #e0f2fe',
        }}
      >
        Low
      </span>
    );
  };

  // Status Dot Renderer
  const renderStatus = (statusText) => {
    const s = String(statusText || '').toLowerCase();
    if (s.includes('routed')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#059669', fontSize: '0.78rem', fontWeight: 600 }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          Routed
        </span>
      );
    }
    if (s.includes('review')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#d97706', fontSize: '0.78rem', fontWeight: 600 }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
          Review
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.78rem', fontWeight: 500 }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#94a3b8' }} />
        Unrouted
      </span>
    );
  };

  const filteredSuggestions = SAMPLE_SUGGESTIONS.filter((item) => {
    return (
      selectedCategoryFilter === 'All' ||
      item.tag.toLowerCase().includes(selectedCategoryFilter.toLowerCase())
    );
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a' }}>
      {/* ======================================================== */}
      {/* 1. LEFT SIDEBAR (Dark Forest Green from Screenshot)       */}
      {/* ======================================================== */}
      <aside
        style={{
          width: '240px',
          flexShrink: 0,
          backgroundColor: '#071a14',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 40,
        }}
      >
        <div>
          {/* Brand Header */}
          <div
            style={{
              padding: '24px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#0f3d30',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
              }}
            >
              <MessageSquare size={20} color="#34d399" />
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                SupportRoute
              </div>
              <div style={{ fontSize: '0.70rem', color: '#6ee7b7', fontWeight: 500 }}>
                AI Ticket Router
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Home },
              { id: 'single', label: 'Analyze Ticket', icon: MessageSquare },
              { id: 'batch', label: 'Batch Analysis', icon: FileText },
              { id: 'analytics', label: 'Analytics', icon: BarChart2 },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isActive ? '#0f3d30' : 'transparent',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Icon size={18} color={isActive ? '#34d399' : '#94a3b8'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Help Box matching screenshot */}
        <div style={{ padding: '16px 14px' }}>
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: '#0c251e',
              border: '1px solid #143e33',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Headphones size={20} color="#34d399" />
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
              Need help?
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.4, marginBottom: '12px' }}>
              Check documentation, workflow guides, and API endpoints.
            </div>
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '6px',
                backgroundColor: '#0f3d30',
                border: '1px solid #1b5244',
                color: '#34d399',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#144e3d')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0f3d30')}
            >
              <span>View Help</span>
              <ArrowRight size={13} color="#34d399" />
            </button>
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. MAIN CONTENT AREA (Header + View Body)                */}
      {/* ======================================================== */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top White Header Bar */}
        <header
          style={{
            height: '64px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            padding: '0 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          {/* Header Left Title / Section Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.90rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
              {activeNav === 'single'
                ? 'Single Ticket Classification'
                : activeNav === 'batch'
                ? 'Batch Evaluation Workstation'
                : activeNav === 'analytics'
                ? 'Routing Analytics & Metrics'
                : activeNav === 'settings'
                ? 'System Settings & Thresholds'
                : 'Customer Support Router'}
            </span>
          </div>

          {/* Right Header Utilities: Date, Notification, Avatar (Jev Connected removed) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Date Range Pill */}
            <div style={{ position: 'relative' }} ref={headerDateDropdownRef}>
              <button
                type="button"
                onClick={() => setShowHeaderDateDropdown((prev) => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  backgroundColor: showHeaderDateDropdown ? '#f8fafc' : '#ffffff',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.78rem',
                  color: '#475569',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.15s ease',
                }}
                title="Filter by time range"
              >
                <Calendar size={14} color="#059669" />
                <span>{getTimeRangeLabel(timeFilter)}</span>
                <ChevronDown
                  size={14}
                  color="#94a3b8"
                  style={{
                    transform: showHeaderDateDropdown ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.15s ease',
                  }}
                />
              </button>

              {showHeaderDateDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    width: '210px',
                    backgroundColor: '#ffffff',
                    borderRadius: '10px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #e2e8f0',
                    padding: '6px',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  {TIME_FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setTimeFilter(opt.id);
                        setShowHeaderDateDropdown(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: timeFilter === opt.id ? '#ecfdf5' : 'transparent',
                        color: timeFilter === opt.id ? '#065f46' : '#334155',
                        fontSize: '0.80rem',
                        fontWeight: timeFilter === opt.id ? 600 : 400,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color 0.12s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (timeFilter !== opt.id) e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        if (timeFilter !== opt.id) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{opt.label}</span>
                        <span style={{ fontSize: '0.70rem', color: timeFilter === opt.id ? '#059669' : '#94a3b8' }}>
                          {opt.subtext}
                        </span>
                      </div>
                      {timeFilter === opt.id && <Check size={14} color="#059669" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={18} />
            </button>

            {/* Payal User Profile Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#0d9488',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                }}
              >
                P
              </div>
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' }}>Payal</span>
              <ChevronDown size={14} color="#94a3b8" />
            </div>
          </div>
        </header>

        {/* Canvas Container */}
        <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Top Heading Area (Dashboard name removed on dashboard) */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              {activeNav !== 'dashboard' && (
                <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', margin: '0 0 4px 0' }}>
                  {activeNav === 'single'
                    ? 'Analyze Ticket'
                    : activeNav === 'batch'
                    ? 'Batch Processing'
                    : activeNav === 'analytics'
                    ? 'Analytics & Routing Metrics'
                    : activeNav === 'settings'
                    ? 'System Settings'
                    : ''}
                </h1>
              )}
              <p style={{ fontSize: '0.90rem', color: '#64748b', margin: 0 }}>
                {activeNav === 'analytics'
                  ? 'Real-time performance metrics, intent classification, and queue distribution'
                  : activeNav === 'settings'
                  ? 'Manage confidence thresholds, routing policies, and Jev engine parameters'
                  : 'Overview of your customer support ticket routing'}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Threshold Slider Control */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.78rem',
                  color: '#64748b',
                }}
                title="Confidence threshold: tickets below this trigger manual review."
              >
                <Sliders size={13} color="#64748b" />
                <span>Threshold: <strong style={{ color: '#0f172a' }}>{Math.round(threshold * 100)}%</strong></span>
                <input
                  type="range"
                  min={50}
                  max={95}
                  step={5}
                  value={Math.round(threshold * 100)}
                  onChange={(e) => setThreshold(Number(e.target.value) / 100)}
                  style={{ width: '60px', accentColor: '#059669', cursor: 'pointer' }}
                />
              </div>

              {/* Time Filter Pill */}
              <div style={{ position: 'relative' }} ref={timeDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowTimeDropdown((prev) => !prev)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    backgroundColor: showTimeDropdown ? '#f8fafc' : '#ffffff',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.80rem',
                    fontWeight: 500,
                    color: '#334155',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.15s ease',
                  }}
                  title="Filter tickets by time range"
                >
                  <Calendar size={14} color="#059669" />
                  <span>{timeFilter}</span>
                  <ChevronDown
                    size={14}
                    color="#94a3b8"
                    style={{
                      transform: showTimeDropdown ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.15s ease',
                    }}
                  />
                </button>

                {showTimeDropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      right: 0,
                      width: '210px',
                      backgroundColor: '#ffffff',
                      borderRadius: '10px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                      border: '1px solid #e2e8f0',
                      padding: '6px',
                      zIndex: 100,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    {TIME_FILTER_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setTimeFilter(opt.id);
                          setShowTimeDropdown(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: timeFilter === opt.id ? '#ecfdf5' : 'transparent',
                          color: timeFilter === opt.id ? '#065f46' : '#334155',
                          fontSize: '0.80rem',
                          fontWeight: timeFilter === opt.id ? 600 : 400,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background-color 0.12s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (timeFilter !== opt.id) e.currentTarget.style.backgroundColor = '#f8fafc';
                        }}
                        onMouseLeave={(e) => {
                          if (timeFilter !== opt.id) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>{opt.label}</span>
                          <span style={{ fontSize: '0.70rem', color: timeFilter === opt.id ? '#059669' : '#94a3b8' }}>
                            {opt.subtext}
                          </span>
                        </div>
                        {timeFilter === opt.id && <Check size={14} color="#059669" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* VIEW: SETTINGS                                           */}
          {/* ======================================================== */}
          {activeNav === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {settingsSaved && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    color: '#065f46',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <CheckCircle2 size={16} color="#059669" />
                  <span>Configuration saved successfully. All routing thresholds updated.</span>
                </div>
              )}

              {/* Settings Card 1: Routing Engine & Thresholds */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                }}
              >
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
                  Routing Engine & Thresholds
                </h2>
                <p style={{ fontSize: '0.80rem', color: '#64748b', margin: '0 0 20px 0' }}>
                  Configure automated decision thresholds and escalation parameters for incoming tickets.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* Threshold Setting */}
                  <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#0f172a' }}>
                          Confidence Cutoff Threshold ({Math.round(threshold * 100)}%)
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                          Tickets below this confidence level trigger a manual triage review before routing.
                        </div>
                      </div>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669' }}>
                        {Math.round(threshold * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={95}
                      step={5}
                      value={Math.round(threshold * 100)}
                      onChange={(e) => setThreshold(Number(e.target.value) / 100)}
                      style={{ width: '100%', accentColor: '#059669', cursor: 'pointer' }}
                    />
                  </div>

                  {/* Auto Escalate Checkbox */}
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={autoEscalate}
                      onChange={(e) => setAutoEscalate(e.target.checked)}
                      style={{ marginTop: '3px', accentColor: '#059669' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' }}>
                        Auto-flag Low Confidence Inferences
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                        Automatically tag tickets with &quot;Review&quot; status when confidence is below cutoff.
                      </div>
                    </div>
                  </label>

                  {/* Fallback Department */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                      Default Fallback Department
                    </label>
                    <select
                      value={defaultDepartment}
                      onChange={(e) => setDefaultDepartment(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        fontSize: '0.82rem',
                        color: '#0f172a',
                        outline: 'none',
                        width: '280px',
                      }}
                    >
                      <option value="General Support">General Support</option>
                      <option value="Billing Support">Billing Support</option>
                      <option value="Technical Support">Technical Support</option>
                      <option value="Product Support">Product Support</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Settings Card 2: Model & Service Status */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                }}
              >
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
                  Model & Reasoning Engine
                </h2>
                <p style={{ fontSize: '0.80rem', color: '#64748b', margin: '0 0 16px 0' }}>
                  Active TypeSafe Jev System One reasoning service status and connection parameters.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
                  <div style={{ padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '3px' }}>Model Version</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>TypeSafe Jev v1.2</div>
                  </div>
                  <div style={{ padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '3px' }}>Connection</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#059669' }}>Active &amp; Configured</div>
                  </div>
                  <div style={{ padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '3px' }}>Current Queue</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0284c7' }}>{totalAnalyzed} Tickets Loaded</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await fetch('/api/tickets', { method: 'DELETE' });
                      } catch (e) {
                        console.error(e);
                      }
                      setTicketsList([]);
                      setSettingsSaved(true);
                      setTimeout(() => setSettingsSaved(false), 2500);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      color: '#dc2626',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={14} color="#dc2626" /> Clear Ticket History
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 20px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#059669',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Save size={14} /> Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: ANALYTICS                                          */}
          {/* ======================================================== */}
          {activeNav === 'analytics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Analytics Top 4 Overview Cards (All strictly computed from real data) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px' }}>
                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '18px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 500, marginBottom: '4px' }}>Total In Queue</div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>{totalAnalyzed}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>Active support tickets</div>
                </div>
                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '18px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 500, marginBottom: '4px' }}>Auto-Route Rate</div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
                    {totalAnalyzed > 0 ? Math.round((autoRoutedCount / totalAnalyzed) * 100) : 0}%
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '4px' }}>{autoRoutedCount} of {totalAnalyzed} automated</div>
                </div>
                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '18px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 500, marginBottom: '4px' }}>Manual Review Rate</div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
                    {totalAnalyzed > 0 ? Math.round((reviewCount / totalAnalyzed) * 100) : 0}%
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#d97706', marginTop: '4px' }}>{reviewCount} below {Math.round(threshold * 100)}% threshold</div>
                </div>
                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '18px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 500, marginBottom: '4px' }}>Average Confidence</div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>{avgConfidence}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>Computed across active queue</div>
                </div>
              </div>

              {/* 3 Detailed Charts */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
                {/* Intent Distribution */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <PieChart size={16} color="#0284c7" />
                      <h3 style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Intent Distribution</h3>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{totalAnalyzed} tickets</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {categoryDistribution.slice(0, 5).map((item, idx) => (
                      <div key={idx}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '4px' }}>
                          <span style={{ color: '#334155', fontWeight: 500 }}>{item.category}</span>
                          <span style={{ color: '#0f172a', fontWeight: 700 }}>{item.percentage}% ({item.count})</span>
                        </div>
                        <div style={{ height: '6px', width: '100%', borderRadius: '3px', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${item.percentage}%`, backgroundColor: item.color, borderRadius: '3px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Priority Breakdown */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BarChart3 size={16} color="#ea580c" />
                      <h3 style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Priority Breakdown</h3>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Active Queue</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {[
                      { label: 'High Priority', count: priorityBreakdown.High, color: '#ef4444' },
                      { label: 'Medium Priority', count: priorityBreakdown.Medium, color: '#f59e0b' },
                      { label: 'Low Priority', count: priorityBreakdown.Low, color: '#0284c7' },
                    ].map((item, idx) => {
                      const pct = totalAnalyzed > 0 ? ((item.count / totalAnalyzed) * 100).toFixed(1) : '0.0';
                      return (
                        <div key={idx}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '4px' }}>
                            <span style={{ color: '#334155', fontWeight: 500 }}>{item.label}</span>
                            <span style={{ color: '#0f172a', fontWeight: 700 }}>{pct}% ({item.count})</span>
                          </div>
                          <div style={{ height: '6px', width: '100%', borderRadius: '3px', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, backgroundColor: item.color, borderRadius: '3px' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Department Routing Volume */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Activity size={16} color="#059669" />
                      <h3 style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Department Allocation</h3>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Top Teams</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {departmentDistribution.slice(0, 5).map((item, idx) => (
                      <div key={idx}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '4px' }}>
                          <span style={{ color: '#334155', fontWeight: 500 }}>{item.department}</span>
                          <span style={{ color: '#0f172a', fontWeight: 700 }}>{item.count} tickets</span>
                        </div>
                        <div style={{ height: '6px', width: '100%', borderRadius: '3px', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${item.percentage}%`, backgroundColor: '#059669', borderRadius: '3px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: DASHBOARD & TICKETS & BATCH (Standard Views)       */}
          {/* ======================================================== */}
          {(activeNav === 'dashboard' || activeNav === 'single' || activeNav === 'batch') && (
            <>
              {/* ROW 1: 4 KPI METRIC CARDS (Exact match to screenshot) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                  gap: '18px',
                }}
              >
                {/* KPI 1: Tickets Analyzed */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        backgroundColor: '#dcfce7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MessageSquare size={20} color="#16a34a" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.80rem', color: '#64748b', fontWeight: 500 }}>
                        Tickets Analyzed
                      </div>
                      <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                        {totalAnalyzed}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                    Active tickets in session
                  </div>
                </div>

                {/* KPI 2: Avg. Confidence */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        backgroundColor: '#dbeafe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Target size={20} color="#2563eb" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.80rem', color: '#64748b', fontWeight: 500 }}>
                        Avg. Confidence
                      </div>
                      <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                        {avgConfidence}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                    Cutoff threshold: {Math.round(threshold * 100)}%
                  </div>
                </div>

                {/* KPI 3: Auto-Routed */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        backgroundColor: '#ecfdf5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ShieldCheck size={20} color="#059669" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.80rem', color: '#64748b', fontWeight: 500 }}>
                        Auto-Routed
                      </div>
                      <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                        {autoRoutedCount}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                    {totalAnalyzed > 0 ? Math.round((autoRoutedCount / totalAnalyzed) * 100) : 0}% automated routing
                  </div>
                </div>

                {/* KPI 4: Manual Review */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        backgroundColor: '#fffbeb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <AlertTriangle size={20} color="#d97706" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.80rem', color: '#64748b', fontWeight: 500 }}>
                        Manual Review
                      </div>
                      <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                        {reviewCount}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                    {totalAnalyzed > 0 ? Math.round((reviewCount / totalAnalyzed) * 100) : 0}% flagged for triage
                  </div>
                </div>
              </div>

              {/* SINGLE TICKET WORKSTATION (Shown when on Analyze Ticket or when user classifies) */}
              {(activeNav === 'single' || singleResult) && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr',
                    gap: '20px',
                  }}
                >
                  {/* Input Card */}
                  <div
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      padding: '24px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div>
                        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0' }}>
                          Analyze Customer Message
                        </h2>
                        <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                          Type a customer inquiry or click to select from production samples.
                        </p>
                      </div>
                    </div>

                    <div ref={inputContainerRef} style={{ position: 'relative', marginBottom: '14px' }}>
                      <textarea
                        rows={4}
                        value={ticketInput}
                        onChange={(e) => setTicketInput(e.target.value)}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder="Enter customer inquiry or click to select from sample tickets..."
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '8px',
                          backgroundColor: '#f8fafc',
                          border: showSuggestions ? '1px solid #059669' : '1px solid #e2e8f0',
                          color: '#0f172a',
                          fontSize: '0.84rem',
                          fontFamily: 'inherit',
                          lineHeight: 1.5,
                          resize: 'vertical',
                          outline: 'none',
                        }}
                      />

                      {/* Suggestion Dropdown Cards */}
                      {showSuggestions && (
                        <div
                          style={{
                            marginTop: '8px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            padding: '12px',
                            maxHeight: '260px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#475569' }}>
                              Select from 21 Production Samples:
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowSuggestions(false)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#94a3b8',
                                fontSize: '0.74rem',
                                cursor: 'pointer',
                              }}
                            >
                              ✕ Close
                            </button>
                          </div>

                          {/* Filter Pills */}
                          <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', paddingBottom: '2px' }}>
                            {CATEGORY_FILTERS.map((cat) => (
                              <button
                                key={cat}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCategoryFilter(cat);
                                }}
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid',
                                  borderColor: selectedCategoryFilter === cat ? '#059669' : '#e2e8f0',
                                  backgroundColor: selectedCategoryFilter === cat ? '#ecfdf5' : '#f8fafc',
                                  color: selectedCategoryFilter === cat ? '#047857' : '#64748b',
                                  fontSize: '0.68rem',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>

                          {/* Suggestions list */}
                          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px' }}>
                            {filteredSuggestions.map((item, idx) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  setTicketInput(item.text);
                                  setShowSuggestions(false);
                                  setSingleError(null);
                                }}
                                style={{
                                  padding: '8px 10px',
                                  borderRadius: '6px',
                                  backgroundColor: '#f8fafc',
                                  border: '1px solid #e2e8f0',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '2px',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                              >
                                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#0284c7' }}>
                                  {item.tag}
                                </span>
                                <p style={{ margin: 0, fontSize: '0.78rem', color: '#334155', lineHeight: 1.4 }}>
                                  {item.text}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {singleError && (
                      <div style={{ marginBottom: '12px', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', fontSize: '0.78rem' }}>
                        {singleError}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setTicketInput('');
                          setSingleResult(null);
                          setSingleError(null);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <RotateCcw size={13} /> Clear
                      </button>

                      <button
                        type="button"
                        onClick={handleAnalyzeSingle}
                        disabled={isAnalyzing}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 18px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: '#059669',
                          color: '#ffffff',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 size={14} className="animate-spin-fast" />
                            <span>Classifying...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} />
                            <span>Analyze Ticket</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Result Card */}
                  <div
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      padding: '24px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    }}
                  >
                    {!singleResult ? (
                      <div style={{ height: '100%', minHeight: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', textAlign: 'center', fontSize: '0.80rem' }}>
                        <MessageSquare size={24} color="#cbd5e1" style={{ marginBottom: '8px' }} />
                        <div>Awaiting ticket submission</div>
                        <div style={{ fontSize: '0.74rem', marginTop: '4px' }}>Click a sample or type above to see routing.</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <h3 style={{ fontSize: '1.0rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                          Classification Output
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                          <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Category Intent</div>
                            {renderIntentBadge(singleResult.category)}
                          </div>

                          <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Priority Level</div>
                            {renderPriorityPill(singleResult.priority)}
                          </div>

                          <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Routed Team</div>
                            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' }}>{singleResult.department}</div>
                          </div>

                          <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Confidence</div>
                            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#059669' }}>{singleResult.category_probability}</div>
                          </div>
                        </div>

                        <div style={{ padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>Action Guidance</div>
                          <div style={{ fontSize: '0.78rem', color: '#334155', lineHeight: 1.4 }}>{singleResult.recommended_action}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* BATCH EVALUATION WORKSTATION (Shown when on Batch Processing) */}
              {activeNav === 'batch' && (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
                        Batch Evaluation Workstation
                      </h2>
                      <p style={{ fontSize: '0.80rem', color: '#64748b', margin: 0 }}>
                        Run automated evaluations against the evaluation dataset or upload your own CSV file.
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={handleRunSampleBatch}
                        disabled={isBatchAnalyzing}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          backgroundColor: '#059669',
                          border: 'none',
                          color: '#ffffff',
                          fontSize: '0.80rem',
                          fontWeight: 600,
                          cursor: isBatchAnalyzing ? 'not-allowed' : 'pointer',
                          boxShadow: '0 1px 2px rgba(5, 150, 105, 0.2)',
                        }}
                      >
                        {isBatchAnalyzing ? <Loader2 size={14} className="animate-spin-fast" /> : <Play size={14} color="#ffffff" />}
                        <span>{isBatchAnalyzing ? 'Evaluating...' : 'Run 15 Evaluation'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isBatchAnalyzing}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          color: '#334155',
                          fontSize: '0.80rem',
                          fontWeight: 600,
                          cursor: isBatchAnalyzing ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <UploadCloud size={14} color="#64748b" />
                        <span>Upload CSV</span>
                      </button>
                    </div>
                  </div>

                  {batchError && (
                    <div style={{ padding: '10px 14px', borderRadius: '6px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', fontSize: '0.80rem' }}>
                      {batchError}
                    </div>
                  )}
                </div>
              )}

              {/* RECENT TICKETS TABLE (Matches reference screenshot) */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                  overflow: 'hidden',
                }}
              >
                {/* Table Header Controls */}
                <div
                  style={{
                    padding: '18px 24px',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <List size={18} color="#0f172a" />
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                      Recent Tickets
                    </h2>
                    {ticketsList.length > 0 && (
                      <span
                        style={{
                          fontSize: '0.74rem',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          backgroundColor: '#f1f5f9',
                          color: '#475569',
                          fontWeight: 600,
                        }}
                      >
                        {ticketsList.length} tickets
                      </span>
                    )}
                  </div>

                  {/* Table Controls on Right: Filter, Batch, Upload, Export */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

                    {/* Filter Dropdown */}
                    <div style={{ position: 'relative' }}>
                      <select
                        value={tablePriorityFilter}
                        onChange={(e) => {
                          setTablePriorityFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        style={{
                          appearance: 'none',
                          padding: '7px 28px 7px 12px',
                          borderRadius: '6px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          color: '#334155',
                          fontSize: '0.78rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          outline: 'none',
                        }}
                      >
                        <option value="All">Filter Priority</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                      <Filter
                        size={12}
                        color="#64748b"
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                      />
                    </div>

                    {/* Hidden File Input for CSV Upload */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleUploadBatch}
                      accept=".csv"
                      style={{ display: 'none' }}
                    />

                    {/* Batch Evaluation & Upload Buttons - ONLY present in batch analysis */}
                    {activeNav === 'batch' && (
                      <>
                        <button
                          type="button"
                          onClick={handleRunSampleBatch}
                          disabled={isBatchAnalyzing}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '7px 12px',
                            borderRadius: '6px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            color: '#334155',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: isBatchAnalyzing ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {isBatchAnalyzing ? <Loader2 size={13} className="animate-spin-fast" /> : <Play size={13} color="#059669" />}
                          <span>Run 15 Evaluation</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '7px 12px',
                            borderRadius: '6px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            color: '#334155',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <UploadCloud size={13} color="#64748b" />
                          <span>Upload CSV</span>
                        </button>
                      </>
                    )}

                    {/* Export Button matching screenshot */}
                    <button
                      type="button"
                      onClick={handleDownloadCSV}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 14px',
                        borderRadius: '6px',
                        backgroundColor: '#047857',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 1px 2px rgba(4, 120, 87, 0.2)',
                      }}
                    >
                      <Download size={13} color="#ffffff" />
                      <span>Export</span>
                    </button>
                  </div>
                </div>

                {/* Error in Batch */}
                {batchError && (
                  <div style={{ margin: '12px 24px', padding: '10px 14px', borderRadius: '6px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', fontSize: '0.78rem' }}>
                    {batchError}
                  </div>
                )}

                {/* Table Content */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.80rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
                        <th style={{ padding: '12px 20px', color: '#64748b', fontWeight: 600, fontSize: '0.74rem' }}>Ticket ID</th>
                        <th style={{ padding: '12px 20px', color: '#64748b', fontWeight: 600, fontSize: '0.74rem' }}>Customer Message</th>
                        <th style={{ padding: '12px 20px', color: '#64748b', fontWeight: 600, fontSize: '0.74rem' }}>Intent</th>
                        <th style={{ padding: '12px 20px', color: '#64748b', fontWeight: 600, fontSize: '0.74rem' }}>Priority</th>
                        <th style={{ padding: '12px 20px', color: '#64748b', fontWeight: 600, fontSize: '0.74rem' }}>Confidence</th>
                        <th style={{ padding: '12px 20px', color: '#64748b', fontWeight: 600, fontSize: '0.74rem' }}>Routed Team</th>
                        <th style={{ padding: '12px 20px', color: '#64748b', fontWeight: 600, fontSize: '0.74rem' }}>Status</th>
                        <th style={{ padding: '12px 20px', color: '#64748b', fontWeight: 600, fontSize: '0.74rem' }}>Created At</th>
                        <th style={{ padding: '12px 20px', color: '#64748b', fontWeight: 600, fontSize: '0.74rem', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ticketsList.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ padding: '48px 24px', textAlign: 'center' }}>
                            <div style={{ maxWidth: '440px', margin: '0 auto' }}>
                              <div
                                style={{
                                  width: '46px',
                                  height: '46px',
                                  borderRadius: '50%',
                                  backgroundColor: '#f1f5f9',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  margin: '0 auto 12px auto',
                                }}
                              >
                                <Inbox size={22} color="#64748b" />
                              </div>
                              <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
                                No tickets analyzed yet
                              </h3>
                              <p style={{ fontSize: '0.80rem', color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                                All metrics update dynamically from real TypeSafe Jev routing decisions. Run an evaluation batch or analyze a ticket to view real data.
                              </p>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                <button
                                  type="button"
                                  onClick={handleRunSampleBatch}
                                  disabled={isBatchAnalyzing}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    backgroundColor: '#059669',
                                    color: '#ffffff',
                                    border: 'none',
                                    fontSize: '0.80rem',
                                    fontWeight: 600,
                                    cursor: isBatchAnalyzing ? 'not-allowed' : 'pointer',
                                  }}
                                >
                                  {isBatchAnalyzing ? <Loader2 size={13} className="animate-spin-fast" /> : <Play size={13} />}
                                  <span>Run 15 Evaluation Tickets</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveNav('single')}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 14px',
                                    borderRadius: '6px',
                                    backgroundColor: '#ffffff',
                                    color: '#334155',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '0.80rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <FileText size={13} color="#64748b" />
                                  <span>Analyze Ticket</span>
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : paginatedTickets.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ padding: '36px 20px', textAlign: 'center' }}>
                            <div style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '8px' }}>
                              No tickets found for the selected filter ({timeFilter}
                              {tablePriorityFilter !== 'All' ? `, ${tablePriorityFilter} priority` : ''}).
                            </div>
                            {(tablePriorityFilter !== 'All' || timeFilter !== 'All Time') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setTablePriorityFilter('All');
                                  setTimeFilter('All Time');
                                  setCurrentPage(1);
                                }}
                                style={{
                                  padding: '5px 12px',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  backgroundColor: '#ffffff',
                                  color: '#059669',
                                  fontSize: '0.76rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Clear All Filters
                              </button>
                            )}
                          </td>
                        </tr>
                      ) : (
                        paginatedTickets.map((row, index) => (
                          <tr
                            key={index}
                            style={{
                              borderBottom: '1px solid #f8fafc',
                              transition: 'background-color 0.12s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            {/* Ticket ID */}
                            <td style={{ padding: '12px 20px', whiteSpace: 'nowrap', fontWeight: 500, color: '#334155' }}>
                              {row.ticket_id}
                            </td>

                            {/* Customer Message */}
                            <td style={{ padding: '12px 20px', maxWidth: '280px' }}>
                              <div
                                style={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  color: '#1e293b',
                                }}
                                title={row.ticket}
                              >
                                {row.ticket}
                              </div>
                            </td>

                            {/* Intent */}
                            <td style={{ padding: '12px 20px', whiteSpace: 'nowrap' }}>
                              {renderIntentBadge(row.category)}
                            </td>

                            {/* Priority */}
                            <td style={{ padding: '12px 20px', whiteSpace: 'nowrap' }}>
                              {renderPriorityPill(row.priority)}
                            </td>

                            {/* Confidence */}
                            <td style={{ padding: '12px 20px', whiteSpace: 'nowrap', color: '#334155', fontWeight: 500 }}>
                              {row.confidence}
                            </td>

                            {/* Routed Team */}
                            <td style={{ padding: '12px 20px', whiteSpace: 'nowrap', color: '#334155' }}>
                              {row.department}
                            </td>

                            {/* Status */}
                            <td style={{ padding: '12px 20px', whiteSpace: 'nowrap' }}>
                              {renderStatus(row.status)}
                            </td>

                            {/* Created At */}
                            <td style={{ padding: '12px 20px', whiteSpace: 'nowrap', color: '#64748b' }}>
                              {row.created_at}
                            </td>

                            {/* Actions */}
                            <td
                              data-action-cell="true"
                              style={{
                                padding: '12px 20px',
                                whiteSpace: 'nowrap',
                                textAlign: 'center',
                                position: 'relative',
                              }}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenActionRowId(openActionRowId === row.ticket_id ? null : row.ticket_id);
                                }}
                                title="Ticket actions"
                                style={{
                                  background: openActionRowId === row.ticket_id ? '#f1f5f9' : 'none',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  color: openActionRowId === row.ticket_id ? '#0f172a' : '#94a3b8',
                                  padding: '4px 6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                                onMouseLeave={(e) => {
                                  if (openActionRowId !== row.ticket_id) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }
                                }}
                              >
                                <MoreVertical size={16} />
                              </button>

                              {/* Action Menu Dropdown */}
                              {openActionRowId === row.ticket_id && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    ...(index >= paginatedTickets.length - 2 && paginatedTickets.length > 2
                                      ? { bottom: 'calc(100% - 4px)' }
                                      : { top: 'calc(100% - 4px)' }),
                                    right: '12px',
                                    backgroundColor: '#ffffff',
                                    borderRadius: '10px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                                    padding: '6px',
                                    zIndex: 50,
                                    width: '185px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '2px',
                                    textAlign: 'left',
                                  }}
                                >
                                  {/* View Details */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedTicketDetail(row);
                                      setOpenActionRowId(null);
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      padding: '8px 10px',
                                      borderRadius: '6px',
                                      border: 'none',
                                      backgroundColor: 'transparent',
                                      color: '#334155',
                                      fontSize: '0.78rem',
                                      fontWeight: 500,
                                      cursor: 'pointer',
                                      width: '100%',
                                      textAlign: 'left',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                  >
                                    <FileText size={14} color="#059669" />
                                    <span>View Details</span>
                                  </button>

                                  {/* Analyze in Single Workstation */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTicketInput(row.ticket);
                                      setActiveNav('single');
                                      setOpenActionRowId(null);
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      padding: '8px 10px',
                                      borderRadius: '6px',
                                      border: 'none',
                                      backgroundColor: 'transparent',
                                      color: '#334155',
                                      fontSize: '0.78rem',
                                      fontWeight: 500,
                                      cursor: 'pointer',
                                      width: '100%',
                                      textAlign: 'left',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                  >
                                    <Sparkles size={14} color="#6366f1" />
                                    <span>Open in Analyzer</span>
                                  </button>

                                  {/* Toggle Status (Routed / Review) */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextStatus = row.status === 'Review' ? 'Routed' : 'Review';
                                      setTicketsList((prev) =>
                                        prev.map((t) => (t.ticket_id === row.ticket_id ? { ...t, status: nextStatus } : t))
                                      );
                                      showToast(`Ticket status updated to ${nextStatus}`);
                                      setOpenActionRowId(null);
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      padding: '8px 10px',
                                      borderRadius: '6px',
                                      border: 'none',
                                      backgroundColor: 'transparent',
                                      color: '#334155',
                                      fontSize: '0.78rem',
                                      fontWeight: 500,
                                      cursor: 'pointer',
                                      width: '100%',
                                      textAlign: 'left',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                  >
                                    {row.status === 'Review' ? (
                                      <>
                                        <CheckCircle2 size={14} color="#059669" />
                                        <span>Approve &amp; Route</span>
                                      </>
                                    ) : (
                                      <>
                                        <AlertTriangle size={14} color="#d97706" />
                                        <span>Flag for Review</span>
                                      </>
                                    )}
                                  </button>

                                  {/* Copy Message */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (navigator.clipboard) {
                                        navigator.clipboard.writeText(row.ticket);
                                        showToast('Ticket message copied to clipboard');
                                      }
                                      setOpenActionRowId(null);
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      padding: '8px 10px',
                                      borderRadius: '6px',
                                      border: 'none',
                                      backgroundColor: 'transparent',
                                      color: '#334155',
                                      fontSize: '0.78rem',
                                      fontWeight: 500,
                                      cursor: 'pointer',
                                      width: '100%',
                                      textAlign: 'left',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                  >
                                    <Copy size={14} color="#64748b" />
                                    <span>Copy Message</span>
                                  </button>

                                  <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '3px 0' }} />

                                  {/* Delete Ticket */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTicketsList((prev) => prev.filter((t) => t.ticket_id !== row.ticket_id));
                                      showToast(`Deleted ${row.ticket_id}`);
                                      setOpenActionRowId(null);
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      padding: '8px 10px',
                                      borderRadius: '6px',
                                      border: 'none',
                                      backgroundColor: 'transparent',
                                      color: '#dc2626',
                                      fontSize: '0.78rem',
                                      fontWeight: 500,
                                      cursor: 'pointer',
                                      width: '100%',
                                      textAlign: 'left',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                  >
                                    <Trash2 size={14} color="#dc2626" />
                                    <span>Delete Ticket</span>
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer: Pagination controls */}
                <div
                  style={{
                    padding: '14px 24px',
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.78rem',
                    color: '#64748b',
                  }}
                >
                  <div>
                    Showing {totalEntries === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1} to{' '}
                    {Math.min(currentPage * entriesPerPage, totalEntries)} of {totalEntries} entries
                  </div>

                  {/* Page Buttons matching screenshot */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#ffffff',
                        color: currentPage === 1 ? '#cbd5e1' : '#64748b',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ChevronLeft size={14} />
                    </button>

                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      const isCurrent = currentPage === pageNum;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            border: isCurrent ? '1px solid #0f3d30' : '1px solid #e2e8f0',
                            backgroundColor: isCurrent ? '#071a14' : '#ffffff',
                            color: isCurrent ? '#ffffff' : '#475569',
                            fontWeight: isCurrent ? 700 : 500,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#ffffff',
                        color: currentPage === totalPages ? '#cbd5e1' : '#64748b',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Help & Documentation Modal */}
      {showHelpModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
          onClick={() => setShowHelpModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '620px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0',
              padding: '28px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: '#ecfdf5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Headphones size={22} color="#059669" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                    SupportRoute Help Center
                  </h2>
                  <p style={{ fontSize: '0.80rem', color: '#64748b', margin: '3px 0 0 0' }}>
                    Guide to intelligent routing powered by TypeSafe Jev
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Card 1: Core Workflow */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} color="#059669" />
                  <span>How Routing Works</span>
                </div>
                <p style={{ fontSize: '0.80rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                  Each ticket is analyzed using the TypeSafe Jev System One reasoning model. It predicts customer <strong>Intent</strong>, assigns <strong>Priority</strong>, determines the best <strong>Department</strong>, and produces a calibrated <strong>Confidence Score</strong>.
                </p>
              </div>

              {/* Card 2: Confidence Threshold & Review */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sliders size={16} color="#0284c7" />
                  <span>Threshold Cutoff &amp; Triage</span>
                </div>
                <p style={{ fontSize: '0.80rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                  Tickets scoring at or above your configured threshold (e.g. <strong>70%</strong>) are automatically marked as <span style={{ color: '#059669', fontWeight: 600 }}>● Routed</span>. Inquiries scoring below the threshold are tagged as <span style={{ color: '#d97706', fontWeight: 600 }}>● Review</span> for human agent inspection.
                </p>
              </div>

              {/* Card 3: Batch & Evaluation */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={16} color="#d97706" />
                  <span>Batch Processing &amp; CSV Upload</span>
                </div>
                <p style={{ fontSize: '0.80rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                  Evaluate bulk tickets by clicking <strong>Run 15 Evaluation</strong> on the dashboard or uploading a custom CSV file. All classified tickets persist across the active session and feed into live dashboard metrics.
                </p>
              </div>

              {/* Card 4: Developer APIs */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Cpu size={16} color="#7c3aed" />
                  <span>Developer API Endpoints</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.76rem', color: '#334155', fontFamily: 'monospace' }}>
                  <div><strong style={{ color: '#059669' }}>POST</strong> /api/classify — Single ticket inference</div>
                  <div><strong style={{ color: '#059669' }}>POST</strong> /api/batch-sample — Evaluation dataset batch</div>
                  <div><strong style={{ color: '#059669' }}>POST</strong> /api/batch-upload — Multipart CSV ticket upload</div>
                  <div><strong style={{ color: '#0284c7' }}>GET</strong> /api/tickets — Real session tickets &amp; stats</div>
                  <div><strong style={{ color: '#0284c7' }}>GET</strong> /docs — Interactive Swagger documentation</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <a
                href="/docs"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.80rem',
                  fontWeight: 600,
                  color: '#059669',
                  textDecoration: 'none',
                }}
              >
                <span>Open API Swagger Docs</span>
                <ExternalLink size={13} />
              </a>

              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                style={{
                  padding: '8px 22px',
                  borderRadius: '8px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Details Inspection Modal */}
      {selectedTicketDetail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '20px',
          }}
          onClick={() => setSelectedTicketDetail(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '640px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0',
              padding: '28px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: '#ecfdf5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FileText size={18} color="#059669" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Ticket Details
                    </h2>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '6px' }}>
                      {selectedTicketDetail.ticket_id}
                    </span>
                    {renderStatus(selectedTicketDetail.status)}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                    Logged: {selectedTicketDetail.created_at}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTicketDetail(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: '6px',
                  borderRadius: '6px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Customer Message Card */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                Full Customer Message
              </div>
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#0f172a',
                  fontSize: '0.86rem',
                  lineHeight: 1.6,
                }}
              >
                {selectedTicketDetail.ticket}
              </div>
            </div>

            {/* Jev Reasoning & Classification Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 600 }}>Category Intent</div>
                {renderIntentBadge(selectedTicketDetail.category)}
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 600 }}>Priority</div>
                {renderPriorityPill(selectedTicketDetail.priority)}
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>Routed Department</div>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>{selectedTicketDetail.department || 'General Support'}</div>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>Confidence</div>
                <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#059669' }}>{selectedTicketDetail.confidence || '90%'}</div>
              </div>
            </div>

            {/* Recommended Action Box */}
            {selectedTicketDetail.recommended_action && (
              <div style={{ marginBottom: '24px', padding: '14px 16px', borderRadius: '10px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#065f46', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Automated Action Guidance
                </div>
                <div style={{ fontSize: '0.82rem', color: '#064e3b', lineHeight: 1.5 }}>
                  {selectedTicketDetail.recommended_action}
                </div>
              </div>
            )}

            {/* Modal Footer Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={() => {
                  setTicketInput(selectedTicketDetail.ticket);
                  setActiveNav('single');
                  setSelectedTicketDetail(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.80rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Sparkles size={14} color="#6366f1" />
                <span>Analyze in Workstation</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTicketDetail(null)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.80rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            fontSize: '0.82rem',
            fontWeight: 500,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} color="#34d399" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
