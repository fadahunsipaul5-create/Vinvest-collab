import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import ReactMarkdown from 'react-markdown';
import InsightsGenerators from './InsightsGenerators';
import AIOTPlatformSolutions from './AIOTPlatformSolutions';
import OperationsVirtualization from './OperationsVirtualization';
import Approach from './approach';
import ValuationPage from './ValuationPage';
import ValueBuildupChart from './ValueBuildupChart';
import MultiplesChart from './MultiplesChart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import BoxPlot from './BoxPlot';
import TopPicks from './TopPicks';
import { useChat } from './chatbox';
import { TooltipProps } from 'recharts';
import { AVAILABLE_METRICS } from '../data/availableMetrics';
import { useCompanyData } from '../contexts/CompanyDataContext';
import { useTheme } from '../contexts/ThemeContext';
import ReportGenerationForm from './ReportGenerationForm';
// const BASE_URL = import.meta.env.VITE_API_BASE_URL;
// import {baseUrl} from '../api';
import baseUrl from './api';
console.log("Using baseUrl:", baseUrl);

// Add TypeScript declarations for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}



// Message interface for chat
interface Message {
  role: 'assistant' | 'user';
  content: string;
}

// Add this utility function at the top of the file
function generateColorPalette(count: number): string[] {
  const baseColors = [
    '#1B5A7D', '#4CAF50', '#FFC107', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FF9F43', 
    '#EC3B83', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'
  ];

  const colors = [...baseColors];
  
  // Generate additional colors if needed
  while (colors.length < count) {
    const h = (colors.length * 137.508) % 360; // Use golden angle approximation
    const s = 65 + (colors.length % 3) * 10; // Vary saturation between 65-85%
    const l = 45 + (colors.length % 5) * 5; // Vary lightness between 45-65%
    colors.push(`hsl(${h}, ${s}%, ${l}%)`);
  }

  return colors;
}

// Helper function to add opacity to a color for future data
function addOpacityToColor(hexColor: string, opacity: number = 0.5): string {
  // If the color is in HSL format, extract and modify it
  if (hexColor.startsWith('hsl')) {
    const match = hexColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (match) {
      const [, h, s, l] = match;
      // Increase lightness for future data to make it lighter
      const newL = Math.min(parseInt(l) + 25, 80);
      return `hsl(${h}, ${s}%, ${newL}%)`;
    }
  }
  
  // For hex colors, add opacity as alpha channel
  const opacityHex = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return `${hexColor}${opacityHex}`;
}

// Update the PeriodType to include all available periods
type PeriodType = 'Annual' | 'Average' | 'CAGR' | 
                  'Last 1Y AVG' | 'Last 2Y AVG' | 'Last 3Y AVG' | 
                  'Last 4Y AVG' | 'Last 5Y AVG' | 'Last 10Y AVG' | 'Last 15Y AVG' |
                  '1Y' | '2Y' | '3Y' | '4Y' | '5Y' | '10Y' | '15Y' | '20Y';

// Add interface for peer data
interface PeerDataPoint {
  name: string;
  [key: string]: { [ticker: string]: number } | string; // Allow metric keys to store company values
}

// Update the selectedCompanies state to store ticker objects
interface CompanyTicker {
  ticker: string;
  name: string;
}

// First, add this interface for the chart data
interface ChartDataPoint {
  name: string;
  ticker: string;
  value: number | null;  // Allow null for value
  [key: string]: string | number | null;  // Allow null for dynamic metrics
}

// Update the activeTooltip interface
interface ActiveTooltip {
  x: number;
  y: number;
  payload: {
    [key: string]: any;
  };
  [key: string]: any;  // Add index signature for dynamic metric access
}

interface DataItem {
  name: string;
  value: number;
}

interface TimePoint {
  name: string;
  [key: string]: any;  // Add other properties as needed
}

// Companies will be fetched from API

// Hardcoded industry for presentation - TODO: Remove when database is ready
const HARDCODED_INDUSTRIES = [
  {
    id: 'discount-stores',
    name: 'Discount Stores',
    companies: [
      { ticker: 'COST', name: 'Costco' },
      { ticker: 'WMT', name: 'Walmart Inc.' },
      { ticker: 'BJ', name: "BJ's Wholesale Club" },
      { ticker: 'DG', name: 'Dollar General' },
      { ticker: 'DLTR', name: 'Dollar Tree' },
      { ticker: 'TGT', name: 'Target Corporation' }
    ]
  }
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { modifiedData, resetTrigger } = useCompanyData();
  const { theme, toggleTheme } = useTheme();
  
  // Initialize Stripe
  const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51Rtnsm3OKz7lNN5EIAyB8tRqrJQ2KBPMvLiNh5mjZiKLOqnhezmIzhCSNRk1E0QVVlN1G4RPgbZlTbXOHmmAahvN00ChkAsNey');

  // Add logout function
  const logout = async () => {
    // Save current chat before logging out
    if (messages.length > 1) { // More than just the initial message
      await saveChatBatch(messages);
    }
    
    // Clear chat persistence
    localStorage.removeItem('current_chat_state');
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user_info');
    window.location.href = '/login';
  };

  // Add microphone functionality
  const [isListening, setIsListening] = useState(false);

  // Add save chart functionality
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingConversation, setIsSavingConversation] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportMessages, setReportMessages] = useState<Message[]>([]);
  const [reportFormKey, setReportFormKey] = useState(0); // Key to force reset of ReportGenerationForm
  const [isSavingReport, setIsSavingReport] = useState(false);
  
  // Report Chat History State
  const [reportChatHistory, setReportChatHistory] = useState<any[]>([]);
  const [showReportHistoryDropdown, setShowReportHistoryDropdown] = useState(false);
  const [isLoadingReportHistory, setIsLoadingReportHistory] = useState(false);
  const [currentReportSessionId, setCurrentReportSessionId] = useState<string | null>(null);

  // Add subscription/pricing functionality
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [userSubscription, setUserSubscription] = useState(() => {
    const saved = localStorage.getItem('user_subscription');
    return saved ? JSON.parse(saved) : { plan: 'free', questionsUsed: 0, questionsLimit: 10 };
  });
  
  // Track user registration for 24-hour auto-activation
  const [userRegistrationTime, setUserRegistrationTime] = useState(() => {
    const saved = localStorage.getItem('user_registration_time');
    return saved ? parseInt(saved) : null;
  });
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [showApproachModal, setShowApproachModal] = useState(false);
  const [showWhyUsModal, setShowWhyUsModal] = useState(false);
  const [showValueServicesModal, setShowValueServicesModal] = useState(false);
  const [showValuationModal, setShowValuationModal] = useState(false);
  const [showCapabilitiesDropdown, setShowCapabilitiesDropdown] = useState(false);
  const [isChatbotMinimized, setIsChatbotMinimized] = useState(false);
  const [isPerformanceMinimized, setIsPerformanceMinimized] = useState(false);
  const [showAIOTModal, setShowAIOTModal] = useState(false);
  const [showOperationsModal, setShowOperationsModal] = useState(false);
  const [chatMode, setChatMode] = useState<'insights' | 'report'>('insights');
  const [showChatHistoryDropdown, setShowChatHistoryDropdown] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isLoadingChatHistory, setIsLoadingChatHistory] = useState(false);
  const [currentChatSession, setCurrentChatSession] = useState<any>(null);
  const [hasNewChatContent, setHasNewChatContent] = useState(false); // Track if chat has new content
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [availableSectors, setAvailableSectors] = useState<string[]>([]); // Add state for available sectors
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contactFormRef = useRef<HTMLFormElement>(null);

  // Function to save current chat as a batch
  const saveChatBatch = async (messages: any[], title?: string, forceSave = false) => {
    try {
      const token = localStorage.getItem('access');
      if (!token || messages.length === 0) return;

      // Only save if there's new content or if forced
      if (!hasNewChatContent && !forceSave) {
        console.log('No new content to save, skipping batch save');
        return;
      }

      // Filter out empty or system messages, and add timestamps
      const validMessages = messages.filter(msg => 
        msg.content && msg.content.trim() !== '' && 
        msg.content !== 'I can help you analyze this data. What would you like to know?'
      ).map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date().toISOString()
      }));

      if (validMessages.length === 0) return;

      const response = await fetch(`${baseUrl}/api/chat/batches/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: validMessages,
          title: title || 'New Chat'
        }),
      });

      if (response.ok) {
        console.log('Chat batch saved successfully');
        setHasNewChatContent(false); // Reset flag after successful save
        fetchChatHistory(); // Refresh chat history
      } else {
        console.error('Failed to save chat batch:', response.status);
      }
    } catch (error) {
      console.error('Error saving chat batch:', error);
    }
  };

  const saveReport = async () => {
    setIsSavingReport(true);
    try {
      // Extract all assistant messages (the actual report content)
      const reportContent = reportMessages
        .filter(msg => msg.role === 'assistant' && msg.content && msg.content !== 'Thinking...')
        .map(msg => msg.content)
        .join('\n\n');

      if (!reportContent.trim()) {
        alert('No report content to save.');
        setIsSavingReport(false);
        return;
      }

      // Get company name from user messages if available
      const userMessage = reportMessages.find(msg => msg.role === 'user');
      let reportTitle = 'Investment Report';
      let fileName = 'report';
      if (userMessage) {
        // Extract company name from user message
        const match = userMessage.content.match(/(?:for|about)\s+([^(]+)\s*\(/i);
        if (match) {
          const companyName = match[1].trim();
          reportTitle = `${companyName} - Investment Report`;
          fileName = companyName.replace(/\s+/g, '_');
        }
      }

      // Convert to PDF using jsPDF
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginLeft = 20;
      const marginTop = 20;
      const marginRight = 20;
      const marginBottom = 20;
      const usableWidth = pageWidth - marginLeft - marginRight;
      const lineHeight = 12;
      if ((doc as any).setLineHeightFactor) {
        (doc as any).setLineHeightFactor(1.0);
      }

      let currentY = marginTop;

      const ensureSpace = (requiredHeight: number) => {
        if (currentY + requiredHeight > pageHeight - marginBottom) {
          doc.addPage();
          currentY = marginTop;
        }
      };

      const writeHeading = (text: string, fontSize: number = 20) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fontSize);
        ensureSpace(fontSize + 8);
        doc.text(text, marginLeft, currentY);
        currentY += fontSize + 4;
      };

      // Unused function - removed to fix TypeScript error
      // const writeSubheading = (text: string) => {
      //   doc.setFont('helvetica', 'bold');
      //   doc.setFontSize(14);
      //   ensureSpace(20);
      //   doc.text(text, marginLeft, currentY);
      //   currentY += 10;
      // };

      const writeParagraph = (text: string) => {
        if (!text) return;
        const normalized = text.replace(/\r\n/g, '\n');
        const lines = normalized.split(/\n/);
        
        lines.forEach((line) => {
          const trimmed = line.trim();
          
          if (trimmed.length === 0) {
            currentY += 3;
            return;
          }
          
          // Check if it's a markdown heading
          if (trimmed.startsWith('#')) {
            const level = trimmed.match(/^#+/)?.[0].length || 1;
            const headingText = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '');
            const headingSize = level === 1 ? 18 : level === 2 ? 16 : 14;
            writeHeading(headingText, headingSize);
            return;
          }
          
          // Check if it's a list item
          if (trimmed.match(/^[-*]\s+/) || trimmed.match(/^\d+\.\s+/)) {
            const listText = trimmed.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '');
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            const wrapped = doc.splitTextToSize(`• ${listText}`, usableWidth);
            ensureSpace(wrapped.length * lineHeight);
            wrapped.forEach((wLine: string) => {
              doc.text(wLine, marginLeft + 5, currentY);
              currentY += lineHeight;
            });
            return;
          }
          
          // Process text with inline bold markers
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(11);
          let remainingText = trimmed;
          let xPos = marginLeft;
          
          // Split by bold markers and process
          const parts = remainingText.split(/(\*\*.*?\*\*)/g);
          parts.forEach((part) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              // Bold text
              const boldText = part.replace(/\*\*/g, '');
              doc.setFont('helvetica', 'bold');
              const wrapped = doc.splitTextToSize(boldText, usableWidth - (xPos - marginLeft));
              if (wrapped.length > 0) {
                ensureSpace(wrapped.length * lineHeight);
                wrapped.forEach((wLine: string) => {
                  doc.text(wLine, xPos, currentY);
                  currentY += lineHeight;
                  xPos = marginLeft;
                });
              }
              doc.setFont('helvetica', 'normal');
            } else if (part.trim()) {
              // Regular text
              const wrapped = doc.splitTextToSize(part, usableWidth - (xPos - marginLeft));
              if (wrapped.length > 0) {
                ensureSpace(wrapped.length * lineHeight);
                wrapped.forEach((wLine: string) => {
                  doc.text(wLine, xPos, currentY);
                  currentY += lineHeight;
                  xPos = marginLeft;
                });
              }
            }
          });
          
          currentY += 2; // Small spacing between lines
        });
      };

      // Write report title
      writeHeading(reportTitle, 20);

      // Write timestamp
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      ensureSpace(12);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, marginLeft, currentY);
      currentY += 12;

      // Write report content
      writeParagraph(reportContent);

      // Save the PDF
      const pdfFileName = `${fileName}_report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(pdfFileName);
      
      // Show success message
      alert('Report saved as PDF successfully!');
      
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Failed to save report. Please try again.');
    } finally {
      setIsSavingReport(false);
    }
  };

  const saveConversation = async () => {
    setIsSavingConversation(true);
    try {
      // Create PDF content
      const pdfContent = {
        title: 'AI Conversation Report',
        timestamp: new Date().toLocaleString(),
        messages: messages,
        chartInfo: {
          type: activeChart,
          company: searchValue,
          metrics: activeChart === 'metrics' ? selectedSearchMetrics : 
                  activeChart === 'peers' ? [selectedPeerMetric] : 
                  selectedIndustryMetrics,
          period: selectedPeriod,
          companies: activeChart === 'peers' ? selectedCompanies.map(c => c.name) : []
        }
      };

      // Convert to PDF using jsPDF
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginLeft = 20;
      const marginTop = 20;
      const marginRight = 20;
      const marginBottom = 20;
      const usableWidth = pageWidth - marginLeft - marginRight;
      const lineHeight = 12; // compact line height for fontSize 11
      if ((doc as any).setLineHeightFactor) {
        (doc as any).setLineHeightFactor(1.0);
      }

      const ensureSpace = (requiredHeight: number) => {
        if (currentY + requiredHeight > pageHeight - marginBottom) {
          doc.addPage();
          currentY = marginTop;
        }
      };

      const writeHeading = (text: string) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        ensureSpace(28);
        doc.text(text, marginLeft, currentY);
        currentY += 18;
      };

      const writeSubheading = (text: string) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        ensureSpace(20);
        doc.text(text, marginLeft, currentY);
        currentY += 10;
      };

      const writeKeyValue = (label: string, value: string) => {
        if (!value) return;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        const line = `${label} ${value}`;
        const wrapped = doc.splitTextToSize(line, usableWidth);
        ensureSpace(wrapped.length * lineHeight);
        doc.text(wrapped, marginLeft, currentY);
        currentY += wrapped.length * lineHeight - (lineHeight - 10);
      };

      const writeParagraph = (text: string) => {
        if (!text) return;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        const normalized = text.replace(/\r\n/g, '\n');
        const blocks = normalized.split(/\n\n+/);
        blocks.forEach((block, idx) => {
          const cleaned = block.replace(/```[\s\S]*?```/g, m => m.replace(/```/g, ''));
          const rawLines = cleaned.split(/\n/);
          rawLines.forEach((raw) => {
            const trimmed = raw.trimEnd();
            if (trimmed.length === 0) {
              currentY += 3; // tiny gap for empty line
              return;
            }
            const wrapped = doc.splitTextToSize(trimmed, usableWidth);
            ensureSpace(wrapped.length * lineHeight);
            wrapped.forEach((wLine: string) => {
              doc.text(wLine, marginLeft, currentY);
              currentY += lineHeight;
            });
          });
          if (idx < blocks.length - 1) currentY += 3; // small paragraph gap
        });
      };

      // Compose document
      let currentY = marginTop;
      writeHeading('AI Conversation Report');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      ensureSpace(16);
      doc.text(`Generated on: ${pdfContent.timestamp}`, marginLeft, currentY);
      currentY += 16;

      writeSubheading('Chart Configuration:');
      writeKeyValue('Type:', String(activeChart));
      writeKeyValue('Company:', searchValue || '');
      writeKeyValue('Metrics:', (selectedSearchMetrics || []).join(', '));
      writeKeyValue('Period:', selectedPeriod || '');
      if (activeChart === 'peers' && selectedCompanies.length > 0) {
        writeKeyValue('Companies:', selectedCompanies.map(c => c.name || c.ticker).join(', '));
      }

      writeSubheading('Conversation:');
      messages.forEach((message) => {
        const role = message.role === 'assistant' ? 'AI' : 'User';
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        ensureSpace(lineHeight);
        doc.text(`${role}:`, marginLeft, currentY);
        currentY += 8;
        writeParagraph(message.content);
        currentY += 5; // tighter spacing between messages
      });

      // Save the PDF
      const fileName = `conversation_report_${Date.now()}.pdf`;
      doc.save(fileName);
      
      // Show success message
      alert('Conversation saved as PDF successfully!');
      
    } catch (error) {
      console.error('Error saving conversation:', error);
      alert('Failed to save conversation. Please try again.');
    } finally {
      setIsSavingConversation(false);
    }
  };

  const saveChart = async () => {
    setIsSaving(true);
    try {
      const container = performanceCardRef.current;
      if (!container) throw new Error('Business Performance container not found');

      const cleanup = () => {
        document.body.classList.remove('print-bp-only');
        window.removeEventListener('afterprint', cleanup);
        setIsSaving(false);
      };

      document.body.classList.add('print-bp-only');
      window.addEventListener('afterprint', cleanup);
      window.print();
      setTimeout(() => cleanup(), 8000); // Fallback cleanup

    } catch (error) {
      console.error('Error printing chart:', error);
      alert('Failed to open print dialog.');
      setIsSaving(false);
    }
  };

  // Subscription plans configuration
  const subscriptionPlans = [
    {
      id: 'free',
      name: 'Basic/Free',
      price: '$0',
      period: 'forever',
      questionsLimit: 10,
      features: [
        'Only Across Metrics charts',
        '10 questions per day',
        'Standard support'
      ],
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$29',
      period: 'per month',
      questionsLimit: 50,
      features: [
        'All charts',
        '50 questions per day',
        'Export charts and reports',
        'Priority support'
      ],
      popular: true
    },
    {
      id: 'pro-plus',
      name: 'Pro Plus',
      price: '$59',
      period: 'per month',
      questionsLimit: 9999,
      features: [
        'All charts',
        'Unlimited questions',
        'Upload pdf files to add more context to chat',
        'Export charts and reports',
        'Priority support'
      ],
      popular: false
    }
  ];

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free') {
      // Free plan - just update locally
      const selectedPlan = subscriptionPlans.find(plan => plan.id === planId);
      if (selectedPlan) {
        setUserSubscription({
          plan: planId,
          questionsUsed: 0,
          questionsLimit: selectedPlan.questionsLimit
        });
        localStorage.setItem('user_subscription', JSON.stringify({
          plan: planId,
          questionsUsed: 0,
          questionsLimit: selectedPlan.questionsLimit
        }));
        setShowPricingModal(false);
        alert(`Switched to ${selectedPlan.name} plan!`);
      }
      return;
    }

    // Paid plans - redirect to Stripe checkout
    try {
      const response = await fetch(`${baseUrl}/api/create-checkout-session/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Map frontend id to backend-expected tier without changing UI ids
          tier: planId === 'pro-plus' ? 'pro_plus' : planId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      
      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({
          sessionId
        });
        
        if (error) {
          console.error('Stripe redirect error:', error);
          alert('Error redirecting to checkout. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Error processing upgrade. Please try again.');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearUploadedFiles = () => {
    setUploadedFiles([]);
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Check and handle 24-hour auto-activation
  const check24HourActivation = async () => {
    try {
      const token = localStorage.getItem('access');
      if (!token) return;

      // Check if user registration time is stored
      if (!userRegistrationTime) {
        // First time user - get registration time from backend
        const response = await fetch(`${baseUrl}/account/me/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const userData = await response.json();
          const regTime = new Date(userData.date_joined).getTime();
          setUserRegistrationTime(regTime);
          localStorage.setItem('user_registration_time', regTime.toString());
        }
        return;
      }

      // Check if 24 hours have passed since registration
      const now = Date.now();
      const hoursPassed = (now - userRegistrationTime) / (1000 * 60 * 60);
      
      console.log(`Hours since registration: ${hoursPassed.toFixed(2)}`);

      // If 24 hours have passed and user still doesn't have an active subscription
      // For development: also allow activation if user has been registered for at least 1 minute for testing
      const isDevelopment = import.meta.env.DEV;
      const shouldActivate = (hoursPassed >= 24) || 
        (isDevelopment && hoursPassed >= (1/60)); // 1 minute for development testing
        
      if (shouldActivate && (userSubscription.plan === 'trial' || !userSubscription.plan || userSubscription.questionsLimit === 0)) {
        console.log('24 hours passed, activating free plan...');
        
        // Call backend to activate free plan
        const activationResponse = await fetch(`${baseUrl}/api/activate-free-plan/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (activationResponse.ok) {
          const result = await activationResponse.json();
          console.log('Free plan activated:', result);
          
          // Update local state
          const newSubscription = {
            plan: 'free',
            questionsUsed: 0,
            questionsLimit: 10
          };
          
          setUserSubscription(newSubscription);
          localStorage.setItem('user_subscription', JSON.stringify(newSubscription));
          
          // Show notification to user
          alert('🎉 Great news! Your free plan has been activated. You now have 10 questions per day.');
        } else {
          console.error('Failed to activate free plan:', activationResponse.status);
        }
      }
    } catch (error) {
      console.error('Error checking 24-hour activation:', error);
    }
  };

  const fetchChatHistory = async () => {
    setIsLoadingChatHistory(true);
    try {
      const token = localStorage.getItem('access');
      if (!token) return;

      const response = await fetch(`${baseUrl}/api/sec/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Sample: { "sessions": [{ "session_id": "...", "message_count": 5 }], "total_count": 1 }
        setChatHistory(data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setIsLoadingChatHistory(false);
    }
  };

  const loadChatBatch = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('access');
      if (!token) return;

      const response = await fetch(`${baseUrl}/api/sec/sessions/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Sample: { "session_id": "...", "history": { "messages": [...] }, "message_count": 1 }
        if (data.history && Array.isArray(data.history.messages)) {
          setMessages(data.history.messages);
          setCurrentChatSession(data.session_id);
          setShowChatHistoryDropdown(false);
          setHasNewChatContent(false);
        }
      }
    } catch (error) {
      console.error('Error loading chat session:', error);
    }
  };

  // Report Chat History Functions
  const fetchReportSessions = async () => {
    setIsLoadingReportHistory(true);
    try {
      const token = localStorage.getItem('access');
      if (!token) return;

      const response = await fetch(`${baseUrl}/api/sec/sessions_report`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Sample: { "sessions": [{ "session_id": "...", "message_count": 5 }], "total_count": 1 }
        setReportChatHistory(data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching report sessions:', error);
    } finally {
      setIsLoadingReportHistory(false);
    }
  };

  const loadReportSession = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('access');
      if (!token) return;

      const response = await fetch(`${baseUrl}/api/sec/sessions_report/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Sample: { "session_id": "...", "history": { "messages": [...] } }
        if (data.history && Array.isArray(data.history.messages)) {
          setReportMessages(data.history.messages);
          setCurrentReportSessionId(data.session_id);
          setShowReportHistoryDropdown(false);
        }
      }
    } catch (error) {
      console.error('Error loading report session:', error);
    }
  };

  const deleteReportSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('access');
      if (!token) return;

      const response = await fetch(`${baseUrl}/api/sec/sessions_report/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setReportChatHistory(prev => prev.filter(s => s.session_id !== sessionId));
        if (currentReportSessionId === sessionId) {
          startNewReportChat();
        }
      }
    } catch (error) {
      console.error('Error deleting report session:', error);
    }
  };

  const startNewReportChat = () => {
    setReportMessages([]);
    setCurrentReportSessionId(null);
    setReportFormKey(prev => prev + 1); // Reset form
    setShowReportHistoryDropdown(false);
  };

  // Unused function - removed to fix TypeScript error
  // const deleteChatBatch = async (sessionId: string, e: React.MouseEvent) => {
  //   e.stopPropagation();
  //   try {
  //     const token = localStorage.getItem('access');
  //     if (!token) return;

  //     const response = await fetch(`${baseUrl}/api/sec/sessions/${sessionId}`, {
  //       method: 'DELETE',
  //       headers: { 'Authorization': `Bearer ${token}` }
  //     });

  //     if (response.ok) {
  //       setChatHistory(prev => prev.filter(s => s.session_id !== sessionId));
  //       if (currentChatSession === sessionId) {
  //         startNewChat();
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error deleting chat session:', error);
  //   }
  // };

  // Fetch report history when entering report mode
  useEffect(() => {
    if (chatMode === 'report') {
      fetchReportSessions();
    }
  }, [chatMode]);

  const startNewChat = () => {
    // Reset to initial state
    const initialMessages: Message[] = [
      {
        role: 'assistant' as const,
        content: 'I can help you analyze this data. What would you like to know?'
      }
    ];
    
    setMessages(initialMessages);
    setCurrentChatSession(null);
    setShowChatHistoryDropdown(false);
    setHasNewChatContent(false);
    
    // Clear any uploaded files
    setUploadedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReportGenerate = async (data: {
    reportType: string;
    company: { ticker: string; name: string };
    industryName?: string;
    instructions: string;
  }) => {
    try {
      // Generate session ID if not available
      const sessionId = currentReportSessionId 
        ? currentReportSessionId 
        : `report_${Date.now()}`;
      
      // Update current session ID immediately so subsequent chunks use it
      if (!currentReportSessionId) {
          setCurrentReportSessionId(sessionId);
      }

      // Prepare request payload
      let payload: any = {
        session_id: sessionId,
      };
      
      let endpoint = `${baseUrl}/api/sec/deep_qa_bot_report`;

      // Handle different report types
      if (data.reportType === 'custom_instructions') {
        // Custom Instructions uses a different endpoint and schema
        endpoint = `${baseUrl}/api/sec/deep_qa_bot_stream`;
        payload = {
            question: data.instructions, // Use instructions as the question
            session_id: sessionId,
            base64_images: [],
            base64_files: [],
            base64_audios: []
        };
      } else {
          // Standard Report Types (Company/Industry) - Now using Streaming
          endpoint = `${baseUrl}/api/sec/deep_qa_bot_stream_report`;
          
          payload.report_type = data.reportType;

          if (data.reportType === 'industry_deep_drive') {
            payload.industry_name = data.industryName;
          } else {
            // Standard company report
            payload.ticker = data.company.ticker;
            payload.company_name = data.company.name;
          }

          // Add optional fields for standard reports
          if (data.instructions.trim()) {
            payload.instructions = data.instructions;
          }
      }

      // Show loading state
      setIsGeneratingReport(true);
      setChatMode('report');

      // Call the report generation API (Streaming for ALL types)
      const token = localStorage.getItem('access');
      
      // Add user message immediately
      const userContent = data.reportType === 'custom_instructions' 
          ? data.instructions 
          : `Generate a report for ${data.reportType === 'industry_deep_drive' ? data.industryName : `${data.company.name} (${data.company.ticker})`}${data.instructions ? `\n\nInstructions: ${data.instructions}` : ''}`;

      setReportMessages(prev => [
        ...prev,
        { role: 'user', content: userContent }
      ]);

      // Add placeholder for assistant message
      setReportMessages(prev => [
        ...prev,
        { role: 'assistant', content: '' }
      ]);

      // Refresh history after starting stream
      setTimeout(fetchReportSessions, 2000);

      try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
              throw new Error(`Stream connection failed: ${response.status}`);
          }

          if (!response.body) throw new Error('ReadableStream not supported');

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              // Keep the last partial line in buffer
              buffer = lines.pop() || '';

              for (const line of lines) {
                  if (line.startsWith('data: ')) {
                      try {
                          const jsonStr = line.substring(6);
                          const eventData = JSON.parse(jsonStr);

                          if (eventData.type === 'token' && eventData.content) {
                              // Append token to the last assistant message
                              setReportMessages(prev => {
                                  const newMsgs = [...prev];
                                  const lastIdx = newMsgs.length - 1;
                                  if (lastIdx >= 0 && newMsgs[lastIdx].role === 'assistant') {
                                      newMsgs[lastIdx] = {
                                          ...newMsgs[lastIdx],
                                          content: newMsgs[lastIdx].content + eventData.content
                                      };
                                  }
                                  return newMsgs;
                              });
                          } else if (eventData.type === 'image' || eventData.type === 'chart' || eventData.type === 'figure') {
                              // Handle image/chart data - append as markdown image syntax
                              const imageUrl = eventData.url || eventData.data || eventData.content;
                              const imageAlt = eventData.alt || eventData.caption || 'Report image';
                              if (imageUrl) {
                                  setReportMessages(prev => {
                                      const newMsgs = [...prev];
                                      const lastIdx = newMsgs.length - 1;
                                      if (lastIdx >= 0 && newMsgs[lastIdx].role === 'assistant') {
                                          // Append image markdown syntax
                                          const imageMarkdown = `\n\n![${imageAlt}](${imageUrl})\n\n`;
                                          newMsgs[lastIdx] = {
                                              ...newMsgs[lastIdx],
                                              content: newMsgs[lastIdx].content + imageMarkdown
                                          };
                                      }
                                      return newMsgs;
                                  });
                              }
                          } else if (eventData.type === 'error') {
                              console.error('Stream error:', eventData.error);
                              // Optionally append error to chat
                          }
                      } catch (e) {
                          console.warn('Failed to parse SSE data:', line);
                      }
                  }
              }
          }
      } catch (error: any) {
          console.error('Streaming error:', error);
          setReportMessages(prev => [
            ...prev,
            { role: 'assistant', content: `\n\n**Error:** ${error.message}` }
          ]);
      } finally {
          setIsGeneratingReport(false);
      }
    } catch (error: any) {
      console.error('Error generating report:', error);
      alert(`Failed to generate report: ${error.message}`);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleSessionUpdate = () => {
    // Refresh chat history when a new message is sent
    fetchChatHistory();
  };

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const contactData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      company: formData.get('company') as string,
      phone: formData.get('phone') as string,
      message: formData.get('message') as string,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch(`${baseUrl}/api/contact/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullname: contactData.name,
          email: contactData.email,
          company: contactData.company,
          phone: contactData.phone,
          message: contactData.message
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Close modal and show success message
        setShowContactModal(false);
        alert('Thank you for your message! We will get back to you soon.');
        
        // Reset form using ref
        if (contactFormRef.current) {
          contactFormRef.current.reset();
        }
      } else {
        alert(data.error || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      alert('Failed to send message. Please try again or contact us directly.');
    }
  };

  const checkQuestionLimit = () => {
    if (userSubscription.plan === 'free' && questionsAsked >= userSubscription.questionsLimit) {
      setShowPricingModal(true);
      return false;
    }
    return true;
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        
        setInputValue(transcript);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.start();
    } else {
      alert('Speech recognition is not supported in this browser.');
    }
  };


  const [userName, setUserName] = useState('Guest User');
  const [userInitials, setUserInitials] = useState('GU');
  const [activeChart, setActiveChart] = useState<'metrics' | 'peers' | 'industry' | 'valuation'>('metrics');
  const [searchValue, setSearchValue] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState<CompanyTicker[]>([]);
  const [companyInput, setCompanyInput] = useState('');
  const [availableCompanies, setAvailableCompanies] = useState<CompanyTicker[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [selectedPeerMetric, setSelectedPeerMetric] = useState<string>('');
  const [selectedSearchMetrics, setSelectedSearchMetrics] = useState<string[]>([]);
  const [searchMetricInput, setSearchMetricInput] = useState('');
  const [availableMetrics, setAvailableMetrics] = useState<{ value: string; label: string }[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('Annual');
  const [peerChartData, setPeerChartData] = useState<PeerDataPoint[]>([]);
  const [peerLoading, setPeerLoading] = useState(false);
  const [peerError, setPeerError] = useState<string | null>(null);
  // const [selectedIndustryCompanies, setSelectedIndustryCompanies] = useState<CompanyTicker[]>([]);
  const [selectedIndustryMetrics, setSelectedIndustryMetrics] = useState<string[]>([]);
  const [industryMetricInput, setIndustryMetricInput] = useState('');
  const [industryChartData, setIndustryChartData] = useState<Record<string, (number | null)[]>>({});
  const [industryCompanyNames, setIndustryCompanyNames] = useState<Record<string, string[]>>({});
  const [industryLoading, setIndustryLoading] = useState(false);
  const [industryError, setIndustryError] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [availableIndustries, setAvailableIndustries] = useState<{ value: string; label: string; companies: string[] }[]>([]);
  const [selectedTicker, setSelectedTicker] = useState('');
  const [showMetricDropdown, setShowMetricDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const industryDropdownRef = useRef<HTMLDivElement>(null);
  const [industrySearch, setIndustrySearch] = useState('');
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [companySearch, setCompanySearch] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const companyDropdownRef = useRef<HTMLDivElement>(null);
  const [peerMetricSearch, setPeerMetricSearch] = useState('');
  const [showPeerMetricDropdown, setShowPeerMetricDropdown] = useState(false);
  const peerDropdownRef = useRef<HTMLDivElement>(null);
  const [activeTooltip, setActiveTooltip] = useState<ActiveTooltip | null>(null);
  const [fixed2024Data, setFixed2024Data] = useState<any>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const performanceCardRef = useRef<HTMLDivElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  const [_companyMap, setCompanyMap] = useState<{ [ticker: string]: string }>({});

  // Add these lines for peer metrics
  const [selectedPeerMetrics, setSelectedPeerMetrics] = useState<string[]>([]);

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Business Performance tabs state
  const [activePerformanceTab, setActivePerformanceTab] = useState<'top-picks' | 'performance' | 'valuation'>('performance');

  const {
    messages,
    inputValue,
    setInputValue,
    handleSendMessage,
    setMessages,
    isLoading: isChatLoading
  } = useChat({
    chartData: activeChart === 'peers'
      ? peerChartData
      : activeChart === 'industry'
        ? Object.entries(industryChartData).map(([metric, values]) => ({
            metric,
            values
          }))
        : chartData,
    searchValue,
    selectedPeriod,
    selectedMetrics: activeChart === 'peers' ? selectedPeerMetrics : 
                 activeChart === 'industry' ? selectedIndustryMetrics : 
                 selectedSearchMetrics,
    activeChart,
    selectedCompanies,
    currentChatSession,
    onSessionUpdate: handleSessionUpdate,
    uploadedFiles,
    onClearFiles: clearUploadedFiles,
    onAuthError: () => {
      // Clear tokens and redirect to login
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      localStorage.removeItem('user_info');
      window.location.href = '/login';
    },
    onNewContent: () => {
      setHasNewChatContent(true);
    }
  });

  // Get user info from localStorage and handle chat state restoration
  useEffect(() => {
    const userInfo = localStorage.getItem('user_info');
    console.log('User info from localStorage:', userInfo);
    
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        console.log('Parsed user info:', user);
        
        const firstName = user.first_name || '';
        const lastName = user.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        
        console.log('First name:', firstName);
        console.log('Last name:', lastName);
        console.log('Full name:', fullName);
        
        if (fullName) {
          setUserName(fullName);
          setUserInitials(`${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase());
        } else {
          console.log('No name found in user info');
        }
      } catch (error) {
        console.error('Error parsing user info:', error);
      }
    } else {
      console.log('No user info found in localStorage');
    }

    // Check for pricing modal flag from profile navigation
    const showPricingModal = localStorage.getItem('show_pricing_modal');
    if (showPricingModal === '1') {
      localStorage.removeItem('show_pricing_modal');
      setShowPricingModal(true);
    }

    // Restore chat state if available
    const savedChatState = localStorage.getItem('current_chat_state');
    if (savedChatState) {
      try {
        const chatState = JSON.parse(savedChatState);
        console.log('Restoring chat state:', chatState);
        
        if (chatState.messages && chatState.messages.length > 1) {
          setMessages(chatState.messages);
          setCurrentChatSession(chatState.currentChatSession);
          setHasNewChatContent(chatState.hasNewChatContent || false);
          
          // Don't auto-clear the saved state - let user explicitly start new chat
          console.log('Chat state restored successfully');
        }
      } catch (error) {
        console.error('Error restoring chat state:', error);
        localStorage.removeItem('current_chat_state');
      }
    }
  }, []);

  useEffect(() => {
    const fetchCompanies = async () => {
      setCompaniesLoading(true);
      try {
        const response = await fetch(`${baseUrl}/api/sec/central/companies`);
        if (!response.ok) {
          throw new Error(`Failed to fetch companies: ${response.status}`);
        }
        const data = await response.json();
        
        // Handle both paginated (results) and non-paginated responses
        const companiesList = data.results || data;

        const map: { [ticker: string]: string } = {};
        const companies: CompanyTicker[] = [];
        
        companiesList.forEach((company: any) => {
          const ticker = company.ticker;
          // Central API returns {ticker, name}
          const name = company.name || company.ticker;
          map[ticker] = name;
          companies.push({ ticker, name });
        });

        setCompanyMap(map);
        setAvailableCompanies(companies);
      } catch (error) {
        console.error('Error fetching companies:', error);
        setError('Failed to load companies. Please refresh the page.');
      } finally {
        setCompaniesLoading(false);
      }
    };

    fetchCompanies();
    // Fetch chat history with a small delay to avoid blocking initial render
    setTimeout(() => {
      fetchChatHistory();
    }, 100);
    
    // Check for 24-hour auto-activation
    setTimeout(() => {
      check24HourActivation();
    }, 2000); // Delay to let everything load first
  }, [baseUrl, userRegistrationTime, userSubscription]);


  const fetchAvailableMetrics = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/sec/central/metrics`);
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }
      const data = await response.json();
      console.log('Fetched metrics:', data);
      
      // Format metric names for display
      const formattedMetrics = (data.metrics || []).map((metric: string) => ({
        value: metric,
        label: metric
          .replace(/([A-Z])/g, ' $1') // Add space before capital letters
          .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
          .trim()
      }));
      
      if (formattedMetrics.length > 0) {
        setAvailableMetrics(formattedMetrics);
      } else {
        // Fallback if empty
      setAvailableMetrics(AVAILABLE_METRICS);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
      // Fallback to hardcoded metrics on error
      setAvailableMetrics(AVAILABLE_METRICS);
    }
  };

  const fetchMetricData = useCallback(async () => {
    if (!searchValue || selectedSearchMetrics.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const ticker = searchValue.split(':')[0].trim().toUpperCase();
      console.log('Fetching data from API for ticker:', ticker, 'period:', selectedPeriod);

      let transformedData: ChartDataPoint[] = [];

      if (selectedPeriod === 'Annual') {
        // For Annual: Fetch all available data (historical and future)
        const yearData: { [year: string]: any } = {};
        
        // Fetch data for each metric
        const promises = selectedSearchMetrics.map(async (metric) => {
          const url = `${baseUrl}/api/sec/central/aggregated-data/?tickers=${encodeURIComponent(ticker)}&metric=${encodeURIComponent(metric)}&period=ALL`;
          const response = await fetch(url);
          
          if (!response.ok) {
            console.warn(`Failed to fetch ${metric} data: ${response.status}`);
            return { metric, data: [] }; // Return empty data on error instead of throwing
          }
          
          const data = await response.json();
          return { metric, data };
        });

        const results = await Promise.all(promises);
        
        // Transform API response to chart format
        results.forEach(({ metric, data }) => {
          data.forEach((item: { name: string; ticker: string; value: number | null }) => {
            const year = item.name;
            if (!yearData[year]) {
              yearData[year] = {
                name: year,
                year: parseInt(year) || year
                };
              }
              
            // Determine if historical (year <= 2024) or future
            const yearNum = parseInt(year);
            const isHistorical = !isNaN(yearNum) && yearNum <= 2024;
            const suffix = isHistorical ? '_historical' : '_future';
            yearData[year][`${metric}${suffix}`] = item.value;
            });
        });
        
        // Convert to array and sort by year
        transformedData = Object.values(yearData).sort((a, b) => {
          const yearA = parseInt(a.name) || 0;
          const yearB = parseInt(b.name) || 0;
          return yearA - yearB;
        });

      } else if (selectedPeriod === 'Average') {
        // For Average: Fetch data for each period (1Y, 2Y, 3Y, 4Y, 5Y, 10Y, 15Y)
        const periods = ['1Y', '2Y', '3Y', '4Y', '5Y', '10Y', '15Y'];
        const periodData: { [period: string]: any } = {};
        
        // Fetch data for each metric and period combination
        const promises = selectedSearchMetrics.flatMap((metric) =>
          periods.map(async (period) => {
            const url = `${baseUrl}/api/sec/central/aggregated-data/?tickers=${encodeURIComponent(ticker)}&metric=${encodeURIComponent(metric)}&period=${encodeURIComponent(period)}&periodType=Average`;
            const response = await fetch(url);
            
            if (!response.ok) {
              console.warn(`Failed to fetch ${metric} data for period ${period}: ${response.status}`);
              return { metric, period, value: null };
            }
            
            const data = await response.json();
            // Get the first (and should be only) value for this period
            const value = data.length > 0 ? data[0].value : null;
            return { metric, period, value };
          })
        );

        const results = await Promise.all(promises);
        
        // Group by period
        results.forEach(({ metric, period, value }) => {
          if (!periodData[period]) {
            periodData[period] = {
              name: period,
              period: period
                };
              }
          if (value !== null) {
            periodData[period][metric] = value;
          }
        });

        // Convert to array, sorted by period
        transformedData = Object.values(periodData).sort((a, b) => {
          const periodOrder = ['1Y', '2Y', '3Y', '4Y', '5Y', '10Y', '15Y'];
          return periodOrder.indexOf(a.period) - periodOrder.indexOf(b.period);
        });

      } else if (selectedPeriod === 'CAGR') {
        // For CAGR: Similar to Average but with periodType=CAGR
        const periods = ['1Y', '2Y', '3Y', '4Y', '5Y', '10Y', '15Y'];
        const periodData: { [period: string]: any } = {};
        
        // Fetch data for each metric and period combination
        const promises = selectedSearchMetrics.flatMap((metric) =>
          periods.map(async (period) => {
            const url = `${baseUrl}/api/sec/central/aggregated-data/?tickers=${encodeURIComponent(ticker)}&metric=${encodeURIComponent(metric)}&period=${encodeURIComponent(period)}&periodType=CAGR`;
            const response = await fetch(url);
            
            if (!response.ok) {
              console.warn(`Failed to fetch ${metric} CAGR data for period ${period}: ${response.status}`);
              return { metric, period, value: null }; // Gracefully handle missing data
            }
            
            const data = await response.json();
            const value = data.length > 0 ? data[0].value : null;
            return { metric, period, value };
          })
        );

        const results = await Promise.all(promises);
        
        // Group by period
        results.forEach(({ metric, period, value }) => {
          if (!periodData[period]) {
            periodData[period] = {
              name: period,
              period: period
                };
              }
          if (value !== null) {
            periodData[period][metric] = value;
          }
        });

        // Convert to array, sorted by period
        transformedData = Object.values(periodData).sort((a, b) => {
          const periodOrder = ['1Y', '2Y', '3Y', '4Y', '5Y', '10Y', '15Y'];
          return periodOrder.indexOf(a.period) - periodOrder.indexOf(b.period);
        });
      }

      if (transformedData.length === 0) {
        setError(`No data available for ${ticker}. Please try another company or metric.`);
        setChartData([]);
        return;
      }

      console.log('Transformed API data:', transformedData);
      setChartData(transformedData);

    } catch (error) {
      console.error('Error fetching data from API:', error);
      setError('Failed to load data from database. Please try again.');
      setChartData([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchValue, selectedSearchMetrics, selectedPeriod, baseUrl]);

  const fetchPeerData = useCallback(async () => {
    try {
      if (!selectedCompanies.length || !selectedPeerMetric) {
        console.log('Missing required data for peer fetch:', { 
          companies: selectedCompanies, 
          metric: selectedPeerMetric 
        });
        return;
      }
      
      console.log('Fetching peer data for:', {
        companies: selectedCompanies.map(c => c.ticker),
        metric: selectedPeerMetric,
        period: selectedPeriod
      });
      
      setPeerLoading(true);
      setPeerError(null);

      // Determine periodType and period value based on selectedPeriod
      let periodTypeParam = '';
      let periodValue: string = selectedPeriod;
      
      if (selectedPeriod === 'Average') {
        periodTypeParam = '&periodType=Average';
        periodValue = '1Y'; // Default to 1Y for Average mode
      } else if (selectedPeriod === 'CAGR') {
        periodTypeParam = '&periodType=CAGR';
        periodValue = '1Y'; // Default to 1Y for CAGR mode
      } else if (selectedPeriod === 'Annual') {
        // Convert 'Annual' to 'ALL' for backend API to get historical data
        periodValue = 'ALL';
      }
      // For period strings like '1Y', '2Y', etc., use as-is
      
      // Fetch data for each company
      const promises = selectedCompanies.map(async company => {
        const url = `${baseUrl}/api/sec/central/aggregated-data/?tickers=${encodeURIComponent(company.ticker)}&metric=${encodeURIComponent(selectedPeerMetric)}&period=${encodeURIComponent(periodValue)}${periodTypeParam}`;
        console.log('Fetching from:', url);
        const response = await fetch(url);
        
        if (!response.ok) {
           console.warn(`Failed to fetch peer data for ${company.ticker}: ${response.status}`);
           return { company, data: [] }; // Return empty data on error
        }
        
        const data = await response.json();
        console.log(`Data for ${company.ticker}:`, data);
        return { company, data };
      });

      const results = await Promise.all(promises);
      
      if (results.length === 0 || results[0].data.length === 0) {
        setPeerError('No data available for the selected companies and metric.');
        setPeerChartData([]);
        return;
      }

      let transformedData: PeerDataPoint[];

      if (selectedPeriod === 'Annual') {
        // For Annual: Split data into _historical and _future based on year
        const yearData: { [year: string]: any } = {};
        
        // Collect all unique time points from all companies
        results.forEach(({ company, data }) => {
          data.forEach((item: DataItem) => {
            const year = item.name;
            if (!yearData[year]) {
              yearData[year] = {
                name: year,
                year: parseInt(year) || year
              };
            }
            
            // Determine if historical (year <= 2024) or future
            const yearNum = parseInt(year);
            const isHistorical = !isNaN(yearNum) && yearNum <= 2024;
            const suffix = isHistorical ? '_historical' : '_future';
            const metricKey = `${selectedPeerMetric}${suffix}`;
            
            // Initialize the metric key if it doesn't exist
            if (!yearData[year][metricKey]) {
              yearData[year][metricKey] = {};
            }
            
            // Add company value
            yearData[year][metricKey][company.ticker] = item.value;
          });
        });
        
        // Convert to array and sort by year
        transformedData = Object.values(yearData).sort((a, b) => {
          const yearA = parseInt(a.name) || 0;
          const yearB = parseInt(b.name) || 0;
          return yearA - yearB;
        }) as PeerDataPoint[];
      } else {
        // For Average/CAGR: Create a unified dataset with all companies
        transformedData = results[0].data.map((timePoint: TimePoint) => {
          const point: PeerDataPoint = { 
            name: timePoint.name,
            // Add metric name as key with company values
            [selectedPeerMetric]: {} 
          };
          
          results.forEach(({ company, data }) => {
            const matchingPoint = data.find((d: DataItem) => d.name === timePoint.name);
            if (matchingPoint) {
              (point[selectedPeerMetric] as { [ticker: string]: number })[company.ticker] = matchingPoint.value;
            }
          });
          
          return point;
        });
      }

      console.log('Transformed peer data:', transformedData);
      setPeerChartData(transformedData);

    } catch (error) {
      console.error('Error fetching peer data from API:', error);
      setPeerError('Failed to load peer comparison data. Please try again.');
      setPeerChartData([]);
    } finally {
      setPeerLoading(false);
    }
  }, [selectedCompanies, selectedPeerMetric, selectedPeriod, baseUrl]);

  const fetchIndustryData = useCallback(async () => {
    if (selectedIndustryMetrics.length === 0 || !selectedIndustry) return;
    
    setIndustryLoading(true);
    setIndustryError(null);
    
    try {
      console.log('Fetching industry distribution data (box plot):', selectedIndustry, selectedIndustryMetrics, selectedPeriod);

      // Industry tab periods are AVG-only; map UI label to API params
      const avgMatch = selectedPeriod.match(/^Last\s+(\d+)Y\s+AVG$/);
      if (!avgMatch) {
        setIndustryError('Invalid period for industry comparison. Please choose a "Last xY AVG" period.');
        setIndustryChartData({});
        return;
      }

      const periodYears = `${avgMatch[1]}Y`;
      const periodType = 'Average';

      // Find the selected industry's tickers from the Central industries list
      const industryObj = availableIndustries.find(ind => ind.value === selectedIndustry);
      const tickers: string[] = (industryObj?.companies || []).filter(Boolean);

      if (tickers.length === 0) {
        setIndustryError('No companies found for the selected industry.');
        setIndustryChartData({});
        return;
      }

      // Chunk tickers to avoid overly long URLs
      const chunkSize = 100;
      const tickerChunks: string[][] = [];
      for (let i = 0; i < tickers.length; i += chunkSize) {
        tickerChunks.push(tickers.slice(i, i + chunkSize));
      }

      const results: Record<string, (number | null)[]> = {};
      const companyNamesByMetric: Record<string, string[]> = {};

      // Fetch distribution for each metric: aggregated-data across all tickers in the industry
      await Promise.all(selectedIndustryMetrics.map(async (metric) => {
        const values: (number | null)[] = [];
        const companyNames: string[] = [];

        // The API can return 404 for a multi-ticker request if ANY ticker has no data.
        // So we do an adaptive split: try the batch, and if it fails, bisect until we isolate the tickers with data.
        const fetchChunkAdaptive = async (chunk: string[]): Promise<any[]> => {
          if (chunk.length === 0) return [];
          const url = `${baseUrl}/api/sec/central/aggregated-data/?tickers=${encodeURIComponent(chunk.join(','))}&metric=${encodeURIComponent(metric)}&period=${encodeURIComponent(periodYears)}&periodType=${encodeURIComponent(periodType)}`;
          const response = await fetch(url);

          if (response.ok) {
            const data = await response.json();
            return Array.isArray(data) ? data : [];
          }

          // If a single ticker fails, there's nothing to salvage.
          if (chunk.length === 1) {
            console.warn(`No data for ${metric} (${periodYears} AVG) ticker=${chunk[0]}: ${response.status}`);
            return [];
          }

          // Split and retry to salvage tickers that DO have data.
          if (response.status === 404) {
            const mid = Math.floor(chunk.length / 2);
            const left = await fetchChunkAdaptive(chunk.slice(0, mid));
            const right = await fetchChunkAdaptive(chunk.slice(mid));
            return [...left, ...right];
          }

          console.warn(`Failed to fetch industry aggregated-data for ${metric}: ${response.status}`);
          return [];
        };

        for (const chunk of tickerChunks) {
          const data = await fetchChunkAdaptive(chunk);
          data.forEach((item: any) => {
            const t = String(item?.ticker || '').toUpperCase();
            const raw = item?.value;
            const v = Number(raw);
            companyNames.push(t || 'Unknown');
            values.push(raw === null || raw === undefined || !Number.isFinite(v) ? null : v);
          });
        }

        results[metric] = values;
        companyNamesByMetric[metric] = companyNames;
      }));

      const hasAny = Object.values(results).some(arr => Array.isArray(arr) && arr.length > 0);
      if (!hasAny) {
        setIndustryError('No data available for the selected industry, metrics, and period.');
        setIndustryChartData({});
        setIndustryCompanyNames({});
      } else {
        setIndustryChartData(results);
        setIndustryCompanyNames(companyNamesByMetric);
      }

    } catch (error) {
      console.error('Error fetching industry data:', error);
      setIndustryError('Failed to fetch industry data. Please try again.');
      setIndustryChartData({});
      setIndustryCompanyNames({});
    } finally {
      setIndustryLoading(false);
    }
  }, [selectedIndustryMetrics, selectedIndustry, selectedPeriod, availableIndustries, baseUrl]);

  const fetchAvailableIndustries = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/sec/central/industries`);
      if (!response.ok) {
        throw new Error(`Failed to fetch industries: ${response.status}`);
      }
      const data = await response.json();
      console.log('Raw industries data:', data);
      
      // Handle response structure { industries: [...] }
      const industriesList = data.industries || [];
      
      // Format industries correctly
      const formattedIndustries = industriesList.map((industry: { name: string, companies: string[] }) => ({
        value: industry.name,
        label: industry.name,
        companies: industry.companies || []
      }));
      
      console.log('Formatted industries:', formattedIndustries);
      setAvailableIndustries(formattedIndustries);
    } catch (error) {
      console.error('Error fetching industries:', error);
      // Fallback to empty or keep existing? Usually better to show empty/error than stale wrong data if API fails consistently
      // setAvailableIndustries([]); 
    }
  };

  const fetchAvailableSectors = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/sectors/`);
      const data = await response.json();
      setAvailableSectors(data.sectors || []);
    } catch (error) {
      console.error('Error fetching sectors:', error);
    }
  };

  useEffect(() => {
    fetchAvailableMetrics();
  }, []);

  // Clear all cached chart data when reset occurs to force complete refresh
  useEffect(() => {
    if (resetTrigger > 0) { // Only clear if resetTrigger has been set (not initial 0)
      setChartData([]);
      setPeerChartData([]);
      setIndustryChartData({});
      setIndustryCompanyNames({});
      setFixed2024Data(null);
      setError(null);
      setPeerError(null);
      setIndustryError(null);
      
      // Force immediate re-fetch if currently on metrics tab
      if (activeChart === 'metrics') {
        setTimeout(() => fetchMetricData(), 50);
      }
    }
  }, [resetTrigger, activeChart, fetchMetricData, searchValue]);

  // Fetch metric data when dependencies change (do NOT depend on chartData)
  useEffect(() => {
    if (activeChart === 'metrics') {
      fetchMetricData();
    }
  }, [searchValue, selectedSearchMetrics, activeChart, selectedPeriod, fetchMetricData, modifiedData, resetTrigger]);

  // Update the useEffect that sets fixed2024Data
  useEffect(() => {
    if (activeChart === 'metrics' && chartData.length > 0) {
      // For annual view, keep the 2024 logic
      if (selectedPeriod === 'Annual') {
        const data2024 = chartData.find(d => d.name.startsWith('2024'));
        if (data2024) {
          setFixed2024Data(data2024);
        }
      } else {
        // For other periods (2Y, 3Y, etc.), use the last period
        const lastPeriod = chartData[chartData.length - 1];
        if (lastPeriod) {
          setFixed2024Data(lastPeriod);
        }
      }
    } else if (activeChart === 'peers' && peerChartData.length > 0) {
      if (selectedPeriod === 'Annual') {
        const data2024 = peerChartData.find(d => String(d.name).startsWith('2024'));
        if (data2024) {
          setFixed2024Data(data2024);
        }
      } else {
        const lastPeriod = peerChartData[peerChartData.length - 1];
        if (lastPeriod) {
          setFixed2024Data(lastPeriod);
        }
      }
    }
  }, [chartData, peerChartData, activeChart, selectedPeriod]);

  useEffect(() => {
    if (activeChart === 'peers' && selectedPeerMetric && selectedCompanies.length > 0) {
      console.log('Triggering peer data fetch');
      fetchPeerData();
    }
  }, [activeChart, selectedPeerMetric, selectedCompanies, fetchPeerData, resetTrigger]);

  useEffect(() => {
    if (activeChart === 'industry') {
      fetchIndustryData();
    }
  }, [activeChart, selectedIndustryMetrics, selectedPeriod, selectedIndustry, fetchIndustryData, resetTrigger]);



  useEffect(() => {
    fetchAvailableIndustries();
    fetchAvailableSectors();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMetricDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add this useEffect for industry dropdown click handling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (industryDropdownRef.current && !industryDropdownRef.current.contains(event.target as Node)) {
        setShowIndustryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setShowCompanyDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add click outside handler for peer dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (peerDropdownRef.current && !peerDropdownRef.current.contains(event.target as Node)) {
        setShowPeerMetricDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);



  // Remove this function if not used
  // const toggleSidebar = () => {
  //   setIsSidebarVisible(!isSidebarVisible);
  // };

  console.log('chartData:', chartData);
  console.log('fixed2024Data:', fixed2024Data);
  console.log('peerChartData:', peerChartData);

  useEffect(() => {
    console.log('Current selectedCompanies:', selectedCompanies);
  }, [selectedCompanies]);

  // Ensure this useEffect is called when the industry is selected
  useEffect(() => {
    if (selectedIndustry) {
      // Fetch or set selectedIndustryCompanies here
      // Example: setSelectedIndustryCompanies(fetchCompaniesForIndustry(selectedIndustry));
    }
  }, [selectedIndustry]);

  // Add effect to update selectedPeerMetrics when selectedPeerMetric changes
  useEffect(() => {
    if (selectedPeerMetric) {
      setSelectedPeerMetrics([selectedPeerMetric]);
    }
  }, [selectedPeerMetric]);

  // Handle period state when switching tabs
  useEffect(() => {
    if (activeChart === 'industry') {
      // Set default to 'Last 1Y AVG' for industry tab
      if (!selectedPeriod.startsWith('Last') || !selectedPeriod.includes('AVG')) {
        setSelectedPeriod('Last 1Y AVG');
      }
    } else {
      // Set default to 'Annual' for other tabs
      if (selectedPeriod.startsWith('Last') || !['Annual', 'Average', 'CAGR'].includes(selectedPeriod)) {
        setSelectedPeriod('Annual');
      }
    }
  }, [activeChart, selectedPeriod]);


  useEffect(() => {
    const clearHandler = () => {
      setMessages([
        {
          role: 'assistant',
          content: 'I can help you analyze this data. What would you like to know?'
        }
      ]);
    };
    window.addEventListener('clearChat', clearHandler);
    return () => window.removeEventListener('clearChat', clearHandler);
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Save chat state to localStorage when messages change (with debouncing)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (messages.length > 1) { // Only save if there are actual conversations
        const chatState = {
          messages,
          currentChatSession,
          hasNewChatContent,
          timestamp: Date.now()
        };
        
        try {
          localStorage.setItem('current_chat_state', JSON.stringify(chatState));
          console.log('Chat state saved to localStorage');
        } catch (error) {
          console.error('Error saving chat state:', error);
        }
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeoutId);
  }, [messages, currentChatSession, hasNewChatContent]);

  // Handle page unload/navigation - save chat state
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (messages.length > 1) {
        const chatState = {
          messages,
          currentChatSession,
          hasNewChatContent,
          timestamp: Date.now()
        };
        
        try {
          localStorage.setItem('current_chat_state', JSON.stringify(chatState));
        } catch (error) {
          console.error('Error saving chat state on unload:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [messages, currentChatSession, hasNewChatContent]);

  // Example usage:
  // const getChatboxPayload = () => {
  //   // ... (original implementation)
  // };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close mobile sidebar when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Close mobile sidebar with ESC key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    };

    if (isMobileSidebarOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when mobile sidebar is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileSidebarOpen]);

  return (
    <>
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 dark:bg-[#0B0F0E]">
      <style>
        {`
          @media print {
            body.print-bp-only * { visibility: hidden !important; }
            body.print-bp-only #bp-print-area, body.print-bp-only #bp-print-area * { visibility: visible !important; }
            body.print-bp-only #bp-print-area { position: absolute; left: 0; top: 0; width: 100%; }
            body.print-bp-only [data-ignore-pdf] { display: none !important; }
            /* Ensure fixed tooltip is included when card scrolls */
            body.print-bp-only #bp-print-area .bp-scroll { overflow: visible !important; height: auto !important; }
            body.print-bp-only #bp-print-area .fixed-tooltip { position: static !important; margin-top: 8px; }
          }
        `}
      </style>
              {/* Mobile Header */}
        <div className="lg:hidden flex justify-between items-center p-1 xm:p-1.5 xs:p-2 sm:p-2.5 md:p-3 bg-white dark:bg-[#161C1A] border-b dark:border-[#161C1A] h-14 xm:h-16 xs:h-16 sm:h-18 md:h-20">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-1 xm:p-1.5 xs:p-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#1C2220] transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-4 h-4 xm:w-4.5 xm:h-4.5 xs:w-5 xs:h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 dark:text-[#E0E6E4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex-1"></div> {/* Spacer for center alignment */}
          
          <div className="w-6 xm:w-7 xs:w-8 sm:w-9 md:w-10"></div> {/* Spacer for balance */}
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Desktop Header - hidden on mobile, shown only on lg+ screens */}
        <div className="hidden lg:block border-b dark:border-[#161C1A] bg-white dark:bg-[#161C1A] absolute left-0 right-0 h-20 lg:h-24">
          <div className="flex items-center h-full relative border dark:border-[#161C1A]">
            {/* Logo container - hide on mobile and show only on desktop */}
            <div className="hidden lg:block h-45 w-fit  overflow-visible pl-4 lg:pl-6 xl:pl-7">
              <img 
                src={theme === 'dark' ? "/vshape.svg" : "/logo.svg"}
                alt="GetDeep.AI" 
                className="w-full h-full"
              />
            </div>
            
            {/* GetDeeper icon container with user profile - hidden on mobile */}
            <div className="hidden lg:flex flex-1 justify-end items-center gap-3 lg:gap-4 xl:gap-6">
              <div className="absolute top-1 lg:top-2 left-1/3 transform -translate-x-1/2 lg:mr-[20%] xl:mr-[25%] 2xl:mr-[30%]">  
                <button
                  onClick={() => setShowPricingModal(true)}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  title="Upgrade to Pro"
                >
                </button>
              </div>

              {/* Dark Mode Toggle - hidden on mobile, positioned between GetDeeper icon and username */}
              <button
                onClick={toggleTheme}
                className="hidden lg:flex absolute right-[16rem] lg:right-[18rem] xl:right-[20rem] top-1/2 -translate-y-1/2 items-center justify-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#1C2220] transition-colors text-sm font-medium text-gray-700 dark:text-[#E0E6E4]"
              >
                {theme === 'light' ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                    </svg>
                    Dark Mode
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                    </svg>
                    Light Mode
                  </>
                )}
              </button>
              
              {/* User Profile - hidden on mobile */}
              <div className="absolute right-3 lg:right-4 xl:right-6" ref={profileDropdownRef}>
                <div className="flex items-center gap-2 lg:gap-3 xl:gap-4">
                  <div className="text-right relative">
                    <button
                      className="text-lg lg:text-xl xl:text-2xl font-medium focus:outline-none dark:text-[#E0E6E4]"
                      onClick={() => setProfileDropdownOpen((open) => !open)}
                    >
                      {userName}
                    </button>
                    {profileDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#161C1A] border border-gray-200 dark:border-[#161C1A] rounded shadow-lg z-50">
                        {/* User Profile Section */}
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-[#161C1A]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#144D37] rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {userInitials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 dark:text-[#E0E6E4] truncate">
                                {userName}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-[#889691] truncate">
                                {(() => {
                                  const userInfo = localStorage.getItem('user_info');
                                  if (userInfo) {
                                    try {
                                      const user = JSON.parse(userInfo);
                                      return user.email || 'No email';
                                    } catch (error) {
                                      return 'No email';
                                    }
                                  }
                                  return 'No email';
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="py-1">
                          <button
                            onClick={() => {
                              navigate('/profile');
                              setProfileDropdownOpen(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-[#E0E6E4] hover:bg-gray-100 dark:hover:bg-[#1C2220]"
                          >
                            View Profile
                          </button>
                          <button
                            onClick={logout}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-[#E0E6E4] hover:bg-gray-100 dark:hover:bg-[#1C2220]"
                          >
                            Sign out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="w-8 lg:w-9 xl:w-10 2xl:w-12 h-8 lg:h-9 xl:h-10 2xl:h-12 bg-[#144D37] rounded-full flex items-center justify-center text-white text-sm lg:text-base xl:text-lg">
                    {userInitials}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            
            {/* Sidebar */}
            <div className="fixed left-0 top-0 h-full w-64 xm:w-72 xs:w-80 sm:w-96 md:w-80 bg-white dark:bg-[#161C1A] shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b dark:border-[#161C1A]">
                <img src={theme === 'dark' ? "/vshape.svg" : "/logo.svg"} alt="GetDeep.AI" className="h-12 w-fit opacity-100" />
                <div className="flex items-center gap-2">
                  {/* Dark Mode Toggle */}
                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#1C2220] transition-colors text-sm font-medium text-gray-700 dark:text-[#E0E6E4]"
                  >
                    {theme === 'light' ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                        </svg>
                        Dark Mode
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                        </svg>
                        Light Mode
                      </>
                    )}
                  </button>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#1C2220] transition-colors"
                  aria-label="Close menu"
                >
                    <svg className="w-6 h-6 dark:text-[#E0E6E4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                </div>
              </div>
              
              {/* Navigation Items */}
              <div className="px-3 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <button 
                    onClick={() => {
                      setShowValuationModal(true);
                      setIsChatbotMinimized(true); // full-width like Performance double-click
                      setIsMobileSidebarOpen(false);
                    }}
                    className="flex items-center gap-2 sm:gap-3 w-full text-left p-2 sm:p-3 hover:bg-gray-100 dark:hover:bg-[#1C2220] rounded-lg transition-colors dark:text-[#E0E6E4]"
                  >
                    <span className="text-base sm:text-lg">📊</span>
                    <span className="text-sm sm:text-base">Company Valuation</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <button 
                    onClick={() => {
                      setShowContactModal(true);
                      setIsMobileSidebarOpen(false);
                    }}
                    className="flex items-center gap-2 sm:gap-3 w-full text-left p-2 sm:p-3 hover:bg-gray-100 dark:hover:bg-[#1C2220] rounded-lg transition-colors dark:text-[#E0E6E4]"
                  >
                    <span className="text-base sm:text-lg">📞</span>
                    <span className="text-sm sm:text-base">Contact Us</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <button 
                    onClick={() => setShowCapabilitiesDropdown(!showCapabilitiesDropdown)}
                    className="flex items-center gap-2 sm:gap-3 w-full text-left p-2 sm:p-3 hover:bg-gray-100 dark:hover:bg-[#1C2220] rounded-lg transition-colors dark:text-[#E0E6E4]"
                  >
                    <span className="text-base sm:text-lg">💡</span>
                    <span className="text-sm sm:text-base">Our Capabilities, Solutions, & Accelerators</span>
                    <svg 
                      className={`w-4 h-4 ml-auto transition-transform ${showCapabilitiesDropdown ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showCapabilitiesDropdown && (
                    <div className="pl-8 sm:pl-10 space-y-1 sm:space-y-2">
                      <button 
                        onClick={() => {
                          setShowInsightsModal(true);
                          setIsMobileSidebarOpen(false);
                        }}
                        className="block w-full text-left text-gray-600 hover:text-blue-600 transition-colors p-1.5 sm:p-2 rounded text-xs sm:text-sm"
                      >
                        Insights Generators (domain-specific)
                      </button>
                      <button 
                        onClick={() => {
                          setShowAIOTModal(true);
                          setIsMobileSidebarOpen(false);
                        }}
                        className="block w-full text-left text-gray-600 hover:text-blue-600 transition-colors p-1.5 sm:p-2 rounded text-xs sm:text-sm"
                      >
                        AIOT Platform & Solutions
                      </button>
                      <button 
                        onClick={() => {
                          setShowOperationsModal(true);
                          setIsMobileSidebarOpen(false);
                        }}
                        className="block w-full text-left text-gray-600 hover:text-blue-600 transition-colors p-1.5 sm:p-2 rounded text-xs sm:text-sm"
                      >
                        Operations Virtualization & Optimization
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <button 
                    onClick={() => {
                      setShowApproachModal(true);
                      setIsMobileSidebarOpen(false);
                    }}
                    className="flex items-center gap-2 sm:gap-3 w-full text-left p-2 sm:p-3 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span className="text-base sm:text-lg">⚡</span>
                    <span className="text-sm sm:text-base">Our Approach To Accelerate Value Creation</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <button 
                    onClick={() => {
                      setShowValueServicesModal(true);
                      setIsMobileSidebarOpen(false);
                    }}
                    className="flex items-center gap-2 sm:gap-3 w-full text-left p-2 sm:p-3 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span className="text-base sm:text-lg">🎯</span>
                    <span className="text-sm sm:text-base">Our Value Identification To Realization Services</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <button 
                    onClick={() => {
                      setShowWhyUsModal(true);
                      setIsMobileSidebarOpen(false);
                    }}
                    className="flex items-center gap-2 sm:gap-3 w-full text-left p-2 sm:p-3 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span className="text-base sm:text-lg">🌟</span>
                    <span className="text-sm sm:text-base">Why Us - GetDeep.AI</span>
                  </button>
                </div>

                {/* Chat History Section */}
                <div className="space-y-2 border-t pt-4">
                  <button 
                    onClick={() => setShowChatHistoryDropdown(!showChatHistoryDropdown)}
                    className="flex items-center gap-2 sm:gap-3 w-full text-left p-2 sm:p-3 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span className="text-base sm:text-lg">💬</span>
                    <span className="text-sm sm:text-base">Chat History</span>
                    <svg 
                      className={`w-4 h-4 ml-auto transition-transform ${showChatHistoryDropdown ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showChatHistoryDropdown && (
                    <div className="pl-8 sm:pl-10 space-y-1 max-h-40 sm:max-h-48 overflow-y-auto">
                      {isLoadingChatHistory ? (
                        <div className="text-sm text-gray-500 p-2">Loading...</div>
                      ) : chatHistory.length > 0 ? (
                        chatHistory.map((session) => (
                          <button
                            key={session.session_id}
                            onClick={() => {
                              loadChatBatch(session.session_id);
                              setIsMobileSidebarOpen(false);
                            }}
                            className="block w-full text-left text-xs sm:text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors p-1.5 sm:p-2 rounded truncate"
                          >
                            {session.session_id}
                          </button>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 p-2">No chat history</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Report Sessions Section */}
                <div className="space-y-2 border-t pt-4">
                  <button 
                    onClick={() => setShowReportHistoryDropdown(!showReportHistoryDropdown)}
                    className="flex items-center gap-2 sm:gap-3 w-full text-left p-2 sm:p-3 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span className="text-base sm:text-lg">📊</span>
                    <span className="text-sm sm:text-base">Report Sessions</span>
                    <svg 
                      className={`w-4 h-4 ml-auto transition-transform ${showReportHistoryDropdown ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showReportHistoryDropdown && (
                    <div className="pl-8 sm:pl-10 space-y-1 max-h-40 sm:max-h-48 overflow-y-auto">
                      {isLoadingReportHistory ? (
                        <div className="text-sm text-gray-500 p-2">Loading...</div>
                      ) : reportChatHistory.length > 0 ? (
                        reportChatHistory.map((session) => (
                          <div
                            key={session.session_id}
                            className={`group flex items-center justify-between p-1.5 sm:p-2 rounded transition-colors ${
                              currentReportSessionId === session.session_id 
                                ? 'bg-blue-50 text-blue-700' 
                                : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <button
                              onClick={() => {
                                loadReportSession(session.session_id);
                                setIsMobileSidebarOpen(false);
                              }}
                              className="flex-1 min-w-0 text-left text-xs sm:text-sm truncate"
                            >
                              <div className="truncate">{session.session_id}</div>
                              <div className="text-xs text-gray-500">{session.message_count} messages</div>
                            </button>
                            <button
                              onClick={(e) => deleteReportSession(session.session_id, e)}
                              className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete Session"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 p-2">No report sessions</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Upgrade Section */}
                <div className="border-t pt-4">
                  <button 
                    onClick={() => {
                      setShowPricingModal(true);
                      setIsMobileSidebarOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all text-sm sm:text-base"
                  >
                    ⚡ Go Pro
                  </button>
                </div>

                {/* User Profile Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-[#144D37] rounded-full flex items-center justify-center text-white">
                      {(() => {
                        const userInfo = localStorage.getItem('user_info');
                        if (userInfo) {
                          try {
                            const user = JSON.parse(userInfo);
                            const firstName = user.first_name || '';
                            const lastName = user.last_name || '';
                            return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || 'U';
                          } catch (error) {
                            return 'U';
                          }
                        }
                        return 'U';
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {(() => {
                          const userInfo = localStorage.getItem('user_info');
                          if (userInfo) {
                            try {
                              const user = JSON.parse(userInfo);
                              return `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User';
                            } catch (error) {
                              return 'User';
                            }
                          }
                          return 'User';
                        })()}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {(() => {
                          const userInfo = localStorage.getItem('user_info');
                          if (userInfo) {
                            try {
                              const user = JSON.parse(userInfo);
                              return user.email || 'No email';
                            } catch (error) {
                              return 'No email';
                            }
                          }
                          return 'No email';
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 space-y-1">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setIsMobileSidebarOpen(false);
                      }}
                      className="block w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 rounded"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setIsMobileSidebarOpen(false);
                      }}
                      className="block w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 rounded"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="p-1.5 xm:p-2 xs:p-2.5 sm:p-3 md:p-4 lg:p-6 xl:p-8 mt-[40px] xm:mt-[45px] xs:mt-[50px] sm:mt-[60px]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 xm:gap-3 xs:gap-3 sm:gap-4 md:gap-5 lg:gap-5 xl:gap-6 items-stretch">
            {showValuationModal ? (
              <div className="lg:col-span-12">
                <ValuationPage
                  onClose={() => {
                    setShowValuationModal(false);
                    setIsChatbotMinimized(false);
                  }}
                  initialCompany={searchValue}
                  onCompanyChange={(company) => setSearchValue(company)}
                />
              </div>
            ) : (
              <>
                {/* Chart Section - full width on mobile */}
                {!isPerformanceMinimized && (
                  <div className={`${isChatbotMinimized ? 'lg:col-span-12' : 'lg:col-span-7'} transition-all duration-300 flex flex-col`}>
                  <div className="bg-white dark:bg-[#161C1A] rounded-lg p-2 xm:p-3 xs:p-3.5 sm:p-4 md:p-5 lg:p-5 xl:p-6 shadow-sm flex-1 flex flex-col" ref={performanceCardRef} id="bp-print-area">

                {/* Business Performance Tabs */}
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => {
                      setActivePerformanceTab('top-picks');
                      setIsChatbotMinimized(false);
                      setIsPerformanceMinimized(false); // Reset minimized state when clicking tab
                    }}
                    onDoubleClick={() => {
                      setActivePerformanceTab('top-picks');
                      setIsChatbotMinimized(true);
                      setIsPerformanceMinimized(false); // Reset minimized state on double click
                    }}
                    className={`px-2 py-1.5 xm:px-2.5 xm:py-1.5 xs:px-3 xs:py-2 sm:px-3 sm:py-2 md:px-3.5 md:py-2 lg:px-3.5 lg:py-2 xl:px-4 xl:py-2 text-xs xm:text-xs xs:text-sm sm:text-sm md:text-base lg:text-base xl:text-base rounded transition-colors ${
                      activePerformanceTab === 'top-picks'
                        ? 'bg-[#144D37] text-white'
                        : 'bg-gray-100 dark:bg-[#1C2220] text-gray-700 dark:text-[#E0E6E4] hover:bg-gray-200 dark:hover:bg-[#161C1A]'
                    }`}
                  >
                    Top Picks
                  </button>
                  <button
                    onClick={() => {
                      setActivePerformanceTab('performance');
                      setIsChatbotMinimized(false); // Default to split view on single click
                      setIsPerformanceMinimized(false); // Reset minimized state when clicking tab
                    }}
                    onDoubleClick={() => {
                      setActivePerformanceTab('performance');
                      setIsChatbotMinimized(true); // Expand on double click
                      setIsPerformanceMinimized(false); // Reset minimized state on double click
                    }}
                    className={`px-2 py-1.5 xm:px-2.5 xm:py-1.5 xs:px-3 xs:py-2 sm:px-3 sm:py-2 md:px-3.5 md:py-2 lg:px-3.5 lg:py-2 xl:px-4 xl:py-2 text-xs xm:text-xs xs:text-sm sm:text-sm md:text-base lg:text-base xl:text-base rounded transition-colors ${
                      activePerformanceTab === 'performance'
                        ? 'bg-[#144D37] text-white'
                        : 'bg-gray-100 dark:bg-[#1C2220] text-gray-700 dark:text-[#E0E6E4] hover:bg-gray-200 dark:hover:bg-[#161C1A]'
                    }`}
                  >
                    Performance
                  </button>
                  <button
                    onClick={() => {
                      setShowValuationModal(true);
                      setIsChatbotMinimized(true); // full-width like Performance double-click
                    }}
                    className="px-2 py-1.5 xm:px-2.5 xm:py-1.5 xs:px-3 xs:py-2 sm:px-3 sm:py-2 md:px-3.5 md:py-2 lg:px-3.5 lg:py-2 xl:px-4 xl:py-2 text-xs xm:text-xs xs:text-sm sm:text-sm md:text-base lg:text-base xl:text-base rounded transition-colors bg-gray-100 dark:bg-[#1C2220] text-gray-700 dark:text-[#E0E6E4] hover:bg-gray-200 dark:hover:bg-[#161C1A]"
                  >
                    Valuation Model
                  </button>
                </div>

                {/* Chart Header with Save Button - Only show when not on Top Picks tab */}
                {activePerformanceTab !== 'top-picks' && (
                  <div className="flex justify-between items-center mb-2 xm:mb-3 xs:mb-3.5 sm:mb-4 md:mb-5 lg:mb-5 xl:mb-6">
                    <h2 className="text-sm xm:text-base xs:text-lg sm:text-lg md:text-xl lg:text-xl xl:text-2xl font-medium">Business Performance</h2>
                    <button 
                      onClick={saveChart}
                      disabled={isSaving || (
                        (activeChart === 'metrics' && (!searchValue || selectedSearchMetrics.length === 0)) ||
                        (activeChart === 'peers' && (selectedCompanies.length === 0 || !selectedPeerMetric)) ||
                        (activeChart === 'industry' && (!selectedIndustry || selectedIndustryMetrics.length === 0))
                      )}
                      className={`px-2 py-1.5 xm:px-2.5 xm:py-1.5 xs:px-3 xs:py-2 sm:px-3 sm:py-2 md:px-3.5 md:py-2 lg:px-3.5 lg:py-2 xl:px-4 xl:py-2 text-xs xm:text-xs xs:text-sm sm:text-sm md:text-base lg:text-base xl:text-base rounded transition-colors ${
                        isSaving 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-[#144D37] text-white hover:bg-[#0F3A28]'
                      }`}
                      title={
                        isSaving 
                          ? 'Saving...' 
                          : 'Save current chart configuration and data'
                      }
                      data-ignore-pdf
                    >
                      {isSaving ? 'Saving...' : 'Save chart'}
                    </button>
                  </div>
                )}

        {/* Company Search & Metrics Selector - ONLY show when Performance tab is active */}
        {activePerformanceTab === 'performance' && (
          <>
            {/* Company Search */}
            <div className="mb-4">
              <div className="text-sm xl:text-base text-gray-500">Company</div>
              {activeChart === 'peers' ? (
                <div className="relative" ref={companyDropdownRef}>
                  {/* ... existing company dropdown code ... */}
                  <div className="flex flex-wrap gap-2 p-2 border border-gray-200 dark:border-[#161C1A] rounded min-h-[42px] bg-white dark:bg-[#1C2220]">
                    {selectedCompanies.map((company, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-[#161C1A] dark:text-[#E0E6E4] rounded text-sm"
                      >
                        {company.name || company.ticker}
                        <button
                          onClick={() => setSelectedCompanies(companies => 
                            companies.filter((_, i) => i !== index)
                          )}
                          className="text-gray-400 hover:text-gray-600 dark:text-[#889691] dark:hover:text-[#E0E6E4]"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <input
                      type="text"
                      value={companyInput}
                      onChange={(e) => setCompanyInput(e.target.value)}
                      onFocus={() => setShowCompanyDropdown(true)}
                      placeholder="Search companies..."
                      className="flex-1 min-w-[100px] outline-none text-sm bg-transparent dark:text-[#E0E6E4] dark:placeholder-[#889691]"
                    />
                  </div>
                  
                  {showCompanyDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#161C1A] border border-gray-200 dark:border-[#161C1A] rounded shadow-lg max-h-60 overflow-auto">
                      {companiesLoading ? (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-[#889691]">Loading companies...</div>
                      ) : availableCompanies.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-[#889691]">No companies available</div>
                      ) : (
                        availableCompanies
                        .filter(company => 
                          !selectedCompanies.some(c => c.ticker === company.ticker) &&
                          (company.ticker.toLowerCase().includes(companyInput.toLowerCase()) || 
                           company.name.toLowerCase().includes(companyInput.toLowerCase()))
                        )
                        .map(company => (
                          <div
                            key={company.ticker}
                              onClick={() => {
                              if (!selectedCompanies.some(c => c.ticker === company.ticker)) {
                                setSelectedCompanies([...selectedCompanies, company]);
                                }
                                setCompanyInput('');
                                setShowCompanyDropdown(false);
                              }}
                            className="px-3 py-1 text-sm xl:text-base hover:bg-gray-100 dark:hover:bg-[#1C2220] dark:text-[#E0E6E4] cursor-pointer"
                            >
                            {company.name} ({company.ticker})
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </div>
              ) : activeChart === 'industry' ? (
                <div className="relative" ref={companyDropdownRef}>
                  <input
                    type="text"
                    placeholder="Search companies..."
                    value={selectedTicker || companySearch}
                    onChange={(e) => {
                      setCompanySearch(e.target.value);
                      setSelectedTicker(''); // Clear selection when typing
                      setSelectedIndustry('');
                      setIndustrySearch('');
                    }}
                    onFocus={() => setShowCompanyDropdown(true)}
                    className="w-full font-medium text-sm xl:text-base px-3 py-1 pr-8 border border-gray-200 dark:border-[#161C1A] rounded focus:outline-none focus:border-[#1B5A7D] focus:ring-1 focus:ring-[#1B5A7D] bg-white dark:bg-[#1C2220] dark:text-[#E0E6E4] dark:placeholder-[#889691]"
                  />
                  {selectedTicker && (
                    <button
                      onClick={() => {
                        setSelectedTicker('');
                        setCompanySearch('');
                        setSelectedIndustry('');
                        setIndustrySearch('');
                      }}
                      className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-[#E0E6E4]"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  
                  {showCompanyDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#161C1A] border border-gray-200 dark:border-[#161C1A] rounded shadow-lg max-h-60 overflow-auto">
                      {companiesLoading ? (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-[#889691]">Loading companies...</div>
                      ) : availableCompanies.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-[#889691]">No companies available</div>
                      ) : (
                        availableCompanies
                        .filter(company => 
                          company.ticker.toLowerCase().includes(companySearch.toLowerCase()) ||
                          company.name.toLowerCase().includes(companySearch.toLowerCase())
                        )
                        .map(company => (
                          <div
                            key={company.ticker}
                              onClick={() => {
                              setSelectedTicker(company.ticker);
                                setCompanySearch('');
                                setShowCompanyDropdown(false);
                                
                                // Auto-select industry based on company
                                const companyIndustry = [...HARDCODED_INDUSTRIES, ...availableIndustries].find(industry => {
                                  return industry.companies?.some(c => 
                                    (typeof c === 'string' ? c : (c as any).ticker) === company.ticker
                                  );
                                });

                                if (companyIndustry) {
                                  const industryId = 'id' in companyIndustry ? companyIndustry.id : (companyIndustry as any).value;
                                  const industryName = 'name' in companyIndustry ? companyIndustry.name : (companyIndustry as any).label;
                                  setSelectedIndustry(industryId);
                                  setIndustrySearch(industryName);
                                }
                              }}
                            className="px-3 py-1 text-sm xl:text-base hover:bg-gray-100 dark:hover:bg-[#1C2220] dark:text-[#E0E6E4] cursor-pointer"
                            >
                            {company.name} ({company.ticker})
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative" ref={companyDropdownRef}>
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onFocus={() => setShowCompanyDropdown(true)}
                    placeholder="Search company..."
                    className="w-full font-medium text-sm xl:text-base px-3 py-1 pr-8 border border-gray-200 dark:border-[#161C1A] rounded focus:outline-none focus:border-[#1B5A7D] focus:ring-1 focus:ring-[#1B5A7D] bg-white dark:bg-[#1C2220] dark:text-[#E0E6E4] dark:placeholder-[#889691]"
                  />
                  {searchValue && (
                    <button
                      onClick={() => setSearchValue('')}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-[#E0E6E4]"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {showCompanyDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#161C1A] border border-gray-200 dark:border-[#161C1A] rounded shadow-lg max-h-60 overflow-auto">
                      {companiesLoading ? (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-[#889691]">Loading companies...</div>
                      ) : availableCompanies.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-[#889691]">No companies available</div>
                      ) : (
                        availableCompanies
                        .filter(company => 
                          company.ticker.toLowerCase().includes(searchValue.toLowerCase()) ||
                          company.name.toLowerCase().includes(searchValue.toLowerCase())
                        )
                        .map(company => (
                          <div
                            key={company.ticker}
                              onClick={() => {
                              setSearchValue(company.ticker);
                                setShowCompanyDropdown(false);
                              }}
                            className="px-3 py-1 text-sm xl:text-base hover:bg-gray-100 dark:hover:bg-[#1C2220] dark:text-[#E0E6E4] cursor-pointer"
                            >
                            {company.name} ({company.ticker})
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Metrics Selector */}
            <div className="-mx-1 xm:-mx-1.5 xs:-mx-2 sm:-mx-4 md:mx-0">
              {/* ... existing metrics selector code ... */}
              <div className="space-y-1 xm:space-y-1.5 xs:space-y-2 sm:space-y-2 md:space-y-2.5 lg:space-y-2.5 xl:space-y-3 px-1 xm:px-1.5 xs:px-2 sm:px-4 md:px-0">
                 {/* Across tabs - NO scrolling, stays fixed */}
                 <div className="flex gap-1 xm:gap-1.5 xs:gap-2 sm:gap-2 md:gap-2.5 lg:gap-2.5 xl:gap-3">
                  <button 
                    onClick={() => setActiveChart('valuation')}
                     className={`px-2 py-1 xm:px-2.5 xm:py-1 xs:px-2.5 xs:py-1 sm:px-3 sm:py-1 md:px-3 md:py-1 lg:px-3 lg:py-1 xl:px-3 xl:py-1 text-xs xm:text-xs xs:text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm rounded transition-colors ${
                      activeChart === 'valuation' ? 'bg-[#E5F0F6] dark:bg-[#144D37]/30 text-[#1B5A7D] dark:text-[#144D37]' : 'text-gray-600 dark:text-[#889691] hover:text-gray-900 dark:hover:text-[#E0E6E4]'
                    }`}
                  >
                    Valuation
                  </button>
                  <button 
                    onClick={() => setActiveChart('metrics')}
                     className={`px-2 py-1 xm:px-2.5 xm:py-1 xs:px-2.5 xs:py-1 sm:px-3 sm:py-1 md:px-3 md:py-1 lg:px-3 lg:py-1 xl:px-3 xl:py-1 text-xs xm:text-xs xs:text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm rounded transition-colors ${
                      activeChart === 'metrics' ? 'bg-[#E5F0F6] dark:bg-[#144D37]/30 text-[#1B5A7D] dark:text-[#144D37]' : 'text-gray-600 dark:text-[#889691] hover:text-gray-900 dark:hover:text-[#E0E6E4]'
                    }`}
                  >
                    Across Metrics
                  </button>
                  <button 
                    onClick={() => setActiveChart('peers')}
                     className={`px-2 py-1 xm:px-2.5 xm:py-1 xs:px-2.5 xs:py-1 sm:px-3 sm:py-1 md:px-3 md:py-1 lg:px-3 lg:py-1 xl:px-3 xl:py-1 text-xs xm:text-xs xs:text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm transition-colors rounded ${
                      activeChart === 'peers' ? 'bg-[#E5F0F6] dark:bg-[#144D37]/30 text-[#1B5A7D] dark:text-[#144D37]' : 'text-gray-600 dark:text-[#889691] hover:text-gray-900 dark:hover:text-[#E0E6E4]'
                    }`}
                  >
                    Across Peers
                  </button>
                  <button 
                    onClick={() => setActiveChart('industry')}
                     className={`px-2 py-1 xm:px-2.5 xm:py-1 xs:px-2.5 xs:py-1 sm:px-3 sm:py-1 md:px-3 md:py-1 lg:px-3 lg:py-1 xl:px-3 xl:py-1 text-xs xm:text-xs xs:text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm transition-colors rounded ${
                      activeChart === 'industry' ? 'bg-[#E5F0F6] dark:bg-[#144D37]/30 text-[#1B5A7D] dark:text-[#144D37]' : 'text-gray-600 dark:text-[#889691] hover:text-gray-900 dark:hover:text-[#E0E6E4]'
                    }`}
                  >
                    Across Industry
                  </button>
                </div>
                 
                 {/* Period buttons - conditionally scrollable */}
                {activeChart === 'industry' ? (
                  <div className="overflow-x-auto -mx-1 px-1">
                    <div className="flex gap-1 xm:gap-1.5 xs:gap-2 sm:gap-2 md:gap-2.5 lg:gap-2.5 xl:gap-3 min-w-max">
                          <button 
                      onClick={() => setSelectedPeriod('Last 1Y AVG')}
                      className={`flex-1 px-2 py-2 rounded text-xs transition-colors ${
                        selectedPeriod === 'Last 1Y AVG' 
                                ? 'bg-[#E5F0F6] dark:bg-[#144D37]/30 text-[#1B5A7D] dark:text-[#144D37]' 
                                : 'text-gray-600 dark:text-[#889691] hover:text-gray-900 dark:hover:text-[#E0E6E4]'
                            }`}
                          >
                      Last 1Y AVG
                          </button>
                          <button 
                      onClick={() => setSelectedPeriod('Last 2Y AVG')}
                      className={`flex-1 px-2 py-2 rounded text-xs transition-colors ${
                        selectedPeriod === 'Last 2Y AVG' 
                                ? 'bg-[#E5F0F6] dark:bg-[#144D37]/30 text-[#1B5A7D] dark:text-[#144D37]' 
                                : 'text-gray-600 dark:text-[#889691] hover:text-gray-900 dark:hover:text-[#E0E6E4]'
                            }`}
                          >
                      Last 2Y AVG
                          </button>
                          <button 
                      onClick={() => setSelectedPeriod('Last 3Y AVG')}
                      className={`flex-1 px-2 py-2 rounded text-xs transition-colors ${
                        selectedPeriod === 'Last 3Y AVG' 
                                ? 'bg-[#E5F0F6] dark:bg-[#144D37]/30 text-[#1B5A7D] dark:text-[#144D37]' 
                                : 'text-gray-600 dark:text-[#889691] hover:text-gray-900 dark:hover:text-[#E0E6E4]'
                            }`}
                          >
                      Last 3Y AVG
                          </button>
                          <button 
                      onClick={() => setSelectedPeriod('Last 4Y AVG')}
                      className={`flex-1 px-2 py-2 rounded text-xs transition-colors ${
                        selectedPeriod === 'Last 4Y AVG' 
                                ? 'bg-[#E5F0F6] dark:bg-[#144D37]/30 text-[#1B5A7D] dark:text-[#144D37]' 
                                : 'text-gray-600 dark:text-[#889691] hover:text-gray-900 dark:hover:text-[#E0E6E4]'
                            }`}
                          >
                      Last 4Y AVG
                          </button>
                          <button 
                      onClick={() => setSelectedPeriod('Last 5Y AVG')}
                      className={`flex-1 px-2 py-2 rounded text-xs transition-colors ${
                        selectedPeriod === 'Last 5Y AVG' 
                                ? 'bg-[#E5F0F6] dark:bg-[#144D37]/30 text-[#1B5A7D] dark:text-[#144D37]' 
                                : 'text-gray-600 dark:text-[#889691] hover:text-gray-900 dark:hover:text-[#E0E6E4]'
                            }`}
                          >
                      Last 5Y AVG
                          </button>
                          <button 
                      onClick={() => setSelectedPeriod('Last 10Y AVG')}
                      className={`flex-1 px-2 py-2 rounded text-xs transition-colors ${
                        selectedPeriod === 'Last 10Y AVG' 
                                ? 'bg-[#E5F0F6] dark:bg-[#144D37]/30 text-[#1B5A7D] dark:text-[#144D37]' 
                                : 'text-gray-600 dark:text-[#889691] hover:text-gray-900 dark:hover:text-[#E0E6E4]'
                            }`}
                          >
                      Last 10Y AVG
                          </button>
                          <button 
                      onClick={() => setSelectedPeriod('Last 15Y AVG')}
                      className={`flex-1 px-2 py-2 rounded text-xs transition-colors ${
                        selectedPeriod === 'Last 15Y AVG' 
                                ? 'bg-[#E5F0F6] dark:bg-[#144D37]/30 text-[#1B5A7D] dark:text-[#144D37]' 
                                : 'text-gray-600 dark:text-[#889691] hover:text-gray-900 dark:hover:text-[#E0E6E4]'
                            }`}
                          >
                      Last 15Y AVG
                          </button>
                    </div>
                  </div>
                ) : activeChart === 'valuation' ? null : (
                  <div className="flex gap-1 xm:gap-1.5 xs:gap-2 sm:gap-2 md:gap-2.5 lg:gap-2.5 xl:gap-3">
                          <button 
                      onClick={() => setSelectedPeriod('Annual')}
                       className={`flex-1 px-4 py-2 rounded text-sm transition-colors ${
                        selectedPeriod === 'Annual' 
                                ? 'bg-[#E5F0F6] dark:bg-[#144D37]/30 text-[#1B5A7D] dark:text-[#144D37]' 
                                : 'text-gray-600 dark:text-[#889691] hover:text-gray-900 dark:hover:text-[#E0E6E4]'
                            }`}
                          >
                      Annual
                    </button>
                    <button 
                      onClick={() => setSelectedPeriod('Average')}
                       className={`flex-1 px-4 py-2 rounded text-sm transition-colors ${
                        selectedPeriod === 'Average' 
                          ? 'bg-[#E5F0F6] dark:bg-[#144D37]/30 text-[#1B5A7D] dark:text-[#144D37]' 
                          : 'text-gray-600 dark:text-[#889691] hover:text-gray-900 dark:hover:text-[#E0E6E4]'
                      }`}
                    >
                      Average
                    </button>
                    <button 
                      onClick={() => setSelectedPeriod('CAGR')}
                       className={`flex-1 px-4 py-2 rounded text-sm transition-colors ${
                        selectedPeriod === 'CAGR' 
                          ? 'bg-[#E5F0F6] dark:bg-[#144D37]/30 text-[#1B5A7D] dark:text-[#144D37]' 
                          : 'text-gray-600 dark:text-[#889691] hover:text-gray-900 dark:hover:text-[#E0E6E4]'
                      }`}
                    >
                      CAGR
                          </button>
                        </div>
                )}
              </div>
            </div>
          </>
        )}

                {/* Chart Content */}
                <div className="mt-4 xl:mt-6">
                  <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-1 gap-2 sm:gap-3 xl:gap-4 mb-3 sm:mb-4">
            {/* Industry selection - restored */}
            {activeChart === 'industry' && (
              <div>
                <div className="text-sm xl:text-base text-gray-500 dark:text-[#889691]">Industry</div>
                <div className="relative" ref={industryDropdownRef}>
                  <input
                    type="text"
                    placeholder="Select Industry..."
                    value={selectedIndustry || industrySearch}
                    onChange={(e) => {
                      setIndustrySearch(e.target.value);
                      if (e.target.value === '') {
                        setSelectedIndustry('');
                      }
                      setShowIndustryDropdown(true);
                    }}
                    onFocus={() => {
                        setShowIndustryDropdown(true);
                    }}
                    className="w-full font-medium text-sm xl:text-base px-3 py-1 pr-8 border border-gray-200 dark:border-[#161C1A] rounded bg-white dark:bg-[#1C2220] text-gray-900 dark:text-[#E0E6E4] placeholder-gray-400 dark:placeholder-[#889691] focus:outline-none focus:border-[#1B5A7D] focus:ring-1 focus:ring-[#1B5A7D]"
                  />
                  {(selectedIndustry || industrySearch) && (
                    <button
                      onClick={() => {
                        setSelectedIndustry('');
                        setIndustrySearch('');
                        setShowIndustryDropdown(false);
                      }}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#889691] hover:text-gray-600 dark:hover:text-[#E0E6E4]"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400 dark:text-[#889691]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  
                  {showIndustryDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#161C1A] border border-gray-200 dark:border-[#161C1A] rounded shadow-lg max-h-60 overflow-auto">
                      {availableIndustries.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-[#889691]">No industries available</div>
                      ) : (
                        availableIndustries
                          .filter(ind => 
                            !industrySearch || 
                            (selectedIndustry && ind.label === selectedIndustry) || 
                            ind.label.toLowerCase().includes(industrySearch.toLowerCase())
                          )
                          .map(ind => (
                            <div
                              key={ind.value}
                              onClick={() => {
                                console.log('Selected industry:', ind.value, ind.label);
                                setSelectedIndustry(ind.label); // Use label (e.g. "Discount Stores") not value if they differ
                                setIndustrySearch(ind.label);
                                setShowIndustryDropdown(false);
                              }}
                              className="px-3 py-1 text-sm xl:text-base text-gray-900 dark:text-[#E0E6E4] hover:bg-gray-100 dark:hover:bg-[#1C2220] cursor-pointer"
                            >
                              {ind.label}
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}


            {/* Metric Search */}
            {activePerformanceTab === 'performance' && activeChart !== 'valuation' && (
            <div>
              <div className="text-sm xl:text-base text-gray-500">Metric</div>
              {activeChart === 'peers' ? (
                <div className="relative" ref={peerDropdownRef}>
                  {/* Unified input with inline chips */}
                  <div className="relative border border-gray-200 dark:border-[#161C1A] rounded p-2 min-h-[42px] flex flex-wrap gap-2 focus-within:border-[#1B5A7D] focus-within:ring-1 focus-within:ring-[#1B5A7D] bg-white dark:bg-[#1C2220]">
                    {/* Selected metrics as chips */}
                    {selectedPeerMetrics.map((metric, index) => {
                      const metricLabel = availableMetrics.find(m => m.value === metric)?.label || metric;
                      return (
                        <div 
                          key={index} 
                          className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-[#161C1A] dark:text-[#E0E6E4] rounded text-sm"
                        >
                          {metricLabel}
                    <button
                      onClick={() => {
                              setSelectedPeerMetrics(metrics => metrics.filter((_, i) => i !== index));
                        setSelectedPeerMetric('');
                      }}
                            className="text-gray-400 hover:text-gray-600 dark:text-[#889691] dark:hover:text-[#E0E6E4]"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                      </svg>
                    </button>
                        </div>
                      );
                    })}
                    
                    {/* Search input */}
                    <input
                      type="text"
                      placeholder={selectedPeerMetrics.length === 0 ? "Search metrics..." : ""}
                      value={peerMetricSearch}
                      onChange={(e) => setPeerMetricSearch(e.target.value)}
                      onFocus={() => setShowPeerMetricDropdown(true)}
                      className="flex-1 min-w-[120px] outline-none font-medium text-sm xl:text-base bg-transparent dark:text-white dark:placeholder-gray-400"
                    />
                    
                    {/* Dropdown chevron */}
                    <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    </div>
                  </div>
                  
                  {/* Dropdown menu */}
                  {showPeerMetricDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#161C1A] border border-gray-200 dark:border-[#161C1A] rounded shadow-lg max-h-60 overflow-auto">
                      {availableMetrics
                        .filter(metric => 
                          !selectedPeerMetrics.includes(metric.value) &&
                          (metric.label.toLowerCase().includes(peerMetricSearch.toLowerCase()) ||
                          metric.value.toLowerCase().includes(peerMetricSearch.toLowerCase()))
                        )
                        .map(metric => (
                          <div
                            key={metric.value}
                            onClick={() => {
                              if (!selectedPeerMetrics.includes(metric.value)) {
                                setSelectedPeerMetrics([...selectedPeerMetrics, metric.value]);
                              setSelectedPeerMetric(metric.value);
                              }
                              setPeerMetricSearch('');
                              setShowPeerMetricDropdown(false);
                            }}
                            className="px-3 py-1 text-sm xl:text-base hover:bg-gray-100 dark:hover:bg-[#1C2220] dark:text-[#E0E6E4] cursor-pointer"
                          >
                        {metric.label}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : activeChart === 'metrics' ? (
                <div className="relative" ref={dropdownRef}>
                  {/* Unified input with inline chips */}
                  <div className="relative border border-gray-200 dark:border-[#161C1A] rounded p-2 min-h-[42px] flex flex-wrap gap-2 focus-within:border-[#1B5A7D] focus-within:ring-1 focus-within:ring-[#1B5A7D] bg-white dark:bg-[#1C2220]">
                    {/* Selected metrics as chips */}
                    {selectedSearchMetrics.map((metric, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-[#161C1A] dark:text-[#E0E6E4] rounded text-sm"
                      >
                        {metric}
                        <button
                          onClick={() => setSelectedSearchMetrics(metrics => 
                            metrics.filter((_, i) => i !== index)
                          )}
                          className="text-gray-400 hover:text-gray-600 dark:text-[#889691] dark:hover:text-[#E0E6E4]"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}

                    {/* Search input */}
                    <input
                      type="text"
                      placeholder={selectedSearchMetrics.length === 0 ? "Search metrics..." : ""}
                      value={searchMetricInput}
                      onChange={(e) => setSearchMetricInput(e.target.value)}
                      onFocus={() => setShowMetricDropdown(true)}
                      className="flex-1 min-w-[120px] outline-none font-medium text-sm xl:text-base bg-transparent dark:text-white dark:placeholder-gray-400"
                    />
                    
                    {/* Dropdown chevron */}
                    <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    </div>

                  {/* Dropdown menu */}
                    {showMetricDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#161C1A] border border-gray-200 dark:border-[#161C1A] rounded shadow-lg max-h-60 overflow-auto">
                        {availableMetrics
                          .filter(metric => 
                            !selectedSearchMetrics.includes(metric.value) &&
                            (metric.label.toLowerCase().includes(searchMetricInput.toLowerCase()) ||
                            metric.value.toLowerCase().includes(searchMetricInput.toLowerCase()))
                          )
                          .map(metric => (
                            <div
                              key={metric.value}
                              onClick={() => {
                                if (!selectedSearchMetrics.includes(metric.value)) {
                                  setSelectedSearchMetrics([...selectedSearchMetrics, metric.value]);
                                }
                                setSearchMetricInput('');
                                setShowMetricDropdown(false);
                              }}
                            className="px-3 py-1 text-sm xl:text-base hover:bg-gray-100 dark:hover:bg-[#1C2220] dark:text-[#E0E6E4] cursor-pointer"
                            >
                            {metric.label}
                            </div>
                          ))}
                      </div>
                    )}
                </div>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  {/* Unified input with inline chips */}
                  <div className={`relative border border-gray-200 dark:border-[#161C1A] rounded p-2 min-h-[42px] flex flex-wrap gap-2 focus-within:border-[#1B5A7D] focus-within:ring-1 focus-within:ring-[#1B5A7D] ${selectedIndustryMetrics.length >= 3 ? 'bg-gray-50 dark:bg-[#161C1A]' : 'bg-white dark:bg-[#1C2220]'}`}>
                  {/* Selected metrics as chips */}
                    {selectedIndustryMetrics.map((metric, index) => {
                      const metricLabel = availableMetrics.find(m => m.value === metric)?.label || metric;
                      return (
                        <div 
                          key={index} 
                          className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-[#161C1A] dark:text-[#E0E6E4] rounded text-sm"
                        >
                          {metricLabel}
                          <button
                            onClick={() => setSelectedIndustryMetrics(metrics => 
                              metrics.filter((_, i) => i !== index)
                            )}
                            className="text-gray-400 hover:text-gray-600 dark:text-[#889691] dark:hover:text-[#E0E6E4]"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  
                    {/* Search input */}
                    <input
                      type="text"
                      placeholder={selectedIndustryMetrics.length === 0 ? "Search metrics..." : ""}
                      value={industryMetricInput}
                      onChange={(e) => setIndustryMetricInput(e.target.value)}
                      onFocus={() => setShowMetricDropdown(true)}
                      className={`flex-1 min-w-[120px] outline-none font-medium text-sm xl:text-base bg-transparent dark:text-[#E0E6E4] dark:placeholder-[#889691] ${selectedIndustryMetrics.length >= 3 ? 'bg-gray-50 dark:bg-[#161C1A] cursor-not-allowed' : ''}`}
                      disabled={selectedIndustryMetrics.length >= 3}
                    />
                    
                    {/* Dropdown chevron */}
                    <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    </div>
                    
                  {/* Dropdown menu */}
                    {showMetricDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#161C1A] border border-gray-200 dark:border-[#161C1A] rounded shadow-lg max-h-60 overflow-auto">
                        {availableMetrics
                          .filter(metric => 
                            !selectedIndustryMetrics.includes(metric.value) &&
                            (metric.label.toLowerCase().includes(industryMetricInput.toLowerCase()) ||
                            metric.value.toLowerCase().includes(industryMetricInput.toLowerCase()))
                          )
                          .map(metric => (
                            <div
                              key={metric.value}
                              onClick={() => {
                              if (selectedIndustryMetrics.length < 3 && !selectedIndustryMetrics.includes(metric.value)) {
                                setSelectedIndustryMetrics([...selectedIndustryMetrics, metric.value]);
                              }
                                setIndustryMetricInput('');
                                setShowMetricDropdown(false);
                              }}
                            className={`px-3 py-1 text-sm xl:text-base cursor-pointer ${
                                selectedIndustryMetrics.length >= 3 
                                  ? 'bg-gray-50 dark:bg-[#161C1A] text-gray-400 cursor-not-allowed' 
                                  : 'hover:bg-gray-100 dark:hover:bg-[#1C2220] dark:text-[#E0E6E4]'
                              }`}
                            >
                              {metric.label}
                            </div>
                          ))}
                      </div>
                    )}
                </div>
              )}
            </div>
            )}
          </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-4 xl:p-6 space-y-3 sm:space-y-4 bp-scroll">
          {activePerformanceTab === 'top-picks' ? (
            <TopPicks 
              companies={availableCompanies}
              industries={[...HARDCODED_INDUSTRIES, ...availableIndustries]}
              sectors={availableSectors}
            />
          ) : activeChart === 'metrics' ? (
                    // Metrics Chart
                    isLoading ? (
                      <div className="flex items-center justify-center h-full min-h-[400px]">
                        <span>Loading...</span>
                      </div>
                    ) : error ? (
                      <div className="flex items-center justify-center h-full min-h-[400px] text-red-500">
                        {error}
                      </div>
                    ) : chartData.length === 0 ? (
                      <div className="flex items-center justify-center h-full min-h-[400px] text-gray-500">
                        No data available
                      </div>
                    ) : ( 
                      <div ref={chartContainerRef} className="w-full min-h-[400px]" style={{ position: 'relative' }}>
                        <ResponsiveContainer width="100%" height={400}>
                          <LineChart 
                            data={chartData}
                            onMouseMove={e => {
                              if (e && e.activePayload && e.activePayload.length > 0) {
                                const payload = e.activePayload[0].payload;
                                const isFixedPoint = selectedPeriod === 'Annual' 
                                  ? payload.name?.startsWith('2024')
                                  : payload.name === chartData[chartData.length - 1]?.name;
                                
                                if (!isFixedPoint) {
                                  setActiveTooltip(payload);
                                } else {
                                  setActiveTooltip(null);
                                }
                              } else {
                                setActiveTooltip(null);
                              }
                            }}
                            onMouseLeave={() => setActiveTooltip(null)}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                            <XAxis 
                              dataKey="name" 
                              tickFormatter={(value) => {
                                if (typeof value === 'string' && value.includes('-')) {
                                  if (selectedPeriod !== 'Annual') {
                                    return value;
                                  }
                                  const [startYear] = value.split('-');
                                  return startYear;
                                }
                                return value;
                              }}
                            />
                            <YAxis 
                              tickFormatter={(value) => new Intl.NumberFormat('en-US', {
                                notation: 'compact',
                                maximumFractionDigits: 1
                              }).format(value)}
                            />
                             
                            {/* Regular hover tooltip */}
                            <Tooltip
                              formatter={((value: string | number, name: string) => {
                                // Split the name into metric and ticker
                                const [metric, ticker] = name.split('.');
                                const company = selectedCompanies.find(c => c.ticker === ticker);
                                const formattedValue =
                                  value !== null && value !== undefined
                                    ? new Intl.NumberFormat('en-US').format(Number(value))
                                    : "N/A";
                                const displayName = `${company?.name || ticker} - ${metric}`;
                                return [formattedValue, displayName];
                              }) as TooltipProps<string | number, string>['formatter']}
                              labelFormatter={(label) => {
                                if (typeof label === 'string' && label.includes('-')) {
                                  if (selectedPeriod !== 'Annual') {
                                    return label;
                                  }
                                  const [startYear] = label.split('-');
                                  return startYear;
                                }
                                return label;
                              }}
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length > 0) {
                                  const point = payload[0].payload;
                                  if ((selectedPeriod === 'Annual' && point.name?.startsWith('2024')) || 
                                      (selectedPeriod !== 'Annual' && point.name === chartData[chartData.length - 1]?.name)) {
                                    return null;
                                  }
                                  return (
                                    <div className="custom-tooltip bg-white p-2 border rounded shadow">
                                      <p className="label">{label}</p>
                                      {payload.map((entry: any) => (
                                        <p key={entry.name} style={{ color: entry.color }}>
                                          {entry.name}: {entry.value === null ? "N/A" : new Intl.NumberFormat('en-US', {
                                            notation: 'compact',
                                            maximumFractionDigits: 1
                                          }).format(entry.value)}
                                        </p>
                                      ))}
                                    </div>
                                  );
                                }
                                return null;
                              }}
                              contentStyle={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                              itemStyle={{ padding: 0 }}
                              filterNull={false}  // Changed to false to show null values
                            />

                            <Legend layout="horizontal" />
                            {selectedPeriod === 'Annual' ? (
                              // For Annual: Render historical and future series separately
                              selectedSearchMetrics.flatMap((metric, idx) => {
                                const baseColor = generateColorPalette(selectedSearchMetrics.length)[idx];
                                const metricLabel = availableMetrics.find(m => m.value === metric)?.label || metric;
                                
                                return [
                                  // Historical series (2011-2024)
                                  <Line
                                    key={`${metric}_historical`}
                                    type="monotone"
                                    dataKey={`${metric}_historical`}
                                    stroke={baseColor}
                                    name={`${metricLabel} (Historical)`}
                                    strokeWidth={2}
                                    dot={{
                                      fill: baseColor,
                                      r: 4
                                    }}
                                    connectNulls={false}
                                  />,
                                  // Future series (2025-2035)
                                  <Line
                                    key={`${metric}_future`}
                                    type="monotone"
                                    dataKey={`${metric}_future`}
                                    stroke={addOpacityToColor(baseColor, 0.5)}
                                    strokeDasharray="5 5"
                                    name={`${metricLabel} (Future)`}
                                    strokeWidth={2}
                                    dot={{
                                      fill: addOpacityToColor(baseColor, 0.5),
                                      r: 4
                                    }}
                                    connectNulls={false}
                                  />
                                ];
                              })
                            ) : (
                              // For Average and CAGR: Render single series per metric
                              selectedSearchMetrics.map((metric, idx) => {
                              const color = generateColorPalette(selectedSearchMetrics.length)[idx];
                              const metricLabel = availableMetrics.find(m => m.value === metric)?.label || metric;
                              return (
                                <Line
                                  key={metric}
                                  type="monotone"
                                  dataKey={metric}
                                  stroke={color}
                                  name={metricLabel}
                                  strokeWidth={2}
                                  dot={{
                                    fill: color,
                                    r: 4
                                  }}
                                    connectNulls={false}
                                />
                              );
                              })
                            )}
                          </LineChart>
                        </ResponsiveContainer>
                        
                        {/* Fixed tooltip positioned below legend inside chart */}
                        {selectedSearchMetrics.length > 0 && fixed2024Data && (
                          <div
                            className="fixed-tooltip absolute left-4 right-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-md p-2 text-xs shadow-sm"
                            style={{
                              bottom: `${-80 - Math.floor((selectedSearchMetrics.length - 1) / 3) * 25}px`
                            }}
                          >
                            <div className="font-medium text-gray-700 mb-1 text-xs">
                              {selectedPeriod === '1Y' ? '2024' : 
                               selectedPeriod === '2Y' ? '2023-24' :
                               selectedPeriod === '3Y' ? '2022-24' :
                               selectedPeriod === '4Y' ? '2021-24' :
                               selectedPeriod === '5Y' ? '2020-24' :
                               selectedPeriod === '10Y' ? '2015-24' :
                               selectedPeriod === '15Y' ? '2010-24' :
                               selectedPeriod === '20Y' ? '2005-24' :
                               fixed2024Data.name} Values
                            </div>
                            <div className="space-y-1">
                              {selectedSearchMetrics.map((metric, idx) => {
                              const value = fixed2024Data[metric];
                              const hoveredValue = (activeTooltip && activeTooltip[metric] != null)
                                ? Number(activeTooltip[metric])
                                : null;
                              const diff = value != null && hoveredValue != null ? value - hoveredValue : null;
                              const percent = (hoveredValue != null && hoveredValue !== 0 && diff != null)
                                ? (diff / hoveredValue) * 100
                                : null;
                              const isIncrease = percent != null && percent >= 0;
                                const color = generateColorPalette(selectedSearchMetrics.length)[idx];

                              return (
                                  <div key={metric} className="flex items-center text-xs">
                                    <div 
                                      className="w-2 h-2 rounded-full mr-2"
                                      style={{ backgroundColor: color }}
                                    ></div>
                                    <span style={{ color, minWidth: 60, display: 'inline-block' }}>
                                      {metric}:
                                  </span>
                                    <span className="ml-1">
                                    {value === null ? "N/A" : new Intl.NumberFormat('en-US', {
                                      notation: 'compact',
                                      maximumFractionDigits: 1
                                    }).format(value)}
                                  </span>
                                  {percent != null && (
                                    <span
                                        className={`ml-2 flex items-center font-semibold ${isIncrease ? 'text-green-600' : 'text-red-600'}`}
                                        style={{ minWidth: 40 }}
                                    >
                                      {isIncrease ? '▲' : '▼'}
                                      {Math.abs(percent).toFixed(1)}%
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                            </div>
                          </div>
                        )}

                      </div>
                    )
                  ) : activeChart === 'peers' ? (
                    // Peers Chart
                    peerLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <span>Loading...</span>
                      </div>
                    ) : peerError ? (
                      <div className="flex items-center justify-center h-full text-red-500">
                        {peerError}
                      </div>
                    ) : peerChartData.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        No data available
                      </div>
                    ) : (
                      <div ref={chartContainerRef} className="w-full min-h-[400px]" style={{ position: 'relative' }}>
                        <ResponsiveContainer width="100%" height={400}>
                          <LineChart 
                            data={peerChartData.filter(dataPoint => {
                              // Filter out dummy data points based on selected period
                              if (selectedPeriod === '2Y') {
                                // Only keep valid 2Y periods
                                return ['2005-06', '2007-08', '2009-10', '2011-12', '2013-14', 
                                        '2015-16', '2017-18', '2019-20', '2021-22', '2023-24'].includes(dataPoint.name);
                              } else if (selectedPeriod === '3Y') {
                                return ['2007-09', '2010-12', '2013-15', '2016-18', '2019-21', '2022-24'].includes(dataPoint.name);
                              } else if (selectedPeriod === '4Y') {
                                return ['2005-08', '2009-12', '2013-16', '2017-20', '2021-24'].includes(dataPoint.name);
                              } else if (selectedPeriod === '5Y') {
                                return ['2005-09', '2010-14', '2015-19', '2020-24'].includes(dataPoint.name);
                              } else if (selectedPeriod === '10Y') {
                                return ['2005-14', '2015-24'].includes(dataPoint.name);
                              } else if (selectedPeriod === '15Y') {
                                return ['2010-24'].includes(dataPoint.name);
                              } else if (selectedPeriod === '20Y') {
                                return ['2005-24'].includes(dataPoint.name);
                              }
                              return true;
                            })}
                            onMouseMove={e => {
                              if (e && e.activePayload && e.activePayload.length > 0) {
                                const payload = e.activePayload[0].payload;
                                const isFixedPoint = selectedPeriod === '1Y' 
                                  ? payload.name?.startsWith('2024')
                                  : payload.name === peerChartData[peerChartData.length - 1]?.name;
                                
                                if (!isFixedPoint) {
                                  setActiveTooltip(payload);
                                } else {
                                  setActiveTooltip(null);
                                }
                              } else {
                                setActiveTooltip(null);
                              }
                            }}
                            onMouseLeave={() => setActiveTooltip(null)}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                            <XAxis 
                              dataKey="name" 
                              tickFormatter={(value) => {
                                // Display the full range for multi-year periods
                                if (typeof value === 'string') {
                                  if (selectedPeriod !== 'Annual') {
                                    return value; // Return the full range (e.g., "2005-06", "2007-08")
                                  } else {
                                    // For 1Y period, just show the year
                                    return value.includes('-') ? value.split('-')[0] : value;
                                  }
                                }
                                return value;
                              }}
                            />
                            <YAxis 
                              tickFormatter={(value) => new Intl.NumberFormat('en-US', {
                                notation: 'compact',
                                maximumFractionDigits: 1
                              }).format(value)}
                            />
                            <Tooltip 
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length > 0) {
                                  const point = payload[0].payload;
                                  if ((selectedPeriod === '1Y' && point.name?.startsWith('2024')) || 
                                      (selectedPeriod !== '1Y' && point.name === peerChartData[peerChartData.length - 1]?.name)) {
                                    return null;
                                  }
                                  return (
                                    <div className="custom-tooltip bg-white p-2 border rounded shadow">
                                      <p className="label">{label}</p>
                                      {payload.map((entry: any) => (
                                        <p key={entry.name} style={{ color: entry.color }}>
                                          {entry.name}: {entry.value === null ? "N/A" : new Intl.NumberFormat('en-US', {
                                            notation: 'compact',
                                            maximumFractionDigits: 1
                                          }).format(entry.value)}
                                        </p>
                                      ))}
                                    </div>
                                  );
                                }
                                return null;
                              }}
                              contentStyle={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                              itemStyle={{ padding: 0 }}
                              filterNull={false}
                            />
                            <Legend layout="horizontal" />
                            {selectedPeriod === 'Annual' ? (
                              // For Annual: Render historical and future separately
                              selectedCompanies.flatMap((company, idx) => {
                                const baseColor = generateColorPalette(selectedCompanies.length)[idx];
                                return [
                                  <Line
                                    key={`${company.ticker}_historical`}
                                    type="monotone"
                                    dataKey={`${selectedPeerMetric}_historical.${company.ticker}`}
                                    stroke={baseColor}
                                    name={`${company.ticker} (Historical)`}
                                    strokeWidth={2}
                                    dot={{
                                      fill: baseColor,
                                      r: 4
                                    }}
                                    connectNulls={false}
                                  />,
                                  <Line
                                    key={`${company.ticker}_future`}
                                    type="monotone"
                                    dataKey={`${selectedPeerMetric}_future.${company.ticker}`}
                                    stroke={addOpacityToColor(baseColor, 0.5)}
                                    strokeDasharray="5 5"
                                    name={`${company.ticker} (Future)`}
                                    strokeWidth={2}
                                    dot={{
                                      fill: addOpacityToColor(baseColor, 0.5),
                                      r: 4
                                    }}
                                    connectNulls={false}
                                  />
                                ];
                              })
                            ) : (
                              // For Average/CAGR: Single line per company
                              selectedCompanies.map((company, idx) => {
                              const color = generateColorPalette(selectedCompanies.length)[idx];
                              return (
                                <Line
                                  key={company.ticker}
                                  type="monotone"
                                  dataKey={`${selectedPeerMetric}.${company.ticker}`}
                                  stroke={color}
                                    name={`${company.ticker}`}
                                  strokeWidth={2}
                                  dot={{
                                    fill: color,
                                    r: 4
                                  }}
                                  connectNulls={false}
                                />
                              );
                              })
                            )}
                          </LineChart>
                        </ResponsiveContainer>
                        
                        {/* Fixed tooltip for peers chart positioned below legend inside chart */}
                        {selectedCompanies.length > 0 && selectedPeerMetric && fixed2024Data && (
                          <div
                            className="fixed-tooltip absolute left-4 right-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-md p-2 text-xs shadow-sm"
                            style={{
                              bottom: `${-80 - Math.floor((selectedCompanies.length - 1) / 3) * 25}px`
                            }}
                          >
                            <div className="font-medium text-gray-700 mb-1 text-xs">
                              {selectedPeriod === '1Y' ? '2024' : 
                               selectedPeriod === '2Y' ? '2023-24' :
                               selectedPeriod === '3Y' ? '2022-24' :
                               selectedPeriod === '4Y' ? '2021-24' :
                               selectedPeriod === '5Y' ? '2020-24' :
                               selectedPeriod === '10Y' ? '2015-24' :
                               selectedPeriod === '15Y' ? '2010-24' :
                               selectedPeriod === '20Y' ? '2005-24' :
                               fixed2024Data.name} Values
                            </div>
                            <div className="space-y-1">
                            {selectedCompanies.map((company, idx) => {
                              const value = fixed2024Data[selectedPeerMetric]?.[company.ticker];
                              const hoveredValue = (activeTooltip && activeTooltip[selectedPeerMetric]?.[company.ticker] != null)
                                ? Number(activeTooltip[selectedPeerMetric][company.ticker])
                                : null;
                              const diff = value != null && hoveredValue != null ? value - hoveredValue : null;
                              const percent = (hoveredValue != null && hoveredValue !== 0 && diff != null)
                                ? (diff / hoveredValue) * 100
                                : null;
                              const isIncrease = percent != null && percent >= 0;
                              const color = generateColorPalette(selectedCompanies.length)[idx];
                                
                              return (
                                  <div key={company.ticker} className="flex items-center text-xs">
                                    <div 
                                      className="w-2 h-2 rounded-full mr-2"
                                      style={{ backgroundColor: color }}
                                    ></div>
                                    <span style={{ color, minWidth: 60, display: 'inline-block' }}>
                                    {company.ticker}:
                                  </span>
                                    <span className="ml-1">
                                    {value === null ? "N/A" : new Intl.NumberFormat('en-US', {
                                      notation: 'compact',
                                      maximumFractionDigits: 1
                                    }).format(value)}
                                  </span>
                                  {percent != null && (
                                    <span
                                        className={`ml-2 flex items-center font-semibold ${isIncrease ? 'text-green-600' : 'text-red-600'}`}
                                        style={{ minWidth: 40 }}
                                    >
                                      {isIncrease ? '▲' : '▼'}
                                      {Math.abs(percent).toFixed(1)}%
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                            </div>
                          </div>
                        )}

                      </div>
                    )
                  ) : activeChart === 'valuation' ? (
                    // Valuation Charts - Conditional Layout
                    <div className={`flex flex-col gap-4 w-full ${isChatbotMinimized ? 'md:flex-row' : ''}`}>
                      <div className={`w-full ${isChatbotMinimized ? 'md:w-1/2' : ''}`}>
                        <ValueBuildupChart initialCompany={searchValue} />
                      </div>
                      <div className={`w-full ${isChatbotMinimized ? 'md:w-1/2' : ''}`}>
                        <MultiplesChart initialCompany={searchValue} />
                      </div>
                    </div>
                  ) : (
                    // Industry Chart
                    industryLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <span>Loading...</span>
                      </div>
                    ) : industryError ? (
                      <div className="flex items-center justify-center h-full text-red-500">
                        {industryError}
                      </div>
                    ) : industryChartData && Object.keys(industryChartData).length > 0 ? (
                      <div className="w-full min-h-[400px]" style={{ position: 'relative' }}>
                        <BoxPlot
                          data={industryChartData}
                          title={`${selectedIndustry} • ${selectedPeriod}`}
                          companyNames={industryCompanyNames}
                          selectedTicker={searchValue ? searchValue.split(':')[0].trim().toUpperCase() : ''}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        No data available
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>




            </div>
            )}

            {/* Insights Generation - full width on mobile */}
            {!isChatbotMinimized && (
              <div className={`${isPerformanceMinimized ? 'lg:col-span-12' : 'lg:col-span-3'} ${isPerformanceMinimized ? '' : 'lg:mr-[-11rem]'} transition-all duration-300 flex flex-col`}>
                <div className="mt-2 xm:mt-2.5 xs:mt-3 sm:mt-3 md:mt-3.5 lg:mt-4 flex-1 flex flex-col">
                  <div className="bg-white dark:bg-[#161C1A] rounded-lg shadow-sm flex-1 flex flex-col overflow-hidden">
                  <div className="p-2 xm:p-3 xs:p-3.5 sm:p-4 md:p-5 lg:p-5 xl:p-6 border-b dark:border-[#161C1A] flex-shrink-0">
                    <div className="flex justify-end items-center gap-1.5 xm:gap-2 xs:gap-2 sm:gap-2 mb-3">
                      {/* Maximize Button */}
                      <button
                        onClick={() => {
                          setIsPerformanceMinimized(!isPerformanceMinimized);
                          setIsChatbotMinimized(false); // Ensure chatbot is shown when maximizing
                        }}
                        className="px-1.5 py-1.5 xm:px-2 xm:py-2 xs:px-2 xs:py-2 sm:px-2 sm:py-2 text-xs xm:text-sm xs:text-sm sm:text-sm md:text-base lg:text-base xl:text-base bg-[#144D37] dark:bg-[#144D37] text-white dark:text-white rounded hover:bg-[#0F3A28] dark:hover:bg-[#0F3A28] transition-colors"
                        title={isPerformanceMinimized ? "Show performance tab" : "Maximize chatbot"}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <svg width="14" height="14" className="xm:w-4 xm:h-4 xs:w-4 xs:h-4 sm:w-[18px] sm:h-[18px]" fill="none" viewBox="0 0 20 20">
                          <path d="M4 4h12v12H4V4z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      {/* Minimize/Hide Button */}
                      <button
                        onClick={() => setIsChatbotMinimized(!isChatbotMinimized)}
                        className="px-1.5 py-1.5 xm:px-2 xm:py-2 xs:px-2 xs:py-2 sm:px-2 sm:py-2 text-xs xm:text-sm xs:text-sm sm:text-sm md:text-base lg:text-base xl:text-base bg-gray-200 dark:bg-[#1C2220] text-gray-700 dark:text-[#E0E6E4] rounded hover:bg-gray-300 dark:hover:bg-[#161C1A] transition-colors"
                        title={isChatbotMinimized ? "Show chatbot" : "Hide chatbot"}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <svg width="14" height="14" className="xm:w-4 xm:h-4 xs:w-4 xs:h-4 sm:w-[18px] sm:h-[18px]" fill="none" viewBox="0 0 20 20">
                          {isChatbotMinimized ? (
                            <path d="M10 4v12M4 10h12" stroke="#144D37" strokeWidth="2" strokeLinecap="round"/>
                          ) : (
                            <path d="M4 10h12" stroke="#144D37" strokeWidth="2" strokeLinecap="round"/>
                          )}
                        </svg>
                      </button>
                      {/* Clear Chat Button */}
                      <button
                        className="px-1.5 py-1.5 xm:px-2 xm:py-2 xs:px-2 xs:py-2 sm:px-2 sm:py-2 text-xs xm:text-sm xs:text-sm sm:text-sm md:text-base lg:text-base xl:text-base bg-gray-200 dark:bg-gray-400 text-gray-700 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        title="Click to reset conversation"
                        onClick={() => {
                          // Clear Insights Chat
                          const event = new CustomEvent('clearChat');
                          window.dispatchEvent(event);
                          
                          // Clear Report Chat
                          startNewReportChat();
                        }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <svg width="14" height="14" className="xm:w-4 xm:h-4 xs:w-4 xs:h-4 sm:w-[18px] sm:h-[18px]" fill="none" viewBox="0 0 20 20">
                          <path d="M6 6l8 8M6 14L14 6" stroke="#144D37" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                      {/* Save Conversation/Report Button */}
                      {chatMode === 'report' ? (
                        <button 
                          onClick={saveReport}
                          disabled={isSavingReport || reportMessages.filter(msg => msg.role === 'assistant' && msg.content && msg.content !== 'Thinking...').length === 0}
                          className={`px-2 py-1.5 xm:px-2.5 xm:py-1.5 xs:px-3 xs:py-2 sm:px-3 sm:py-2 md:px-3.5 md:py-2 lg:px-3.5 lg:py-2 xl:px-4 xl:py-2 text-xs xm:text-xs xs:text-sm sm:text-sm md:text-base lg:text-base xl:text-base rounded transition-colors ${
                            isSavingReport || reportMessages.filter(msg => msg.role === 'assistant' && msg.content && msg.content !== 'Thinking...').length === 0
                              ? 'bg-gray-400 dark:bg-[#161C1A] cursor-not-allowed text-gray-200' 
                              : 'bg-[#144D37] text-white hover:bg-[#0F3A28]'
                          }`}
                          title={
                            isSavingReport 
                              ? 'Saving report...' 
                              : reportMessages.filter(msg => msg.role === 'assistant' && msg.content && msg.content !== 'Thinking...').length === 0
                              ? 'No report to save'
                              : 'Download report as text file'
                          }
                        >
                          {isSavingReport ? 'Saving...' : 'Save Report'}
                        </button>
                      ) : (
                      <button 
                        onClick={saveConversation}
                        disabled={isSavingConversation || messages.length <= 1}
                        className={`px-2 py-1.5 xm:px-2.5 xm:py-1.5 xs:px-3 xs:py-2 sm:px-3 sm:py-2 md:px-3.5 md:py-2 lg:px-3.5 lg:py-2 xl:px-4 xl:py-2 text-xs xm:text-xs xs:text-sm sm:text-sm md:text-base lg:text-base xl:text-base rounded transition-colors ${
                          isSavingConversation || messages.length <= 1
                            ? 'bg-gray-400 cursor-not-allowed' 
                              : 'bg-[#144D37] text-white hover:bg-[#0F3A28]'
                        }`}
                        title={
                          isSavingConversation 
                            ? 'Generating PDF...' 
                            : messages.length <= 1
                            ? 'No conversation to save'
                            : 'Save conversation as PDF report'
                        }
                      >
                        {isSavingConversation ? 'Generating PDF...' : 'Save Conversation'}
                      </button>
                      )}
                    </div>
                    <h2 className="text-sm xm:text-base xs:text-lg sm:text-lg md:text-xl lg:text-xl xl:text-2xl font-medium dark:text-white">
                      {chatMode === 'insights' ? 'Insights Generation' : 'Report Generation'}
                    </h2>
                  </div>
                  
                  {/* Toggle Tabs */}
                  <div className="flex space-x-2 px-4 xl:px-6 pt-4 border-b border-gray-200 dark:border-[#161C1A]">
                    <button
                      onClick={() => setChatMode('insights')}
                      className={`pb-2 px-4 text-sm font-medium transition-colors relative ${
                        chatMode === 'insights'
                          ? 'text-[#144D37] border-b-2 border-[#144D37]'
                          : 'text-gray-500 dark:text-[#889691] hover:text-gray-700 dark:hover:text-[#E0E6E4]'
                      }`}
                    >
                      Insights Generation
                    </button>
                    <button
                      onClick={() => setChatMode('report')}
                      className={`pb-2 px-4 text-sm font-medium transition-colors relative ${
                        chatMode === 'report'
                          ? 'text-[#144D37] border-b-2 border-[#144D37]'
                          : 'text-gray-500 dark:text-[#889691] hover:text-gray-700 dark:hover:text-[#E0E6E4]'
                      }`}
                    >
                      Report Generation
                    </button>
                  </div>

                  {/* Conditional Content */}
                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  {chatMode === 'insights' ? (
                    <>
                  {/* Chat Header with New Chat Button */}
                  <div className="flex items-center justify-between p-4 xl:p-6 border-b dark:border-[#161C1A] flex-shrink-0">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-[#E0E6E4]">
                      {currentChatSession ? 'Chat Session' : 'New Chat'}
                    </h3>
                    <button
                      onClick={startNewChat}
                      className="px-3 py-1.5 text-sm bg-[#144D37] text-white rounded-lg hover:bg-[#0F3A28] transition-colors"
                    >
                      ✨ New Chat
                    </button>
                  </div>
                  
                  {/* Chat Messages */}
                  <div 
                    ref={chatMessagesRef}
                    className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-4 xl:p-6 space-y-3 sm:space-y-4"
                  >
                    {messages.map((message, index) => 
                      message.role === 'assistant' ? (
                        <div key={index} className="flex gap-3 xl:gap-4">
                          <div className="w-8 xl:w-10 h-8 xl:h-10 bg-[#144D37] rounded-full flex items-center justify-center text-white text-sm xl:text-base">
                            AI
                          </div>
                          <div className="flex-1">
                            <div className={`bg-[#E5F0F6] dark:bg-[#1C2220] dark:text-[#E0E6E4] rounded-lg p-3 xl:p-4 text-sm xl:text-base ${
                              message.content === 'Thinking...' ? 'animate-pulse italic text-gray-600 dark:text-[#889691]' : ''
                            }`}>
                              {message.content}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div key={index} className="flex gap-3 justify-end xl:gap-4">
                          <div className="flex-1">
                            <div className="bg-gray-100 dark:bg-[#1C2220] dark:text-[#E0E6E4] rounded-lg p-3 xl:p-4 text-sm xl:text-base ml-auto max-w-[80%]">
                              {message.content}
                            </div>
                          </div>
                          <div className="w-8 xl:w-10 h-8 xl:h-10 bg-gray-200 dark:bg-[#161C1A] rounded-full flex items-center justify-center text-sm xl:text-base dark:text-[#E0E6E4]">
                            {userInitials}
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="p-4 xl:p-6 border-t dark:border-[#161C1A] flex-shrink-0">
                    <form 
                      className="flex gap-2 xl:gap-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (checkQuestionLimit()) {
                          handleSendMessage(inputValue);
                          setInputValue('');
                          setQuestionsAsked(prev => prev + 1);
                        }
                      }}
                    >
                      <input 
                        type="text" 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Ask Me Anything..."
                        className="flex-1 px-3 xl:px-4 py-2 xl:py-3 text-sm xl:text-base border dark:border-[#161C1A] rounded-lg bg-white dark:bg-[#161C1A] dark:text-[#E0E6E4] dark:placeholder-[#889691]"
                      />
                      <button 
                        type="button" 
                        className={`p-1 xl:p-2 rounded transition-colors ${
                          isListening 
                            ? 'bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800' 
                            : 'hover:bg-gray-100 dark:hover:bg-[#161C1A]'
                        }`}
                        title={isListening ? "Listening... Click to stop" : "Click to speak"}
                        onClick={startListening}
                        disabled={isListening}
                      >
                        <img 
                          src="/audio.jpg" 
                          alt="Voice" 
                          className={`w-9 xl:w-10 h-9 xl:h-10 object-cover rounded ${
                            isListening ? 'animate-pulse' : ''
                          }`} 
                        />
                      </button>
                      
                      {/* File Upload Button */}
                      <button 
                        type="button" 
                        className="p-1 xl:p-2 rounded transition-colors hover:bg-gray-100 dark:hover:bg-[#161C1A]"
                        title="Upload files"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <span className="text-2xl font-bold text-[#144D37] dark:text-[#144D37]">+</span>
                      </button>
                      
                      {/* Hidden File Input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileUpload}
                        accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
                      />
                      <button 
                        type="submit" 
                        className="p-2 xl:p-3 bg-[#144D37] text-white rounded hover:bg-[#0F3A28] disabled:bg-gray-300 disabled:cursor-not-allowed"
                        disabled={!inputValue.trim() || isChatLoading}
                      >
                        <span className="text-lg">{isChatLoading ? '⏳' : '➤'}</span>
                      </button>
                    </form>
                    
                    {/* Chat Disclaimer - beneath the input area */}
                    <div className="mt-3 text-xs text-gray-500 dark:text-[#889691] bg-gray-50 dark:bg-[#161C1A] p-2 rounded text-center">
                      💡 AI responses may be inaccurate. We will continue to fine tune to improve the accuracy.
                    </div>
                    
                    {/* Uploaded Files Display */}
                    {uploadedFiles.length > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-[#161C1A] rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-[#E0E6E4]">Uploaded Files:</span>
                          <button
                            onClick={() => setUploadedFiles([])}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Clear All
                          </button>
                  </div>
                        <div className="space-y-2">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-[#161C1A] rounded border dark:border-[#161C1A]">
                              <div className="flex items-center space-x-2">
                                <span className="text-blue-600 dark:text-blue-400">📎</span>
                                <span className="text-sm text-gray-700 dark:text-gray-200 truncate max-w-48">{file.name}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                              <button
                                onClick={() => removeFile(index)}
                                className="text-red-500 hover:text-red-700 text-sm"
                              >
                                ×
                              </button>
              </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                    </>
                  ) : (
                    <>
                      {/* Report Generation Form - At Top */}
                      <div className="p-4 xl:p-6 border-b dark:border-gray-700 flex-shrink-0">
                        <ReportGenerationForm 
                          key={reportFormKey}
                          onGenerate={handleReportGenerate} 
                          isLoading={isGeneratingReport}
                          showInstructions={true}
                          showFormFields={true}
                        />
                      </div>

                      {/* Report Generation Chat Messages - In Middle */}
                      <div 
                        ref={chatMessagesRef}
                        className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-4 xl:p-6 space-y-3 sm:space-y-4"
                      >
                        {reportMessages.map((message, index) => 
                          message.role === 'assistant' ? (
                            <div key={index} className="flex gap-3 xl:gap-4">
                              <div className="w-8 xl:w-10 h-8 xl:h-10 bg-[#144D37] rounded-full flex items-center justify-center text-white text-sm xl:text-base flex-shrink-0">
                                AI
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 xl:p-6 ${
                                  message.content === 'Thinking...' ? 'animate-pulse italic text-gray-600 dark:text-gray-400' : ''
                                }`}>
                                  {message.content === 'Thinking...' ? (
                                    message.content
                                  ) : (
                                    <ReactMarkdown
                                      components={{
                                        h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-0" {...props} />,
                                        h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6 border-b border-gray-200 dark:border-gray-700 pb-2" {...props} />,
                                        h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-4" {...props} />,
                                        p: ({node, ...props}) => <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4" {...props} />,
                                        strong: ({node, ...props}) => <strong className="font-semibold text-gray-900 dark:text-white" {...props} />,
                                        ul: ({node, ...props}) => <ul className="list-disc pl-6 my-4 space-y-2 text-gray-700 dark:text-gray-300" {...props} />,
                                        ol: ({node, ...props}) => <ol className="list-decimal pl-6 my-4 space-y-2 text-gray-700 dark:text-gray-300" {...props} />,
                                        li: ({node, ...props}) => <li className="text-gray-700 dark:text-gray-300 leading-relaxed" {...props} />,
                                        hr: ({node, ...props}) => <hr className="my-6 border-gray-300 dark:border-gray-700" {...props} />,
                                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 italic text-gray-600 dark:text-gray-400 my-4" {...props} />,
                                        img: ({node, ...props}: any) => (
                                          <img 
                                            {...props} 
                                            className="max-w-full h-auto rounded-lg my-4 shadow-md" 
                                            alt={props.alt || 'Report image'}
                                            onError={(e: any) => {
                                              e.target.style.display = 'none';
                                            }}
                                          />
                                        ),
                                        code: ({node, inline, ...props}: any) => 
                                          inline ? (
                                            <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800 dark:text-gray-200" {...props} />
                                          ) : (
                                            <code className="block bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm font-mono text-gray-800 dark:text-gray-200 overflow-x-auto my-4" {...props} />
                                          ),
                                      }}
                                    >
                                      {message.content}
                                    </ReactMarkdown>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div key={index} className="flex gap-3 justify-end xl:gap-4">
                              <div className="flex-1">
                                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 xl:p-4 text-sm xl:text-base ml-auto max-w-[80%] text-gray-900 dark:text-gray-200">
                                  {message.content}
                                </div>
                              </div>
                              <div className="w-8 xl:w-10 h-8 xl:h-10 bg-gray-200 dark:bg-[#161C1A] rounded-full flex items-center justify-center text-sm xl:text-base flex-shrink-0 text-gray-700 dark:text-[#E0E6E4]">
                                {userInitials}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </>
                  )}
                  </div>
                </div>
              </div>
            </div>
          )}
              </>
            )}
        
          </div>
        </div>
        
        {/* Minimized Chatbot Indicator */}
        {isChatbotMinimized && (
          <div className="fixed bottom-4 right-4 z-50">
            <button
              onClick={() => setIsChatbotMinimized(false)}
              className="bg-[#144D37] text-white px-4 py-2 rounded-lg shadow-lg hover:bg-[#0F3A28] transition-colors flex items-center gap-2"
              title="Show chatbot"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 20 20">
                <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="text-sm">Show Insights</span>
            </button>
          </div>
        )}
      </div>

      {/* Pricing Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
                <button
                  onClick={() => setShowPricingModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {subscriptionPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative p-6 border rounded-lg ${
                      plan.popular 
                        ? 'border-[#1B5A7D] ring-2 ring-[#1B5A7D]' 
                        : 'border-gray-200'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-[#1B5A7D] text-white px-3 py-1 rounded-full text-sm font-medium">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                      <div className="mb-4">
                        <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                        <span className="text-gray-600 ml-1">{plan.period}</span>
                      </div>
                      
                      <ul className="space-y-3 mb-6 text-left">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <button
                        onClick={() => handleUpgrade(plan.id)}
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                          plan.popular
                            ? 'bg-[#1B5A7D] text-white hover:bg-[#164964]'
                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                        }`}
                      >
                        {plan.id === 'free' ? 'Current Plan' : 'Upgrade'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Usage Info */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Current Usage</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Questions used: {questionsAsked} / {userSubscription.questionsLimit}
                  </span>
                  <span className="text-sm text-gray-600">
                    Plan: {userSubscription.plan.charAt(0).toUpperCase() + userSubscription.plan.slice(1)}
                  </span>
                </div>
                {userSubscription.plan === 'free' && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-[#1B5A7D] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(questionsAsked / userSubscription.questionsLimit) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Contact Us</h2>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Contact Information */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Get in Touch</h3>
                <div className="space-y-2 text-gray-700">
                  <div className="flex items-center">
                    <span className="mr-2">📧</span>
                    <a href="mailto:info@valueaccel.com" className="text-blue-600 hover:underline">
                    info@valueaccel.com
                    </a>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">📞</span>
                    <a href="tel:6305967395" className="text-blue-600 hover:underline">
                      630 596 7395
                    </a>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <form onSubmit={handleContactSubmit} className="space-y-4" ref={contactFormRef}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5A7D] focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5A7D] focus:border-transparent"
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                      Company
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5A7D] focus:border-transparent"
                      placeholder="Enter your company name"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5A7D] focus:border-transparent"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={4}
                    className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5A7D] focus:border-transparent"
                    placeholder="Tell us how we can help you..."
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowContactModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#1B5A7D] text-white rounded-lg hover:bg-[#164964] transition-colors"
                  >
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Insights Generator Modal */}
      {showInsightsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-3 sm:p-4">
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowInsightsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <InsightsGenerators onContactClick={() => {
                setShowInsightsModal(false);
                setShowContactModal(true);
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Approach Modal */}
      {showApproachModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-y-auto">
            <Approach onClose={() => setShowApproachModal(false)} />
          </div>
        </div>
      )}

      {/* Why Us Modal */}
      {showWhyUsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex-1 text-center">
                  <h1 className="text-3xl font-bold text-[#1B5A7D] mb-2">WHY PARTNER WITH US?</h1>
                  <p className="text-lg text-gray-600">Our unique op-model enabled us to deliver services at high impact & low cost</p>
                </div>
                <button
                  onClick={() => setShowWhyUsModal(false)}
                  className="text-gray-400 hover:text-gray-600 ml-4"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {/* Feature 1 */}
                <div className="text-center">
                  <div className="relative mb-6">
                    <div className="w-32 h-32 bg-[#1B5A7D] rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl font-bold text-white">1</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-[#1B5A7D] mb-4">Pre-built Digital/AI Accelerators & Platforms</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Our (and our delivery partners') platforms and pre-built tools accelerate the value delivery by <strong className="text-[#1B5A7D]">up to 50%</strong>, for select use cases and transformation efforts.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="text-center">
                  <div className="relative mb-6">
                    <div className="w-32 h-32 bg-[#1B5A7D] rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl font-bold text-white">2</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-[#1B5A7D] mb-4">Our low-cost Service / Operating Model</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Very minimal overhead cost compared to large consulting companies. <strong className="text-[#1B5A7D]">Up to 50% lower overall cost</strong> due to our optimal staffing model.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="text-center">
                  <div className="relative mb-6">
                    <div className="w-32 h-32 bg-[#1B5A7D] rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl font-bold text-white">3</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-[#1B5A7D] mb-4">One team of Strategists, Experts & Developers</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Our team comprised of <strong className="text-[#1B5A7D]">strategists, Digital/AI developers, domain experts,</strong> and <strong className="text-[#1B5A7D]">partners/alliances</strong> with specialized platforms and accelerators.
                  </p>
                </div>
              </div>

              {/* Contact Button */}
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => {
                    setShowWhyUsModal(false);
                    setShowContactModal(true);
                  }}
                  className="px-8 py-3 bg-[#1B5A7D] text-white rounded-lg hover:bg-[#164964] transition-colors font-medium"
                >
                  Contact Us
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Value Services Modal */}
      {showValueServicesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-[#1B5A7D] flex-1 text-center">Our Value Identification To Realization Services</h1>
                <button
                  onClick={() => setShowValueServicesModal(false)}
                  className="text-gray-400 hover:text-gray-600 ml-4"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-600">FROM: Value Identification ...</span>
                  <span className="text-sm font-medium text-gray-600">TO: Value Realization</span>
                </div>
                <div className="relative">
                  <div className="w-full h-3 bg-gray-200 rounded-full">
                    <div className="h-full bg-gradient-to-r from-[#1B5A7D] to-[#164964] rounded-full relative">
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-8 border-l-[#164964] border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {/* Column 1 - Value Identification */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                  <h2 className="text-xl font-bold text-[#1B5A7D] mb-4 text-center">
                    Value Identification <br/>& Current State Assessment
                  </h2>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-[#1B5A7D] mr-2">•</span>
                      On-demand insights, strategy development & domain expertise
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#1B5A7D] mr-2">•</span>
                      Value chain mapping and use case identification (including Digital/AI)
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#1B5A7D] mr-2">•</span>
                      Current state assessment / readiness (data, IT/ OT/ET)
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#1B5A7D] mr-2">•</span>
                      Use case ROIC, prioritization, and digital transformation roadmap
                    </li>
                  </ul>
                </div>

                {/* Column 2 - Data Platforms */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                  <h2 className="text-xl font-bold text-[#1B5A7D] mb-4 text-center">
                    Data Platforms & <br/>AIoT/IT/ET Infrastructure Implementation
                  </h2>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-[#1B5A7D] mr-2">•</span>
                      Data integration across sources and systems
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#1B5A7D] mr-2">•</span>
                      Data curation & building centralized data products and platforms
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#1B5A7D] mr-2">•</span>
                      Accelerated AIoT/IT/ET implementation by leveraging technology including accelerators and pre-built solutions
                    </li>
                  </ul>
                </div>

                {/* Column 3 - Value Realization */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
                  <h2 className="text-xl font-bold text-[#1B5A7D] mb-4 text-center">
                    Select Use Case <br/>Implementation & Value Realization
                  </h2>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-[#1B5A7D] mr-2">•</span>
                      Select use/value case and digital/AI solution end-to-end implementation
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#1B5A7D] mr-2">•</span>
                      Accelerated efforts by leverage AI agents and domain experts
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#1B5A7D] mr-2">•</span>
                      Institutionalization and new ways of working by addressing people, process changes
                    </li>
                  </ul>
                </div>
              </div>

              {/* Contact Button */}
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => {
                    setShowValueServicesModal(false);
                    setShowContactModal(true);
                  }}
                  className="px-8 py-3 bg-[#1B5A7D] text-white rounded-lg hover:bg-[#164964] transition-colors font-medium flex items-center gap-2"
                >
                  <span>Contact Us</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AIOT Platform & Solutions Modal */}
      {showAIOTModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-3 sm:p-4">
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowAIOTModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <AIOTPlatformSolutions onContactClick={() => {
                setShowAIOTModal(false);
                setShowContactModal(true);
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Operations Virtualization & Optimization Modal */}
      {showOperationsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-3 sm:p-4">
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowOperationsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <OperationsVirtualization onContactClick={() => {
                setShowOperationsModal(false);
                setShowContactModal(true);
              }} />
            </div>
          </div>
        </div>
      )}

    </div>
    </>
  );
}

export default Dashboard; 