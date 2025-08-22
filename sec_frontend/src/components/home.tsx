import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import InsightsGenerators from './InsightsGenerators';
import AIOTPlatformSolutions from './AIOTPlatformSolutions';
import OperationsVirtualization from './OperationsVirtualization';
import Approach from './approach';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import BoxPlot from './BoxPlot';
import { useChat } from './chatbox';
import { TooltipProps } from 'recharts';
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

// Update the PeriodType to include all available periods
type PeriodType = '1Y' | '2Y' | '3Y' | '4Y' | '5Y' | '10Y' | '15Y' | '20Y';

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



const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
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
  const [showCapabilitiesDropdown, setShowCapabilitiesDropdown] = useState(false);
  const [showAIOTModal, setShowAIOTModal] = useState(false);
  const [showOperationsModal, setShowOperationsModal] = useState(false);
  const [showChatHistoryDropdown, setShowChatHistoryDropdown] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isLoadingChatHistory, setIsLoadingChatHistory] = useState(false);
  const [currentChatSession, setCurrentChatSession] = useState<any>(null);
  const [hasNewChatContent, setHasNewChatContent] = useState(false); // Track if chat has new content
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
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
      
      // Add title
      doc.setFontSize(20);
      doc.text('AI Conversation Report', 20, 20);
      
      // Add timestamp
      doc.setFontSize(12);
      doc.text(`Generated on: ${pdfContent.timestamp}`, 20, 30);
      
      // Add chart information
      doc.setFontSize(14);
      doc.text('Chart Configuration:', 20, 45);
      doc.setFontSize(10);
      doc.text(`Type: ${activeChart}`, 20, 55);
      if (searchValue) doc.text(`Company: ${searchValue}`, 20, 65);
      if (selectedSearchMetrics.length > 0) doc.text(`Metrics: ${selectedSearchMetrics.join(', ')}`, 20, 75);
      if (selectedPeriod) doc.text(`Period: ${selectedPeriod}`, 20, 85);
      
      // Add conversation messages
      let yPosition = 105;
      doc.setFontSize(14);
      doc.text('Conversation:', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      messages.forEach((message) => {
        const role = message.role === 'assistant' ? 'AI' : 'User';
        const content = message.content;
        
        // Check if we need a new page
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Add role and content
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${role}:`, 20, yPosition);
        yPosition += 5;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        // Split content into lines that fit the page width
        const maxWidth = 170;
        const words = content.split(' ');
        let line = '';
        
        for (const word of words) {
          const testLine = line + word + ' ';
          const testWidth = doc.getTextWidth(testLine);
          
          if (testWidth > maxWidth) {
            doc.text(line, 20, yPosition);
            yPosition += 5;
            line = word + ' ';
            
            // Check if we need a new page
            if (yPosition > 280) {
              doc.addPage();
              yPosition = 20;
            }
          } else {
            line = testLine;
          }
        }
        
        // Add remaining line
        if (line) {
          doc.text(line, 20, yPosition);
          yPosition += 5;
        }
        
        yPosition += 5; // Add space between messages
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

  // Token refresh function
  const refreshToken = async (): Promise<string | null> => {
    try {
      const refreshToken = localStorage.getItem('refresh');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${baseUrl}/account/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh: refreshToken
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access', data.access);
        return data.access;
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  };

  const fetchChatHistory = async () => {
    try {
      setIsLoadingChatHistory(true);
      let token = localStorage.getItem('access');
      if (!token) {
        setIsLoadingChatHistory(false);
        return;
      }

      let response = await fetch(`${baseUrl}/api/chat/batches/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // If token expired, try to refresh and retry
      if (response.status === 401) {
        console.log('Token expired, attempting refresh...');
        const newToken = await refreshToken();
        if (newToken) {
          response = await fetch(`${baseUrl}/api/chat/batches/`, {
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json',
            },
          });
        } else {
          // Refresh failed, redirect to login
          console.error('Token refresh failed, redirecting to login');
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          localStorage.removeItem('user_info');
          window.location.href = '/login';
          return;
        }
      }

      if (response.ok) {
        const data = await response.json();
        setChatHistory(data.slice(0, 10)); // Get latest 10 chat batches
        console.log('Fetched chat history:', data);
      } else {
        console.error('Failed to fetch chat history:', response.status);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setIsLoadingChatHistory(false);
    }
  };

  const loadChatBatch = async (batchId: number) => {
    try {
      let token = localStorage.getItem('access');
      console.log('Loading chat batch:', batchId);
      console.log('Token available:', !!token);
      
      if (!token) {
        console.error('No access token found');
        return;
      }

      let response = await fetch(`${baseUrl}/api/chat/batches/${batchId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      
      // If token expired, try to refresh and retry
      if (response.status === 401) {
        console.log('Token expired, attempting refresh...');
        const newToken = await refreshToken();
        if (newToken) {
          response = await fetch(`${baseUrl}/api/chat/batches/${batchId}/`, {
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json',
            },
          });
        } else {
          // Refresh failed, redirect to login
          console.error('Token refresh failed, redirecting to login');
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          localStorage.removeItem('user_info');
          window.location.href = '/login';
          return;
        }
      }

      if (response.ok) {
        const data = await response.json();
        console.log('Chat batch data:', data);
        
        // Messages are already in the correct format from the batch
        const formattedMessages = data.messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content
        }));
        
        console.log('Formatted messages:', formattedMessages);
        
        // Use the setMessages from useChat hook to properly update the chat
        setMessages(formattedMessages);
        setCurrentChatSession(batchId);
        setShowChatHistoryDropdown(false);
        setHasNewChatContent(false); // Reset flag since we're loading existing content
        
        // Clear any uploaded files when loading a session
        setUploadedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Save the loaded chat state immediately
        const chatState = {
          messages: formattedMessages,
          currentChatSession: batchId,
          hasNewChatContent: false,
          timestamp: Date.now()
        };
        
        try {
          localStorage.setItem('current_chat_state', JSON.stringify(chatState));
          console.log('Loaded chat state saved to localStorage');
        } catch (error) {
          console.error('Error saving loaded chat state:', error);
        }
      } else {
        console.error('Failed to load chat batch:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error loading chat batch:', error);
    }
  };

  const startNewChat = async () => {
    // Save current chat before starting new one (if it has meaningful content)
    if (messages.length > 1) { // More than just the initial message
      await saveChatBatch(messages);
    }
    
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
    setHasNewChatContent(false); // Reset flag for new chat
    
    // Clear any uploaded files
    setUploadedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Clear saved chat state since user explicitly started new chat
    localStorage.removeItem('current_chat_state');
  };

  const handleSessionUpdate = () => {
    // Refresh chat history when a new message is sent
    fetchChatHistory();
  };

  const deleteChatBatch = async (batchId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent loading the batch when clicking delete
    
    try {
      const token = localStorage.getItem('access');
      if (!token) return;

      const response = await fetch(`${baseUrl}/api/chat/batches/${batchId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Remove from local state
        setChatHistory(prev => prev.filter(batch => batch.id !== batchId));
        
        // If this was the current batch, start a new chat
        if (currentChatSession === batchId) {
          startNewChat();
        }
      }
    } catch (error) {
      console.error('Error deleting chat batch:', error);
    }
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
  const [activeChart, setActiveChart] = useState<'metrics' | 'peers' | 'industry'>('metrics');
  const [searchValue, setSearchValue] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState<CompanyTicker[]>([]);
  const [companyInput, setCompanyInput] = useState('');
  const [selectedPeerMetric, setSelectedPeerMetric] = useState<string>('');
  const [selectedSearchMetrics, setSelectedSearchMetrics] = useState<string[]>([]);
  const [searchMetricInput, setSearchMetricInput] = useState('');
  const [availableMetrics, setAvailableMetrics] = useState<{ value: string; label: string }[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('1Y');
  const [peerChartData, setPeerChartData] = useState<PeerDataPoint[]>([]);
  const [peerLoading, setPeerLoading] = useState(false);
  const [peerError, setPeerError] = useState<string | null>(null);
  // const [selectedIndustryCompanies, setSelectedIndustryCompanies] = useState<CompanyTicker[]>([]);
  const [selectedIndustryMetrics, setSelectedIndustryMetrics] = useState<string[]>([]);
  const [industryMetricInput, setIndustryMetricInput] = useState('');
  const [industryChartData, setIndustryChartData] = useState<Record<string, (number | null)[]>>({});
  const [industryLoading, setIndustryLoading] = useState(false);
  const [industryError, setIndustryError] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [availableIndustries, setAvailableIndustries] = useState<{ value: string; label: string; companies: string[] }[]>([]);
  const [industryCompanyNames, setIndustryCompanyNames] = useState<{ [metric: string]: string[] }>({});
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

  const [companyMap, setCompanyMap] = useState<{ [ticker: string]: string }>({});

  // Add these lines for peer metrics
  const [selectedPeerMetrics, setSelectedPeerMetrics] = useState<string[]>([]);

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

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
      try {
        const response = await fetch(`${baseUrl}/api/companies/`);
        if (!response.ok) {
          throw new Error(`Failed to fetch companies: ${response.status}`);
        }
        const data = await response.json();

        const map: { [ticker: string]: string } = {};
        data.forEach((company: any) => {
          map[company.ticker] = company.display_name || company.name || company.ticker;
        });

        setCompanyMap(map);
      } catch (error) {
        console.error('Error fetching companies:', error);
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
      const response = await fetch(`${baseUrl}/api/available-metrics/`);
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }
      const data = await response.json();
      console.log('Fetched metrics:', data);
      
      // Format metric names for display
      const formattedMetrics = data.metrics.map((metric: string) => ({
        value: metric,
        label: metric
          .replace(/([A-Z])/g, ' $1') // Add space before capital letters
          .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
          .trim()
      }));
      
      setAvailableMetrics(formattedMetrics);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const fetchMetricData = useCallback(async () => {
    if (!searchValue || selectedSearchMetrics.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const ticker = searchValue.split(':')[0].trim().toUpperCase();
      console.log('Fetching data for ticker:', ticker, 'period:', selectedPeriod);

      // Create array of time periods based on selectedPeriod
      let timePoints: string[] = [];
      if (selectedPeriod === '1Y') {
        // For annual data, use single years
        timePoints = Array.from({ length: 20 }, (_, i) => (2005 + i).toString());
      } else {
        // For multi-year periods, use predefined ranges
        switch (selectedPeriod) {
          case '2Y':
            timePoints = [
              '2005-06', '2007-08', '2009-10', '2011-12', '2013-14',
              '2015-16', '2017-18', '2019-20', '2021-22', '2023-24'
            ];
            break;
          case '3Y':
            timePoints = [
              '2007-09', '2010-12', '2013-15', '2016-18',
              '2019-21', '2022-24'
            ];
            break;
          case '4Y':
            timePoints = [
              '2005-08', '2009-12', '2013-16', '2017-20', '2021-24'
            ];
            break;
          case '5Y':
            timePoints = [
              '2005-09', '2010-14', '2015-19', '2020-24'
            ];
            break;
          case '10Y':
            timePoints = ['2005-14', '2015-24'];
            break;
          case '15Y':
            timePoints = ['2010-24'];
            break;
          case '20Y':
            timePoints = ['2005-24'];
            break;
        }
      }

      // First check if company exists
      const companyResponse = await fetch(`${baseUrl}/api/companies/${ticker}/`);
      if (!companyResponse.ok) {
        setError(`No data available for ${ticker}. Please try another company.`);
        setChartData([]);
        return;
      }

      // Fetch data for all selected metrics
      const promises = selectedSearchMetrics.map(async metric => {
        const url = `${baseUrl}/api/aggregated-data/?tickers=${ticker}&metric=${metric}&period=${selectedPeriod}`;
        console.log('Fetching from URL:', url);

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch data for ${metric}`);
        }
        const data = await response.json();
        console.log(`Raw data for ${metric}:`, data);
        return { metric, data };
      });

      const results = await Promise.all(promises);
      console.log('All results:', results);

      if (results.every(result => result.data.length === 0)) {
        setError(`No data available for ${ticker} for the selected metrics and period.`);
        setChartData([]);
        return;
      }

      // Initialize data points for all time periods
      const baseData = timePoints.map(period => ({
        name: period,
        ticker: ticker,
        value: 0
      }));

      // Transform the data for the chart
      const transformedData = results.reduce((acc, { metric, data }) => {
        // Start with the base data structure
        if (acc.length === 0) {
          acc = [...baseData];
        }

        // Create a map of existing data points
        const dataMap = new Map<string, number>(data.map((item: DataItem) => [item.name, item.value]));

        // Update all time points, using null for missing data instead of 0
        acc.forEach(point => {
          point[metric] = dataMap.get(point.name) ?? null;  // Use null coalescing
          point.ticker = ticker;
        });

        return acc;
      }, [] as ChartDataPoint[]);

      console.log('Transformed data:', transformedData);
      setChartData(transformedData);

    } catch (error) {
      console.error('Error fetching metric data:', error);
      setError('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, [searchValue, selectedSearchMetrics, selectedPeriod]);

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

      // Fetch data for each company
      const promises = selectedCompanies.map(async company => {
        const url = `${baseUrl}/api/aggregated-data/?tickers=${encodeURIComponent(company.ticker)}&metric=${encodeURIComponent(selectedPeerMetric)}&period=${encodeURIComponent(selectedPeriod)}`;
        console.log('Fetching from:', url);
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch data for ${company.ticker}`);
        }
        
        const data = await response.json();
        console.log(`Data for ${company.ticker}:`, data);
        return { company, data };
      });

      const results = await Promise.all(promises);
      
      if (results.length === 0 || results[0].data.length === 0) {
        console.error('No data returned from API');
        setPeerError('No data available for the selected companies and metric');
        setPeerChartData([]);
        return;
      }

      // Create a unified dataset with all companies
      const transformedData = results[0].data.map((timePoint: TimePoint) => {
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

      console.log('Transformed peer data:', transformedData);
      setPeerChartData(transformedData);

    } catch (error) {
      console.error('Error fetching peer data:', error);
      setPeerError(`Failed to connect to backend. Ensure it's running at ${baseUrl}`);
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
      const metricsParams = selectedIndustryMetrics.map(m => `metric[]=${encodeURIComponent(m)}`).join('&');
      const url = `${baseUrl}/api/boxplot-data/?${metricsParams}&period=${selectedPeriod}&industry=${encodeURIComponent(selectedIndustry)}`;
      console.log('Fetching from URL:', url);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch industry data');
      }
      const data = await response.json();
      console.log('Raw industry data:', data);

      // Directly use the values object
      setIndustryChartData(data.values || {});
      setIndustryCompanyNames(data.companyNames || {});

    } catch (error) {
      console.error('Error fetching industry data:', error);
      setIndustryError('Failed to fetch industry data');
    } finally {
      setIndustryLoading(false);
    }
  }, [selectedIndustryMetrics, selectedPeriod, selectedIndustry]);

  const fetchAvailableIndustries = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/industries/`);
      const data = await response.json();
      console.log('Raw industries data:', data);
      
      // Format industries correctly
      const formattedIndustries = data.industries.map((industry: { name: string, companies: string[] }) => ({
        value: industry.name,
        label: industry.name,
        companies: industry.companies
      }));
      
      console.log('Formatted industries:', formattedIndustries);
      setAvailableIndustries(formattedIndustries);
    } catch (error) {
      console.error('Error fetching industries:', error);
    }
  };

  useEffect(() => {
    fetchAvailableMetrics();
  }, []);

  // Fetch metric data when dependencies change (do NOT depend on chartData)
  useEffect(() => {
    if (activeChart === 'metrics') {
      fetchMetricData();
    }
  }, [searchValue, selectedSearchMetrics, activeChart, selectedPeriod, fetchMetricData]);

  // Update the useEffect that sets fixed2024Data
  useEffect(() => {
    if (activeChart === 'metrics' && chartData.length > 0) {
      // For annual view, keep the 2024 logic
      if (selectedPeriod === '1Y') {
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
      if (selectedPeriod === '1Y') {
        const data2024 = peerChartData.find(d => d.name.startsWith('2024'));
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
  }, [activeChart, selectedPeerMetric, selectedCompanies, fetchPeerData]);

  useEffect(() => {
    if (activeChart === 'industry') {
      fetchIndustryData();
    }
  }, [activeChart, selectedIndustryMetrics, selectedPeriod, selectedIndustry, fetchIndustryData]);



  useEffect(() => {
    fetchAvailableIndustries();
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
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
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
        <div className="lg:hidden flex justify-between items-center p-1 xm:p-1.5 xs:p-2 sm:p-2.5 md:p-3 bg-white border-b h-14 xm:h-16 xs:h-16 sm:h-18 md:h-20">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-1 xm:p-1.5 xs:p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-4 h-4 xm:w-4.5 xm:h-4.5 xs:w-5 xs:h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex-1"></div> {/* Spacer for center alignment */}
          
          <div className="w-6 xm:w-7 xs:w-8 sm:w-9 md:w-10"></div> {/* Spacer for balance */}
        </div>

      {/* Sidebar */}
      <div className="hidden lg:block w-64 xl:w-72 bg-white border-r">
        <div className="px-4 xl:px-6 h-full">
          <div className="space-y-2 mt-[6rem]">

          <div className="space-y-2">
            {/* <button className="flex items-center gap-2 w-full text-left p-2 hover:bg-gray-100 rounded">
              <span className="text-xl">+</span>
                <span>Upload Context Files (Optional)</span>
            </button> */}
            {/* <div className="pl-8 space-y-2 text-sm text-gray-600">
              <div>Add data sources</div>
              <div>Change model</div>
            </div> */}
          </div>

          <div className="space-y-2">
            <button 
              onClick={() => setShowContactModal(true)}
              className="flex items-center gap-2 w-full text-left p-1.5 hover:bg-gray-100 rounded"
            >
              <span className="text-sm">📞</span>
              <span className="text-sm">Contact Us</span>
            </button>
          </div>

          <div className="space-y-2">
            <button 
              onClick={() => setShowCapabilitiesDropdown(!showCapabilitiesDropdown)}
              className="flex items-center gap-2 w-full text-left p-1.5 hover:bg-gray-100 rounded"
            >
              <span className="text-sm">💡</span>
              <span className="text-sm">Our Capabilities, Solutions, & Accelerators</span>
              <svg 
                className={`w-3 h-3 ml-auto transition-transform ${showCapabilitiesDropdown ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            {showCapabilitiesDropdown && (
            <div className="pl-8 space-y-1 text-sm text-gray-600">
                <button 
                  onClick={() => setShowInsightsModal(true)}
                  className="block w-full text-left hover:text-blue-600 transition-colors cursor-pointer text-sm"
                >
                  Insights Generators (domain-specific)
                </button>
                <button 
                  onClick={() => setShowAIOTModal(true)}
                  className="block w-full text-left hover:text-blue-600 transition-colors cursor-pointer text-sm"
                >
                  AIOT Platform & Solutions
                </button>
                <button 
                  onClick={() => setShowOperationsModal(true)}
                  className="block w-full text-left hover:text-blue-600 transition-colors cursor-pointer text-sm"
                >
                  Operations Virtualization & Optimization
                </button>
            </div>
            )}
          </div>

          <div className="space-y-2">
            <button 
              onClick={() => setShowApproachModal(true)}
              className="flex items-center gap-2 w-full text-left p-1.5 hover:bg-gray-100 rounded"
            >
              <span className="text-sm">⚡</span>
                <span className="text-sm">Our Approach To Accelerate Value Creation</span>
            </button>
          </div>

          <div className="space-y-2">
            <button 
              onClick={() => setShowValueServicesModal(true)}
              className="flex items-center gap-2 w-full text-left p-1.5 hover:bg-gray-100 rounded"
            >
              <span className="text-sm">🎯</span>
                <span className="text-sm">Our Value Identification To Realization Services</span>
            </button>
            </div>

          <div className="space-y-2">
            <button 
              onClick={() => setShowWhyUsModal(true)}
              className="flex items-center gap-2 w-full text-left p-1.5 hover:bg-gray-100 rounded"
            >
              <span className="text-sm">🏆</span>
                <span className="text-sm">Why Us</span>
            </button>
          </div>

          <div className="space-y-2">
            <button 
              onClick={() => setShowChatHistoryDropdown(!showChatHistoryDropdown)}
              className="flex items-center gap-2 w-full text-left p-1.5 hover:bg-gray-100 rounded"
            >
              <span className="text-sm">📚</span>
              <span className="text-sm">Chat History</span>
              <svg 
                className={`w-3 h-3 ml-auto transition-transform ${showChatHistoryDropdown ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Chat History Dropdown */}
            {showChatHistoryDropdown && (
              <div className="pl-8 space-y-1 text-sm text-gray-600">
                {/* New Chat Button */}
                <button
                  onClick={startNewChat}
                  className="block w-full text-left hover:text-blue-600 transition-colors cursor-pointer text-sm font-medium text-blue-600 border-b border-gray-200 pb-1 mb-1"
                >
                  ✨ New Chat
                </button>
                
                {isLoadingChatHistory ? (
                  <div className="text-gray-500 italic">Loading...</div>
                ) : chatHistory.length > 0 ? (
                  chatHistory.map((session, index) => (
                    <div
                      key={session.id || index}
                      className={`group flex items-center justify-between hover:bg-gray-50 rounded p-1 ${
                        currentChatSession === session.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <button
                        onClick={() => loadChatBatch(session.id)}
                        className={`flex-1 text-left hover:text-blue-600 transition-colors cursor-pointer text-sm truncate ${
                          currentChatSession === session.id ? 'text-blue-600' : ''
                        }`}
                        title={session.title || `Chat ${index + 1}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">{session.title || `Chat ${index + 1}`}</span>
                          {session.message_count > 0 && (
                            <span className="text-xs text-gray-400 ml-2">
                              {session.message_count} msg
                            </span>
                          )}
                        </div>
                      </button>
                      <button
                        onClick={(e) => deleteChatBatch(session.id, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 text-xs p-1"
                        title="Delete chat"
                      >
                        🗑️
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 italic">No chat history</div>
                )}
            </div>
            )}
          </div>



          {/* <div className="space-y-2">
            <button className="flex items-center gap-2 w-full text-left p-2 hover:bg-gray-100 rounded">
              <span>📄</span>
                <span>Recent charts and reports</span>
            </button>
            <div className="pl-8 space-y-2 text-sm text-gray-600">
              <div>CAT revenue chart</div>
              <div>Machinery industry report</div>
              <div>AI Agents in Industrials</div>
            </div>
          </div> */}
        </div>
      </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Desktop Header - hidden on mobile, shown only on lg+ screens */}
        <div className="hidden lg:block border-b bg-white absolute left-0 right-0 h-20 lg:h-24">
          <div className="flex items-center h-full relative border">
            {/* Logo container - hide on mobile and show only on desktop */}
            <div className="hidden lg:block h-12 w-fit  overflow-visible pl-4 lg:pl-6 xl:pl-7">
              <img 
                src="/deep.PNG" 
                alt="GetDeep.AI" 
                className="w-full h-full"
              />
            </div>
            
            {/* GetDeeper icon container with user profile - hidden on mobile */}
            <div className="hidden lg:flex flex-1 justify-end items-center gap-3 lg:gap-4 xl:gap-6">
              <div className="absolute top-1 lg:top-2 left-1/2 transform -translate-x-1/2 lg:mr-[15%] xl:mr-[20%] 2xl:mr-[25%]">  
                <button
                  onClick={() => setShowPricingModal(true)}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  title="Upgrade to Pro"
                >
                  <img 
                    src="/GetDeeperIcons.png" 
                    alt="Pro" 
                    className="h-12 w-fit mt-3"
                  />
                </button>
              </div>
              
              {/* User Profile - hidden on mobile */}
              <div className="absolute right-3 lg:right-4 xl:right-6" ref={profileDropdownRef}>
                <div className="flex items-center gap-2 lg:gap-3 xl:gap-4">
                  <div className="text-right relative">
                    <button
                      className="text-lg lg:text-xl xl:text-2xl font-medium focus:outline-none"
                      onClick={() => setProfileDropdownOpen((open) => !open)}
                    >
                      {userName}
                    </button>
                    {profileDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-50">
                        {/* User Profile Section */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#1B5A7D] rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {userInitials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {userName}
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
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="py-1">
                          <button
                            onClick={() => {
                              navigate('/profile');
                              setProfileDropdownOpen(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            View Profile
                          </button>
                          <button
                            onClick={logout}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Sign out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="w-8 lg:w-9 xl:w-10 2xl:w-12 h-8 lg:h-9 xl:h-10 2xl:h-12 bg-[#1B5A7D] rounded-full flex items-center justify-center text-white text-sm lg:text-base xl:text-lg">
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
            <div className="fixed left-0 top-0 h-full w-64 xm:w-72 xs:w-80 sm:w-96 md:w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <img src="/deep.PNG" alt="GetDeep.AI" className="h-9 w-fit opacity-100" style={{ filter: 'contrast(1.2) brightness(1.1)' }} />
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                  aria-label="Close menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Navigation Items */}
              <div className="px-3 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <button 
                    onClick={() => {
                      setShowContactModal(true);
                      setIsMobileSidebarOpen(false);
                    }}
                    className="flex items-center gap-2 sm:gap-3 w-full text-left p-2 sm:p-3 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span className="text-base sm:text-lg">📞</span>
                    <span className="text-sm sm:text-base">Contact Us</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <button 
                    onClick={() => setShowCapabilitiesDropdown(!showCapabilitiesDropdown)}
                    className="flex items-center gap-2 sm:gap-3 w-full text-left p-2 sm:p-3 hover:bg-gray-100 rounded-lg transition-colors"
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
                        chatHistory.map((chat) => (
                          <button
                            key={chat.id}
                            onClick={() => {
                              loadChatBatch(chat.id);
                              setIsMobileSidebarOpen(false);
                            }}
                            className="block w-full text-left text-xs sm:text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors p-1.5 sm:p-2 rounded truncate"
                          >
                            {chat.title}
                          </button>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 p-2">No chat history</div>
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
                    <div className="w-10 h-10 bg-[#1B5A7D] rounded-full flex items-center justify-center text-white">
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 xm:gap-3 xs:gap-3 sm:gap-4 md:gap-5 lg:gap-5 xl:gap-6">
            {/* Chart Section - full width on mobile */}
            <div className="lg:col-span-6">
              <div className="bg-white rounded-lg p-2 xm:p-3 xs:p-3.5 sm:p-4 md:p-5 lg:p-5 xl:p-6 shadow-sm" ref={performanceCardRef} id="bp-print-area">
                {/* Chart Header with Save Button */}
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
                        : 'bg-[#1B5A7D] text-white hover:bg-[#164964]'
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

        {/* Metrics Selector */}
                <div className="overflow-x-auto -mx-1 xm:-mx-1.5 xs:-mx-2 sm:-mx-4 md:mx-0">
                  <div className="space-y-1.5 xm:space-y-2 xs:space-y-2.5 sm:space-y-3 md:space-y-3.5 lg:space-y-3.5 xl:space-y-4 min-w-max px-1 xm:px-1.5 xs:px-2 sm:px-4 md:px-0">
                    <div className="flex gap-2 xm:gap-2.5 xs:gap-3 sm:gap-3 md:gap-3.5 lg:gap-3.5 xl:gap-4">
                      <button 
                        onClick={() => setActiveChart('metrics')}
                        className={`px-2 py-1.5 xm:px-2.5 xm:py-1.5 xs:px-3 xs:py-2 sm:px-3 sm:py-2 md:px-3.5 md:py-2 lg:px-3.5 lg:py-2 xl:px-4 xl:py-2 text-xs xm:text-xs xs:text-sm sm:text-sm md:text-base lg:text-base xl:text-base rounded ${
                          activeChart === 'metrics' ? 'bg-[#E5F0F6] text-[#1B5A7D]' : 'text-gray-600'
                        }`}
                      >
                        Across Metrics
                      </button>
                      <button 
                        onClick={() => setActiveChart('peers')}
                        className={`px-2 py-1.5 xm:px-2.5 xm:py-1.5 xs:px-3 xs:py-2 sm:px-3 sm:py-2 md:px-3.5 md:py-2 lg:px-3.5 lg:py-2 xl:px-4 xl:py-2 text-xs xm:text-xs xs:text-sm sm:text-sm md:text-base lg:text-base xl:text-base ${
                          activeChart === 'peers' ? 'bg-[#E5F0F6] text-[#1B5A7D]' : 'text-gray-600'
                        }`}
                      >
                        Across Peers
                      </button>
                      <button 
                        onClick={() => setActiveChart('industry')}
                        className={`px-2 py-1.5 xm:px-2.5 xm:py-1.5 xs:px-3 xs:py-2 sm:px-3 sm:py-2 md:px-3.5 md:py-2 lg:px-3.5 lg:py-2 xl:px-4 xl:py-2 text-xs xm:text-xs xs:text-sm sm:text-sm md:text-base lg:text-base xl:text-base ${
                          activeChart === 'industry' ? 'bg-[#E5F0F6] text-[#1B5A7D]' : 'text-gray-600'
                        }`}
                      >
                        Across Industry
                      </button>
          </div>
          <div className="flex gap-4">
                      <button 
                        onClick={() => setSelectedPeriod('1Y')}
                        className={`px-4 py-1 rounded text-sm ${
                          selectedPeriod === '1Y' 
                            ? 'bg-[#E5F0F6] text-[#1B5A7D]' 
                            : 'text-gray-600'
                        }`}
                      >
                        {activeChart === 'industry' ? 'Last 1Y' : 'Annual'}
                      </button>
                      <button 
                        onClick={() => setSelectedPeriod('2Y')}
                        className={`px-4 py-1 rounded text-sm ${
                          selectedPeriod === '2Y' 
                            ? 'bg-[#E5F0F6] text-[#1B5A7D]' 
                            : 'text-gray-600'
                        }`}
                      >
                        {activeChart === 'industry' ? 'Last 2Ys' : '2Ys'}
                      </button>
                      <button 
                        onClick={() => setSelectedPeriod('3Y')}
                        className={`px-4 py-1 rounded text-sm ${
                          selectedPeriod === '3Y' 
                            ? 'bg-[#E5F0F6] text-[#1B5A7D]' 
                            : 'text-gray-600'
                        }`}
                      >
                        {activeChart === 'industry' ? 'Last 3Ys' : '3Ys'}
                      </button>
                      <button 
                        onClick={() => setSelectedPeriod('4Y')}
                        className={`px-4 py-1 rounded text-sm ${
                          selectedPeriod === '4Y' 
                            ? 'bg-[#E5F0F6] text-[#1B5A7D]' 
                            : 'text-gray-600'
                        }`}
                      >
                        {activeChart === 'industry' ? 'Last 4Ys' : '4Ys'}
                      </button>
                      <button 
                        onClick={() => setSelectedPeriod('5Y')}
                        className={`px-4 py-1 rounded text-sm ${
                          selectedPeriod === '5Y' 
                            ? 'bg-[#E5F0F6] text-[#1B5A7D]' 
                            : 'text-gray-600'
                        }`}
                      >
                        {activeChart === 'industry' ? 'Last 5Ys' : '5Ys'}
                      </button>
                      <button 
                        onClick={() => setSelectedPeriod('10Y')}
                        className={`px-4 py-1 rounded text-sm ${
                          selectedPeriod === '10Y' 
                            ? 'bg-[#E5F0F6] text-[#1B5A7D]' 
                            : 'text-gray-600'
                        }`}
                      >
                        {activeChart === 'industry' ? 'Last 10Ys' : '10Ys'}
                      </button>
                      <button 
                        onClick={() => setSelectedPeriod('15Y')}
                        className={`px-4 py-1 rounded text-sm ${
                          selectedPeriod === '15Y' 
                            ? 'bg-[#E5F0F6] text-[#1B5A7D]' 
                            : 'text-gray-600'
                        }`}
                      >
                        {activeChart === 'industry' ? 'Last 15Ys' : '15Ys'}
                      </button>
                      <button 
                        onClick={() => setSelectedPeriod('20Y')}
                        className={`px-4 py-1 rounded text-sm ${
                          selectedPeriod === '20Y' 
                            ? 'bg-[#E5F0F6] text-[#1B5A7D]' 
                            : 'text-gray-600'
                        }`}
                      >
                        {activeChart === 'industry' ? 'Last 20Ys' : '20Ys'}
                      </button>
                    </div>
          </div>
        </div>

                {/* Chart Content */}
                <div className="mt-4 xl:mt-6">
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3 xl:gap-4 mb-3 sm:mb-4">
            {/* Industry selection - moved to top */}
            {activeChart === 'industry' && (
              <div className="col-span-full">
                <div className="text-sm xl:text-base text-gray-500">Industry</div>
                <div className="relative" ref={industryDropdownRef}>
                  <input
                    type="text"
                    placeholder="Search industries..."
                    value={industrySearch}
                    onChange={(e) => setIndustrySearch(e.target.value)}
                    onFocus={() => setShowIndustryDropdown(true)}
                    className="w-full font-medium text-sm xl:text-base px-3 py-2 pr-8 border border-gray-200 rounded focus:outline-none focus:border-[#1B5A7D] focus:ring-1 focus:ring-[#1B5A7D]"
                  />
                  {industrySearch && (
                    <button
                      onClick={() => setIndustrySearch('')}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                  
                  {showIndustryDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
                      {availableIndustries
                        .filter(industry => 
                          industry.label.toLowerCase().includes(industrySearch.toLowerCase()) ||
                          industry.value.toLowerCase().includes(industrySearch.toLowerCase())
                        )
                        .map(industry => (
                          <div
                            key={industry.value}
                            onClick={() => {
                              setSelectedIndustry(industry.value);
                              setIndustrySearch(industry.label);
                              setShowIndustryDropdown(false);
                            }}
                            className="px-3 py-2 text-sm xl:text-base hover:bg-gray-100 cursor-pointer"
                          >
                            {industry.label.replace(/  +/g, ' ')}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Company Search */}
            <div>
              <div className="text-sm xl:text-base text-gray-500">Company</div>
              {activeChart === 'peers' ? (
                <div className="relative" ref={companyDropdownRef}>
                  <div className="flex flex-wrap gap-2 p-2 border border-gray-200 rounded min-h-[42px]">
                    {selectedCompanies.map((company, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm"
                      >
                        {company.name || company.ticker}
                        <button
                          onClick={() => setSelectedCompanies(companies => 
                            companies.filter((_, i) => i !== index)
                          )}
                          className="text-gray-400 hover:text-gray-600"
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
                      className="flex-1 min-w-[100px] outline-none text-sm"
                    />
                  </div>
                  
                  {showCompanyDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
                      {availableIndustries
                        .flatMap(industry => industry.companies)
                        .filter((ticker, index, self) => self.indexOf(ticker) === index) // Remove duplicates
                        .filter(ticker => {
                          const displayName = companyMap[ticker] || ticker;
                          return ticker.toLowerCase().includes(companyInput.toLowerCase()) || 
                                 displayName.toLowerCase().includes(companyInput.toLowerCase());
                        })
                        .sort((a, b) => a.localeCompare(b))
                        .map(ticker => {
                          const displayName = companyMap[ticker] || ticker;
                          
                          return (
                            <div
                              key={ticker}
                              onClick={() => {
                                if (!selectedCompanies.some(c => c.ticker === ticker)) {
                                  setSelectedCompanies([...selectedCompanies, { ticker, name: displayName }]);
                                }
                                setCompanyInput('');
                                setShowCompanyDropdown(false);
                              }}
                              className="px-3 py-2 text-sm xl:text-base hover:bg-gray-100 cursor-pointer"
                            >
                              {displayName} ({ticker})
                            </div>
                          );
                        })}
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
                    }}
                    onFocus={() => setShowCompanyDropdown(true)}
                    className="w-full font-medium text-sm xl:text-base px-3 py-2 pr-8 border border-gray-200 rounded focus:outline-none focus:border-[#1B5A7D] focus:ring-1 focus:ring-[#1B5A7D]"
                  />
                  {selectedTicker && (
                    <button
                      onClick={() => {
                        setSelectedTicker('');
                        setCompanySearch('');
                      }}
                      className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
                      {availableIndustries
                        .find(ind => ind.value === selectedIndustry)
                        ?.companies
                        .filter(ticker => {
                          const displayName = companyMap[ticker] || ticker;
                          return ticker.toLowerCase().includes(companySearch.toLowerCase()) ||
                                 displayName.toLowerCase().includes(companySearch.toLowerCase());
                        })
                        .sort((a, b) => a.localeCompare(b))
                        .map(ticker => {
                          const displayName = companyMap[ticker] || ticker;

                          return (
                            <div
                              key={ticker}
                              onClick={() => {
                                setSelectedTicker(ticker);
                                setCompanySearch('');
                                setShowCompanyDropdown(false);
                              }}
                              className="px-3 py-2 text-sm xl:text-base hover:bg-gray-100 cursor-pointer"
                            >
                              {displayName} ({ticker})
                            </div>
                          );
                        })}
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
                    className="w-full font-medium text-sm xl:text-base px-3 py-2 pr-8 border border-gray-200 rounded focus:outline-none focus:border-[#1B5A7D] focus:ring-1 focus:ring-[#1B5A7D]"
                  />
                  {searchValue && (
                    <button
                      onClick={() => setSearchValue('')}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
                      {availableIndustries.flatMap(industry => 
                        industry.companies.filter(ticker => {
                          const displayName = companyMap[ticker] || ticker;
                          return ticker.toLowerCase().includes(searchValue.toLowerCase()) ||
                                 displayName.toLowerCase().includes(searchValue.toLowerCase());
                        }).map(ticker => {
                          const displayName = companyMap[ticker] || ticker;
                          return (
                            <div
                              key={ticker}
                              onClick={() => {
                                setSearchValue(ticker);
                                setShowCompanyDropdown(false);
                              }}
                              className="px-3 py-2 text-sm xl:text-base hover:bg-gray-100 cursor-pointer"
                            >
                              {displayName} ({ticker})
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Metric Search */}
            <div>
              <div className="text-sm xl:text-base text-gray-500">Metric</div>
              {activeChart === 'peers' ? (
                <div className="relative" ref={peerDropdownRef}>
                  <input
                    type="text"
                    placeholder="Search metrics..."
                    value={peerMetricSearch || selectedPeerMetric}
                    onChange={(e) => {
                      setPeerMetricSearch(e.target.value);
                      setSelectedPeerMetric('');
                    }}
                    onFocus={() => setShowPeerMetricDropdown(true)}
                    className="w-full font-medium text-sm xl:text-base px-3 py-2 pr-8 border border-gray-200 rounded focus:outline-none focus:border-[#1B5A7D] focus:ring-1 focus:ring-[#1B5A7D]"
                  />
                  {(peerMetricSearch || selectedPeerMetric) && (
                    <button
                      onClick={() => {
                        setPeerMetricSearch('');
                        setSelectedPeerMetric('');
                      }}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                  
                  {showPeerMetricDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
                      {availableMetrics
                        .filter(metric => 
                          metric.label.toLowerCase().includes(peerMetricSearch.toLowerCase()) ||
                          metric.value.toLowerCase().includes(peerMetricSearch.toLowerCase())
                        )
                        .map(metric => (
                          <div
                            key={metric.value}
                            onClick={() => {
                              setSelectedPeerMetric(metric.value);
                              setPeerMetricSearch('');
                              setShowPeerMetricDropdown(false);
                            }}
                            className="px-3 py-2 text-sm xl:text-base hover:bg-gray-100 cursor-pointer"
                          >
                        {metric.label}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : activeChart === 'metrics' ? (
                <div className="space-y-3">
                  {/* Search box with selected metrics */}
                  <div className="flex flex-wrap gap-2 p-2 border border-gray-200 rounded min-h-[42px]">
                    {selectedSearchMetrics.map((metric, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm"
                      >
                        {metric}
                        <button
                          onClick={() => setSelectedSearchMetrics(metrics => 
                            metrics.filter((_, i) => i !== index)
                          )}
                          className="text-gray-400 hover:text-gray-600"
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
                  </div>

                  {/* Updated metric search dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <input
                      type="text"
                      placeholder="Search metrics..."
                      value={searchMetricInput}
                      onChange={(e) => setSearchMetricInput(e.target.value)}
                      onFocus={() => setShowMetricDropdown(true)}
                      className="w-full font-medium text-sm xl:text-base px-3 py-2 pr-8 border border-gray-200 rounded focus:outline-none focus:border-[#1B5A7D] focus:ring-1 focus:ring-[#1B5A7D]"
                    />
                    {searchMetricInput && (
                      <button
                        onClick={() => {
                          setSearchMetricInput('');
                          setShowMetricDropdown(false);
                        }}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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

                    {showMetricDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
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
                              className="px-3 py-2 text-sm xl:text-base hover:bg-gray-100 cursor-pointer"
                            >
                            {metric.label}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Selected metrics as chips */}
                  <div className="flex flex-wrap gap-2 p-2 border border-gray-200 rounded min-h-[42px]">
                    {selectedIndustryMetrics.map((metric, index) => {
                      const metricLabel = availableMetrics.find(m => m.value === metric)?.label || metric;
                      return (
                        <div 
                          key={index} 
                          className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm"
                        >
                          {metricLabel}
                          <button
                            onClick={() => setSelectedIndustryMetrics(metrics => 
                              metrics.filter((_, i) => i !== index)
                            )}
                            className="text-gray-400 hover:text-gray-600"
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
                  </div>
                  
                  <div className="relative" ref={dropdownRef}>
                    <input
                      type="text"
                      placeholder="Search metrics..."
                      value={industryMetricInput}
                      onChange={(e) => setIndustryMetricInput(e.target.value)}
                      onFocus={() => setShowMetricDropdown(true)}
                      className="w-full font-medium text-sm xl:text-base px-3 py-2 pr-8 border border-gray-200 rounded focus:outline-none focus:border-[#1B5A7D] focus:ring-1 focus:ring-[#1B5A7D]"
                      disabled={selectedIndustryMetrics.length >= 3}
                    />
                    {industryMetricInput && (
                      <button
                        onClick={() => {
                          if (selectedIndustryMetrics.length >= 3) {
                            alert('Maximum of 3 metrics allowed');
                            return;
                          }
                          setSelectedIndustryMetrics([...selectedIndustryMetrics, industryMetricInput]);
                          setIndustryMetricInput('');
                          setShowMetricDropdown(false);
                        }}
                        className={`px-3 py-2 text-sm xl:text-base cursor-pointer ${
                          selectedIndustryMetrics.length >= 3 
                            ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {industryMetricInput}
                      </button>
                    )}
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    
                    {showMetricDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
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
                                if (selectedIndustryMetrics.length >= 3) {
                                  alert('Maximum of 3 metrics allowed');
                                  return;
                                }
                                setSelectedIndustryMetrics([...selectedIndustryMetrics, metric.value]);
                                setIndustryMetricInput('');
                                setShowMetricDropdown(false);
                              }}
                              className={`px-3 py-2 text-sm xl:text-base cursor-pointer ${
                                selectedIndustryMetrics.length >= 3 
                                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
                                  : 'hover:bg-gray-100'
                              }`}
                            >
                              {metric.label}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

                <div className="h-[180px] xs:h-[200px] sm:h-[300px] md:h-[350px] xl:h-[400px] overflow-y-auto p-2 sm:p-4 xl:p-6 space-y-3 sm:space-y-4 bp-scroll">
                  {activeChart === 'metrics' ? (
                    // Metrics Chart
                    isLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <span>Loading...</span>
                      </div>
                    ) : error ? (
                      <div className="flex items-center justify-center h-full text-red-500">
                        {error}
                      </div>
                    ) : chartData.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        No data available
                      </div>
                    ) : ( 
                      <div ref={chartContainerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart 
                            data={chartData}
                            onMouseMove={e => {
                              if (e && e.activePayload && e.activePayload.length > 0) {
                                const payload = e.activePayload[0].payload;
                                const isFixedPoint = selectedPeriod === '1Y' 
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
                                  if (selectedPeriod !== '1Y') {
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
                                  if (selectedPeriod !== '1Y') {
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
                                  if ((selectedPeriod === '1Y' && point.name?.startsWith('2024')) || 
                                      (selectedPeriod !== '1Y' && point.name === chartData[chartData.length - 1]?.name)) {
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
                            {selectedSearchMetrics.map((metric, idx) => {
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
                                  connectNulls={false}  // Add this prop to each Line component
                                />
                              );
                            })}
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
                      <div ref={chartContainerRef} style={{ position: 'relative', width: '100%', height: 400 }}>
                        <ResponsiveContainer width="100%" height="100%">
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
                                  if (selectedPeriod !== '1Y') {
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
                            {selectedCompanies.map((company, idx) => {
                              const color = generateColorPalette(selectedCompanies.length)[idx];
                              return (
                                <Line
                                  key={company.ticker}
                                  type="monotone"
                                  dataKey={`${selectedPeerMetric}.${company.ticker}`}
                                  stroke={color}
                                  name={`${company.ticker} - ${selectedPeerMetric}`}
                                  strokeWidth={2}
                                  dot={{
                                    fill: color,
                                    r: 4
                                  }}
                                  connectNulls={false}
                                />
                              );
                            })}
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
                      <BoxPlot
                        data={industryChartData}
                        title={selectedIndustryMetrics.map(metric => 
                          availableMetrics.find(m => m.value === metric)?.label || metric
                        ).join(' vs ')}
                        companyNames={industryCompanyNames}
                        selectedTicker={selectedTicker}
                      />
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

            {/* Insights Generation - full width on mobile */}
            <div className="lg:col-span-4 lg:mr-[-11rem]">
              <div className="mt-2 xm:mt-2.5 xs:mt-3 sm:mt-3 md:mt-3.5 lg:mt-4">
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-2 xm:p-3 xs:p-3.5 sm:p-4 md:p-5 lg:p-5 xl:p-6 border-b flex justify-between items-center">
                    <div className="flex items-center gap-1.5 xm:gap-2 xs:gap-2.5 sm:gap-2 md:gap-2.5 lg:gap-2.5 xl:gap-3">
                      <h2 className="text-sm xm:text-base xs:text-lg sm:text-lg md:text-xl lg:text-xl xl:text-2xl font-medium">Insights Generation</h2>
                      {/* <button className="w-8 xl:w-10 h-8 xl:h-10 bg-[#1B5A7D] text-white rounded text-xl">+</button> */}
                    </div>
                    <div className="flex items-center gap-1.5 xm:gap-2 xs:gap-2 sm:gap-2">
                      {/* Clear Chat Button */}
                      <button
                        className="px-1.5 py-1.5 xm:px-2 xm:py-2 xs:px-2 xs:py-2 sm:px-2 sm:py-2 text-xs xm:text-sm xs:text-sm sm:text-sm md:text-base lg:text-base xl:text-base bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        title="Click to reset conversation"
                        onClick={() => {
                          const event = new CustomEvent('clearChat');
                          window.dispatchEvent(event);
                        }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <svg width="14" height="14" className="xm:w-4 xm:h-4 xs:w-4 xs:h-4 sm:w-[18px] sm:h-[18px]" fill="none" viewBox="0 0 20 20">
                          <path d="M6 6l8 8M6 14L14 6" stroke="#1B5A7D" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                      {/* Save Conversation Button */}
                      <button 
                        onClick={saveConversation}
                        disabled={isSavingConversation || messages.length <= 1}
                        className={`px-3 xl:px-4 py-2 text-sm xl:text-base rounded transition-colors ${
                          isSavingConversation || messages.length <= 1
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-[#1B5A7D] text-white hover:bg-[#164964]'
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
                    </div>
                  </div>
                  
                  {/* Chat Header with New Chat Button */}
                  <div className="flex items-center justify-between p-4 xl:p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {currentChatSession ? 'Chat Session' : 'New Chat'}
                    </h3>
                    <button
                      onClick={startNewChat}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      ✨ New Chat
                    </button>
                  </div>
                  
                  {/* Chat Messages */}
                  <div 
                    ref={chatMessagesRef}
                    className="h-[200px] xs:h-[250px] sm:h-[300px] md:h-[400px] xl:h-[500px] overflow-y-auto p-2 sm:p-4 xl:p-6 space-y-3 sm:space-y-4"
                  >
                    {messages.map((message, index) => 
                      message.role === 'assistant' ? (
                        <div key={index} className="flex gap-3 xl:gap-4">
                          <div className="w-8 xl:w-10 h-8 xl:h-10 bg-[#1B5A7D] rounded-full flex items-center justify-center text-white text-sm xl:text-base">
                            AI
                          </div>
                          <div className="flex-1">
                            <div className={`bg-[#E5F0F6] rounded-lg p-3 xl:p-4 text-sm xl:text-base ${
                              message.content === 'Thinking...' ? 'animate-pulse italic text-gray-600' : ''
                            }`}>
                              {message.content}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div key={index} className="flex gap-3 justify-end xl:gap-4">
                          <div className="flex-1">
                            <div className="bg-gray-100 rounded-lg p-3 xl:p-4 text-sm xl:text-base ml-auto max-w-[80%]">
                              {message.content}
                            </div>
                          </div>
                          <div className="w-8 xl:w-10 h-8 xl:h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm xl:text-base">
                            {userInitials}
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="p-4 xl:p-6 border-t">
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
                        className="flex-1 px-3 xl:px-4 py-2 xl:py-3 text-sm xl:text-base border rounded-lg"
                      />
                      <button 
                        type="button" 
                        className={`p-1 xl:p-2 rounded transition-colors ${
                          isListening 
                            ? 'bg-red-100 hover:bg-red-200' 
                            : 'hover:bg-gray-100'
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
                        className="p-1 xl:p-2 rounded transition-colors hover:bg-gray-100"
                        title="Upload files"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <span className="text-2xl font-bold text-[#1B5A7D]">+</span>
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
                        className="p-2 xl:p-3 bg-[#1B5A7D] text-white rounded hover:bg-[#164964] disabled:bg-gray-300 disabled:cursor-not-allowed"
                        disabled={!inputValue.trim() || isChatLoading}
                      >
                        <span className="text-lg">{isChatLoading ? '⏳' : '➤'}</span>
                      </button>
                    </form>
                    
                    {/* Chat Disclaimer - beneath the input area */}
                    <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded text-center">
                      💡 AI responses may be inaccurate. We will continue to fine tune to improve the accuracy.
                    </div>
                    
                    {/* Uploaded Files Display */}
                    {uploadedFiles.length > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Uploaded Files:</span>
                          <button
                            onClick={() => setUploadedFiles([])}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Clear All
                          </button>
                  </div>
                        <div className="space-y-2">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                              <div className="flex items-center space-x-2">
                                <span className="text-blue-600">📎</span>
                                <span className="text-sm text-gray-700 truncate max-w-48">{file.name}</span>
                                <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
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
                </div>
              </div>
            </div>
          </div>
        </div>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5A7D] focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5A7D] focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5A7D] focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5A7D] focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5A7D] focus:border-transparent"
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
  );
}

export default Dashboard; 