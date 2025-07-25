import { useState, useEffect } from 'react';
import baseUrl from './api';

interface ChatboxProps {
  chartData: any[];
  searchValue: string;
  selectedPeriod: string;
  selectedMetrics: string[];
  activeChart: string;
  selectedCompanies: any[];
  currentChatSession?: number | null;
  onSessionUpdate?: () => void;
  uploadedFiles?: File[];
  onClearFiles?: () => void;
  onAuthError?: () => void;
}

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

export const useChat = ({
  chartData,
  searchValue,
  selectedPeriod,
  selectedMetrics,
  activeChart,
  selectedCompanies,
  currentChatSession,
  onSessionUpdate,
  uploadedFiles,
  onClearFiles,
  onAuthError,
}: ChatboxProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'I can help you analyze this data. What would you like to know?'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

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

  const saveMessageToSession = async (question: string, answer: string) => {
    if (!currentChatSession) return;
    
    try {
      const token = localStorage.getItem('access');
      if (!token) return;

      const response = await fetch(`${baseUrl}/api/chat/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          answer
        }),
      });

      if (response.ok && onSessionUpdate) {
        onSessionUpdate();
      }
    } catch (error) {
      console.error('Error saving message to session:', error);
    }
  };

  // Log context changes
  useEffect(() => {
    console.log('Chart Context:', {
      company: searchValue?.split(':')[0]?.trim() || '',
      metrics: selectedMetrics,
      period: selectedPeriod,
      chartType: activeChart
    });
  }, [searchValue, selectedMetrics, selectedPeriod, activeChart]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    setIsChatLoading(true);

    try {
      // Add user message with file information
      let messageContent = message;
      if (uploadedFiles && uploadedFiles.length > 0) {
        const fileNames = uploadedFiles.map(file => file.name).join(', ');
        messageContent = `${message}\n\n📎 Attached files: ${fileNames}`;
      }
      
    const userMessage: Message = {
      role: 'user',
        content: messageContent
    };
    setMessages(prev => [...prev, userMessage]);

      // Add thinking message after user message
    const thinkingMessage: Message = {
      role: 'assistant',
      content: 'Thinking...'
    };
    setMessages(prev => [...prev, thinkingMessage]);

      const company = searchValue.includes(':') 
        ? searchValue.split(':')[1].trim().toUpperCase()
        : searchValue.split(':')[0].trim().toUpperCase();

      const allChartData = chartData;

      const formattedChartData = allChartData
        .filter(point =>
          selectedMetrics.some(metric =>
            point[metric] !== null && point[metric] !== undefined
          )
        )
        .map(point => {
          const formattedPoint: Record<string, any> = { name: point.date || point.name };
          selectedMetrics.forEach(metric => {
            if (point[metric] !== null && point[metric] !== undefined) {
              formattedPoint[metric] = point[metric];
            }
          });
          return formattedPoint;
        });

      const getLatestYear = () => {
        const years = chartData
          .map(point => {
            if (point.date) return parseInt(point.date);
            if (point.name) return parseInt(point.name);
            return null;
          })
          .filter((y): y is number => y !== null && !isNaN(y));
        return years.length ? Math.max(...years) : new Date().getFullYear();
      };

      const getYearFromPeriod = (period: string) => {
        const latestYear = getLatestYear();
        if (!period) return null;
        const mapping: { [key: string]: number } = {
          '1Y': 0, '2Y': 1, '3Y': 2, '4Y': 3, '5Y': 4, '10Y': 9, '15Y': 14, '20Y': 19
        };
        return mapping[period] !== undefined ? latestYear - mapping[period] : null;
      };

      const payload = {
        company: company,
        metric_name: selectedMetrics,
        year: getYearFromPeriod(selectedPeriod),
        companies: selectedCompanies.map(c => c.ticker)
      };

      // Get authorization token
      const token = localStorage.getItem('access');
      if (!token) {
        throw new Error('No authorization token found. Please log in again.');
      }

      // Prepare form data if files are uploaded
      let requestBody: string | FormData;
      let headers: Record<string, string>;

      if (uploadedFiles && uploadedFiles.length > 0) {
        // Use FormData for file uploads
        const formData = new FormData();
        formData.append('question', message);
        formData.append('payload', JSON.stringify(payload));
        formData.append('company', company);
        formData.append('period', selectedPeriod || 'ALL');
        formData.append('metrics', JSON.stringify(selectedMetrics || []));
        formData.append('chartType', activeChart || 'line');
        formData.append('chartData', JSON.stringify(formattedChartData));
        
        // Add uploaded files
        uploadedFiles.forEach((file, index) => {
          formData.append(`file_${index}`, file);
        });
        
        requestBody = formData;
        headers = {
          'Authorization': `Bearer ${token}`,
        }; // Don't set Content-Type for FormData, but include Authorization
      } else {
        // Use JSON for text-only requests
        requestBody = JSON.stringify({
          question: message,
          payload: payload,
          company,
          period: selectedPeriod || 'ALL',
          metrics: selectedMetrics || [],
          chartType: activeChart || 'line',
          chartData: formattedChartData
        });
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        };
      }

      const response = await fetch(`${baseUrl}/api/chat/`, {
        method: 'POST',
        headers,
        body: requestBody,
      });

      if (response.status === 401) {
        // Try to refresh token
        const newToken = await refreshToken();
        if (newToken) {
          // Retry the request with new token
          headers['Authorization'] = `Bearer ${newToken}`;
          const retryResponse = await fetch(`${baseUrl}/api/chat/`, {
            method: 'POST',
            headers,
            body: requestBody,
          });
          
          if (retryResponse.ok) {
            // Continue with the retry response
            const responseText = await retryResponse.text();
            console.log("Raw text from server (retry):", responseText);
            const data = JSON.parse(responseText);
            console.log("Parsed JSON response (retry):", data);
            
            const aiMessageContent =
              typeof data === 'string' ? data :
              data.data?.final_text_answer || data.answer || data.data || data.result || data.message || data.error ||
              "Sorry, I didn't get a proper response from the server.";

            // Remove the thinking message and add the AI response
            setMessages(prev => prev.filter(msg => msg.content !== 'Thinking...'));
            
            const aiMessage: Message = {
              role: 'assistant',
              content: aiMessageContent
            };

            setMessages(prev => [...prev, aiMessage]);
            
            // Save the conversation to the current session
            await saveMessageToSession(message, aiMessageContent);
            
            // Clear uploaded files after successful send
            if (onClearFiles) {
              console.log('Clearing uploaded files...');
              onClearFiles();
            }
            
            setIsChatLoading(false);
            return;
          }
        }
        
        // If refresh failed or retry failed, trigger auth error
        if (onAuthError) {
          onAuthError();
        }
        throw new Error('Authentication failed. Please sign in again.');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log("Raw text from server:", responseText);

      const data = JSON.parse(responseText);
      console.log("Parsed JSON response:", data);

      const aiMessageContent =
        typeof data === 'string' ? data :
        data.data?.final_text_answer || data.answer || data.data || data.result || data.message || data.error ||
        "Sorry, I didn't get a proper response from the server.";

      // Remove the thinking message and add the AI response
      setMessages(prev => prev.filter(msg => msg.content !== 'Thinking...'));
      
      const aiMessage: Message = {
        role: 'assistant',
        content: aiMessageContent
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Save the conversation to the current session
      await saveMessageToSession(message, aiMessageContent);
      
      // Clear uploaded files after successful send
      if (onClearFiles) {
        console.log('Clearing uploaded files...');
        onClearFiles();
      }
      
      setIsChatLoading(false);

    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the thinking message
      setMessages(prev => prev.filter(msg => msg.content !== 'Thinking...'));
      
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsChatLoading(false);
    }
  };

  return {
    messages,
    inputValue,
    setInputValue,
    handleSendMessage,
    setMessages,
    isLoading: isChatLoading,
  };
};

export default useChat;
