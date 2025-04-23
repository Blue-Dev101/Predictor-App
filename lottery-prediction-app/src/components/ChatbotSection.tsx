import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

interface ChatMessage {
  id: number;
  text: string;
  isUser: boolean;
}

interface ChatbotSectionProps {
  apiUrl: string;
  demoMode?: boolean;
}

const ChatbotSection: React.FC<ChatbotSectionProps> = ({ apiUrl, demoMode = false }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      text: "Hello! I'm your lottery prediction assistant. Ask me anything about lottery predictions, strategies, or patterns!",
      isUser: false
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Demo mode responses
  const generateDemoResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('odds') || lowerMessage.includes('chance') || lowerMessage.includes('probability')) {
      return "The odds of matching all 7 numbers in a typical lottery are approximately 1 in 85,900,584. For matching 6 numbers, the odds improve to about 1 in 1,221,759. Remember that each draw is independent, and past results don't influence future outcomes.";
    }

    if (lowerMessage.includes('pattern') || lowerMessage.includes('trend') || lowerMessage.includes('frequent')) {
      return "Based on our analysis of past results, we've detected some patterns: numbers that appear more frequently than others, and pairs of numbers that tend to appear together. However, remember that lottery draws are random events, and any perceived patterns may be coincidental.";
    }

    if (lowerMessage.includes('strategy') || lowerMessage.includes('tip') || lowerMessage.includes('advice')) {
      return "Here are some lottery playing strategies to consider:\n\n1. Set a budget and stick to it\n2. Consider playing less popular games with better odds\n3. Join or form a lottery pool to increase your chances while sharing the cost\n4. Use a combination of both hot (frequently drawn) and cold (rarely drawn) numbers\n5. Avoid number sequences like 1,2,3,4,5,6,7\n\nRemember that lottery is primarily a game of chance, and no strategy can guarantee a win.";
    }

    if (lowerMessage.includes('result') || lowerMessage.includes('past draw') || lowerMessage.includes('previous')) {
      return "You can view the past lottery results in the table on this page. These results are used to train our prediction models and identify patterns.";
    }

    if (lowerMessage.includes('neural') || lowerMessage.includes('network') || lowerMessage.includes('model')) {
      return "Our Neural Network model uses deep learning techniques to analyze past lottery results. It identifies number frequency, recency trends, and number relationships to make predictions. While it's more sophisticated than basic random generation, please remember that all lottery draws are random, and predictions cannot guarantee wins.";
    }

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi ') || lowerMessage.includes('hey')) {
      return "Hello! I'm your lottery prediction assistant. How can I help you today?";
    }

    // Default response
    return "I'm your lottery prediction assistant running in demo mode. I can provide information about lottery odds, patterns, and strategies. Feel free to ask me specific questions about lottery predictions!";
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now(),
      text: input,
      isUser: true
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let response;

      if (demoMode) {
        // Generate demo response locally
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        response = { data: { response: generateDemoResponse(input) } };
      } else {
        // Call the chatbot API
        response = await axios.post(apiUrl, { message: input });
      }

      // Add bot response
      const botMessage: ChatMessage = {
        id: Date.now() + 1,
        text: response.data.response,
        isUser: false
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);

      // Add error message
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble connecting to my brain right now. Please try again later.",
        isUser: false
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[400px] border border-gray-200 rounded-md overflow-hidden">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.map(message => (
          <div
            key={message.id}
            className={`mb-3 ${message.isUser ? 'text-right' : ''}`}
          >
            <div
              className={`inline-block max-w-[80%] px-4 py-2 rounded-lg ${
                message.isUser
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white border border-gray-200 rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.text}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="mb-3">
            <div className="inline-block max-w-[80%] px-4 py-2 bg-white border border-gray-200 rounded-lg rounded-bl-none">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 bg-white p-3">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ask about lottery predictions..."
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-medium disabled:opacity-50"
          >
            Send
          </button>
        </form>
        <div className="text-xs text-gray-500 mt-1 px-1">
          {demoMode && <span className="text-yellow-500 font-medium">Running in demo mode • </span>}
          Examples: "What are the odds of winning?", "Tell me about number patterns", "Any lottery tips?"
        </div>
      </div>
    </div>
  );
};

export default ChatbotSection;
