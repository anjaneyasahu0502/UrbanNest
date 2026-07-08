require('dotenv').config();

async function testGroqAPI() {
  console.log('\n🚀 Testing Groq API Connection for Sahayata Chatbot\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Check if API key is configured
  if (!process.env.GROQ_API_KEY) {
    console.log('❌ GROQ_API_KEY is not configured in .env file');
    console.log('   Please add your Groq API key to continue.\n');
    console.log('   Get one free at: https://console.groq.com/\n');
    return;
  }

  console.log('✓ GROQ_API_KEY found');
  console.log(`✓ Model: ${process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'}\n`);

  try {
    console.log('📡 Sending test request to Groq API...\n');

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
            content: 'You are Sahayata, a helpful AI assistant for UrbanNest - India\'s urban accommodation platform.'
          },
          {
            role: 'user',
            content: 'Say "Namaste! I am working correctly with Groq API." in a friendly way.'
          }
        ],
        temperature: 0.7,
        max_tokens: 100
      })
    });

    console.log(`Response Status: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ API Error Response:');
      console.log(errorText);
      console.log('\n');
      
      if (response.status === 401) {
        console.log('💡 Solution: Your API key is invalid or expired.');
        console.log('   Get a new key from: https://console.groq.com/keys\n');
      } else if (response.status === 400) {
        console.log('💡 Solution: The model name might be incorrect.');
        console.log('   Try these models in your .env file:');
        console.log('   - llama-3.3-70b-versatile (recommended)');
        console.log('   - llama-3.1-70b-versatile');
        console.log('   - mixtral-8x7b-32768');
        console.log('   - gemma2-9b-it\n');
      } else if (response.status === 429) {
        console.log('💡 Solution: Rate limit exceeded. Wait a moment and try again.\n');
      }
      return;
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    console.log('✅ SUCCESS! Groq API is working correctly.\n');
    console.log('Response from Sahayata:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(aiResponse);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Show usage stats
    if (data.usage) {
      console.log('📊 Token Usage:');
      console.log(`   Prompt tokens: ${data.usage.prompt_tokens}`);
      console.log(`   Completion tokens: ${data.usage.completion_tokens}`);
      console.log(`   Total tokens: ${data.usage.total_tokens}\n`);
    }
    
    console.log('🎉 Your Sahayata chatbot is ready to use!\n');
    console.log('💡 Start your server: npm start');
    console.log('🌐 Visit: http://localhost:8080/sahayata\n');

  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('\n');
    
    if (error.message.includes('fetch')) {
      console.log('💡 Solution: Check your internet connection.\n');
    } else {
      console.log('💡 Solution: Check the error details above.\n');
    }
  }
}

testGroqAPI();
