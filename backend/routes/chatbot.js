const express = require('express');
const router = express.Router();

// Sahayata Chatbot - India Travel Assistant
router.get('/', (req, res) => {
  res.render('chatbot/sahayata');
});

router.post('/ask', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if Groq API is configured
    if (!process.env.GROQ_API_KEY) {
      return res.json({
        response: 'Sahayata Chatbot: I am currently unavailable. Please configure my GROQ_API_KEY in your environment variables.',
        error: true
      });
    }

    // Call Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are Sahayata (सहायता), a helpful AI assistant for UrbanNest - India's premier urban accommodation platform. 

Your expertise includes:
- Major Indian cities (Delhi, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad, Jaipur, etc.)
- Local cuisine and famous food spots in each city
- Tourist attractions, cultural landmarks, and heritage sites
- IT companies, tech parks, and industrial hubs
- Business districts and commercial areas
- Transportation and connectivity (metro, buses, airports)
- Local customs, festivals, and etiquette
- Best times to visit different cities
- Safety tips for travelers
- Shopping areas and markets
- Nightlife and entertainment

Guidelines:
- Be warm, friendly, and culturally aware
- Use occasional Hindi words naturally (like Namaste, Dhanyavaad, Shukriya)
- Provide specific, actionable information with addresses when possible
- Include practical tips (approximate costs, timings, locations)
- Mention nearby UrbanNest properties when relevant
- Keep responses concise but informative (2-4 paragraphs max)
- Use emojis sparingly for visual appeal
- Be respectful of India's diverse culture and traditions
- Provide both budget and premium options when suggesting places

Always prioritize accuracy and helpfulness. If you don't know something, say so honestly and suggest where they might find the information.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 600
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API error status:', response.status);
      console.error('Groq API error details:', errorData);
      
      // Provide more specific error messages
      if (response.status === 401) {
        return res.json({
          response: 'Sahayata Chatbot: Authentication failed. Please check if your GROQ_API_KEY is valid. 🔑',
          error: true
        });
      } else if (response.status === 429) {
        return res.json({
          response: 'Sahayata Chatbot: Rate limit exceeded or quota reached. Please wait a moment and try again. ⏳',
          error: true
        });
      }
      
      return res.json({
        response: `Sahayata Chatbot: I'm having trouble connecting (Error ${response.status}). Please try again in a moment. 🙏`,
        error: true
      });
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || 'Sahayata Chatbot: I apologize, but I couldn\'t generate a response. Please try again.';

    res.json({
      response: aiResponse,
      error: false
    });

  } catch (error) {
    console.error('Chatbot error:', error.message);
    console.error('Error stack:', error.stack);
    
    // Provide more helpful error messages
    if (error.message.includes('fetch') || error.name === 'TypeError') {
      return res.status(500).json({
        response: `Sahayata Chatbot: Network error reaching Groq API — ${error.message}. 🌐`,
        error: true
      });
    }
    
    res.status(500).json({
      response: `Sahayata Chatbot: Error — ${error.message} 🙏`,
      error: true
    });
  }
});

// Get suggested questions
router.get('/suggestions', (req, res) => {
  const suggestions = [
    {
      category: '🏙️ Cities & Areas',
      questions: [
        'Tell me about Bengaluru\'s IT hubs and tech parks',
        'What are the best areas to stay in Mumbai?',
        'Famous places to visit in Delhi',
        'How is the weather in Chennai throughout the year?'
      ]
    },
    {
      category: '🍛 Food & Cuisine',
      questions: [
        'Best street food in Delhi',
        'Famous biryani restaurants in Hyderabad',
        'Must-try dishes in Kolkata',
        'Vegetarian food options in Pune'
      ]
    },
    {
      category: '🏢 Business & IT',
      questions: [
        'Major IT companies in Bengaluru',
        'Industrial areas in Mumbai',
        'Tech parks in Hyderabad',
        'Business districts in Pune and Gurgaon'
      ]
    },
    {
      category: '🎭 Culture & Tourism',
      questions: [
        'Cultural festivals in India',
        'Historical monuments in Delhi',
        'Art galleries and museums in Mumbai',
        'Traditional markets in Jaipur'
      ]
    },
    {
      category: '🚗 Transportation',
      questions: [
        'How to use Delhi Metro?',
        'Best way to travel in Mumbai',
        'Airport connectivity in Bengaluru',
        'Local transport options in Chennai'
      ]
    },
    {
      category: '🛍️ Shopping',
      questions: [
        'Best shopping malls in Delhi',
        'Traditional markets in Jaipur',
        'Electronics shopping in Mumbai',
        'Silk sarees in Bengaluru'
      ]
    }
  ];

  res.json({ suggestions });
});

module.exports = router;
