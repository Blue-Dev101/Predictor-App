import OpenAI from 'openai';
import { dbHelper } from '../db/setup.js';

// In a real application, you would store this in an environment variable
const openai = new OpenAI({
  apiKey: 'YOUR_OPENAI_API_KEY', // Replace with your OpenAI API key or use process.env.OPENAI_API_KEY
});

const generateChatResponse = async (message) => {
  try {
    // Get recent past results and predictions to provide context
    const pastResults = await dbHelper.all('SELECT * FROM past_results ORDER BY id DESC LIMIT 5');
    const predictions = await dbHelper.all('SELECT * FROM predictions ORDER BY id DESC LIMIT 5');
    const patterns = await dbHelper.all('SELECT * FROM detected_patterns ORDER BY id DESC LIMIT 3');

    // Create context message from the data
    let context = 'Based on the following lottery information:\n';

    if (pastResults.length > 0) {
      context += '\nPast Results:\n';
      pastResults.forEach(result => {
        context += `- Draw: ${result.numbers} with bonus ${result.bonus_number}\n`;
      });
    }

    if (predictions.length > 0) {
      context += '\nRecent Predictions:\n';
      predictions.forEach(prediction => {
        context += `- ${prediction.source}: ${prediction.numbers} with bonus ${prediction.bonus_number}\n`;
      });
    }

    if (patterns.length > 0) {
      context += '\nDetected Patterns:\n';
      patterns.forEach(pattern => {
        context += `- ${pattern.pattern_description} (confidence: ${(pattern.confidence * 100).toFixed(1)}%)\n`;
      });
    }

    // Make API call to OpenAI
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a lottery prediction assistant. You help users understand lottery patterns,
          odds, and provide informed insights about lottery predictions.
          Use the context provided to answer the user's question.
          If the question isn't related to lotteries, kindly redirect the conversation back to lottery-related topics.
          Be informative but always remind users that lottery predictions cannot guarantee wins.
          ${context}`
        },
        {
          role: 'user',
          content: message
        }
      ],
    });

    return chatCompletion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.';
  } catch (error) {
    console.error('Error generating chat response:', error);

    // For demo purposes, return a fallback response if the API call fails
    return `I apologize, but I'm currently unable to answer your question. This could be due to API key configuration or service availability.

    In a production environment, this would connect to OpenAI's GPT model to provide personalized responses about lottery predictions, patterns, and lottery-related advice.

    For now, here are some general lottery tips:
    - The odds of winning major lotteries are very low (typically millions to one)
    - Past results don't influence future draws in truly random lotteries
    - Consistency in playing the same numbers doesn't change your odds
    - Consider the expected value when deciding whether to play`;
  }
};

// Simplified version for demo purposes (does not actually call OpenAI API)
const generateDemoResponse = async (message) => {
  try {
    // Get context from the database
    const pastResults = await dbHelper.all('SELECT * FROM past_results ORDER BY id DESC LIMIT 5');
    const patterns = await dbHelper.all('SELECT * FROM detected_patterns ORDER BY id DESC LIMIT 3');

    // Create basic responses based on keywords in the message
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('odds') || lowerMessage.includes('chance')) {
      return "The odds of matching all 7 numbers in a typical lottery are approximately 1 in 85,900,584. For matching 6 numbers, the odds improve to about 1 in 1,221,759. Remember that each draw is independent, and past results don't influence future outcomes.";
    }

    if (lowerMessage.includes('pattern') || lowerMessage.includes('trend')) {
      if (patterns.length > 0) {
        let response = "Based on our analysis of past results, we've detected these patterns:\n\n";
        patterns.forEach(pattern => {
          response += `- ${pattern.pattern_description} (confidence: ${(pattern.confidence * 100).toFixed(1)}%)\n`;
        });
        response += "\nRemember that lottery draws are random, and these patterns may be coincidental.";
        return response;
      } else {
        return "We haven't detected any significant patterns yet. This could be due to insufficient data or the random nature of lottery draws. As more results are added, our pattern detection algorithms will have more data to analyze.";
      }
    }

    if (lowerMessage.includes('strategy') || lowerMessage.includes('tip') || lowerMessage.includes('advice')) {
      return "Here are some lottery playing strategies to consider:\n\n1. Set a budget and stick to it\n2. Consider playing less popular games with better odds\n3. Join or form a lottery pool to increase your chances while sharing the cost\n4. Use a combination of both hot (frequently drawn) and cold (rarely drawn) numbers\n5. Avoid number sequences like 1,2,3,4,5,6,7\n\nRemember that lottery is primarily a game of chance, and no strategy can guarantee a win.";
    }

    if (lowerMessage.includes('result') || lowerMessage.includes('past draw')) {
      if (pastResults.length > 0) {
        let response = "Here are the most recent lottery results:\n\n";
        pastResults.forEach((result, index) => {
          response += `Draw ${index+1}: ${result.numbers} with bonus ${result.bonus_number}\n`;
        });
        return response;
      } else {
        return "There are no past results in our database yet. You can add past lottery results using the 'Enter Past Lottery Results' form.";
      }
    }

    // Default response
    return "I'm your lottery prediction assistant. I can help with information about lottery odds, patterns in past results, and prediction strategies. What would you like to know about lottery predictions?";
  } catch (error) {
    console.error('Error generating demo response:', error);
    return "I'm sorry, I'm having trouble accessing the lottery data right now. Please try again later.";
  }
};

export { generateChatResponse, generateDemoResponse };
