import { useState, useEffect } from 'react';
import baseUrl from './api';

interface ChatboxProps {
  chartData: any[];
  searchValue: string;
  selectedPeriod: string;
  selectedMetrics: string[];
  activeChart: string;
  selectedCompanies: any[];
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
}: ChatboxProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'I can help you analyze this data. What would you like to know?'
    }
  ]);
  const [inputValue, setInputValue] = useState('');

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

    // Determine company based on active chart
    const company = activeChart === 'peers' && selectedCompanies.length > 0
      ? selectedCompanies[0].ticker
      : searchValue.split(':')[0].trim().toUpperCase();

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: message
    };
    setMessages(prev => [...prev, userMessage]);

    try {
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

      const response = await fetch(`${baseUrl}/api/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: message,
          payload: payload,
          company,
          period: selectedPeriod || 'ALL',
          metrics: selectedMetrics || [],
          chartType: activeChart || 'line',
          chartData: formattedChartData
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log("Raw text from server:", responseText);

      const data = JSON.parse(responseText);
      console.log("Parsed JSON response:", data);

      const aiMessageContent =
        typeof data === 'string' ? data :
        data.answer || data.data || data.result || data.message || data.error ||
        'Sorry, I didn’t get a proper response from the server.';

      const aiMessage: Message = {
        role: 'assistant',
        content: aiMessageContent
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  return {
    messages,
    inputValue,
    setInputValue,
    handleSendMessage,
    setMessages,
  };
};

export default useChat;
