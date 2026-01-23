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
  onNewContent?: () => void; // Callback when new content is added
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
  onNewContent,
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

      // Debounce this call to avoid too many requests
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
        // Debounce session updates to avoid excessive API calls
        setTimeout(() => {
          onSessionUpdate();
        }, 500);
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
    const userMessage: Message = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);
    
    // Mark that new content has been added
    if (onNewContent) {
      onNewContent();
    }

    // Add thinking message
    setMessages(prev => [...prev, { role: 'assistant', content: 'Thinking...' }]);

    try {
      const token = localStorage.getItem('access');
      if (!token) {
        throw new Error('No authorization token found. Please log in again.');
      }

      // Extract company from searchValue
      const company = searchValue.includes(':') 
        ? searchValue.split(':')[1].trim().toUpperCase()
        : searchValue.split(':')[0].trim().toUpperCase();

      // Convert uploaded files to base64 format
      const base64_images: string[] = [];
      const base64_files: string[] = [];
      const base64_audios: string[] = [];

      if (uploadedFiles && uploadedFiles.length > 0) {
        try {
          for (const file of uploadedFiles) {
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;
                // Convert to data URL format: data:mime/type;base64,...
                resolve(result);
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });

            // Categorize by file type
            const fileType = file.type.toLowerCase();
            if (fileType.startsWith('image/')) {
              base64_images.push(base64);
            } else if (fileType.startsWith('audio/')) {
              base64_audios.push(base64);
            } else {
              // PDF, TXT, CSV, DOC, DOCX, XLSX, XLS - all go to base64_files
              base64_files.push(base64);
            }
          }
          console.log(`Converted ${uploadedFiles.length} files to base64: ${base64_images.length} images, ${base64_files.length} documents, ${base64_audios.length} audios`);
        } catch (error) {
          console.error('Error converting files to base64:', error);
          // Continue without files if conversion fails
        }

        // Clear files from UI after conversion
        if (onClearFiles) {
          onClearFiles();
        }
      }

      // Prepare chat request payload
      const payload = {
        companies: selectedCompanies.map(company => company.ticker),
        chartData: chartData,
        searchValue: searchValue,
        selectedPeriod: selectedPeriod,
        selectedMetrics: selectedMetrics,
        activeChart: activeChart
      };

      const formattedChartData = chartData.map(item => ({
        name: item.name,
        ticker: item.ticker,
        value: item.value
      }));

      // Use JSON for chat request with base64 files included
      const requestBody = JSON.stringify({
          question: message,
          payload: payload,
          company,
          period: selectedPeriod || 'ALL',
          metrics: selectedMetrics || [],
          chartType: activeChart || 'line',
          chartData: formattedChartData,
          // Include session ID for chat history
          session_id: currentChatSession || null,
          // Include base64-encoded files for multimodal input
          base64_images: base64_images.length > 0 ? base64_images : undefined,
          base64_files: base64_files.length > 0 ? base64_files : undefined,
          base64_audios: base64_audios.length > 0 ? base64_audios : undefined
      });

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

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

            // Check if this is a quota exceeded response
            const isQuotaExceeded = data.quota_exceeded === true;

            // Remove the thinking message and add the AI response
            setMessages(prev => prev.filter(msg => msg.content !== 'Thinking...'));
            
            const aiMessage: Message = {
              role: 'assistant',
              content: aiMessageContent
            };

            setMessages(prev => [...prev, aiMessage]);
            
            // If quota exceeded, log for debugging
            if (isQuotaExceeded) {
              console.log('Quota exceeded for user plan:', data.plan);
            }
            
            // Update current session ID if provided in response
            if (data.session_id && onSessionUpdate) {
              onSessionUpdate();
            }
            
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

      // Check if this is a quota exceeded response
      const isQuotaExceeded = data.quota_exceeded === true;
      
      // Remove the thinking message and add the AI response
      setMessages(prev => prev.filter(msg => msg.content !== 'Thinking...'));
      
      const aiMessage: Message = {
        role: 'assistant',
        content: aiMessageContent
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // If quota exceeded, disable input temporarily to show the message clearly
      if (isQuotaExceeded) {
        console.log('Quota exceeded for user plan:', data.plan);
        // You could add additional UI handling here if needed
      }
      
      // Mark that new content has been added (AI response)
      if (onNewContent) {
        onNewContent();
      }
      
      // Update current session ID if provided in response
      if (data.session_id && onSessionUpdate) {
        onSessionUpdate();
      }
      
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
      
      // Clear uploaded files even on error
      if (onClearFiles) {
        console.log('Clearing uploaded files due to error...');
        onClearFiles();
      }
      
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
