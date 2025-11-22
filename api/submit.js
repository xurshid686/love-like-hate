const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, studentName, score, total, percentage } = req.body;

    if (!message) {
      return res.status(400).json({ 
        error: 'Missing required field: message' 
      });
    }

    // Get credentials from environment variables
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.error('Missing environment variables:', {
        hasBotToken: !!botToken,
        hasChatId: !!chatId
      });
      return res.status(500).json({ 
        error: 'Telegram credentials not configured',
        details: 'Please set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID environment variables'
      });
    }

    console.log(`Sending results for student: ${studentName}, Score: ${score}/${total} (${percentage}%)`);

    // Send message to Telegram
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML'
        })
      }
    );

    const telegramData = await telegramResponse.json();

    if (!telegramResponse.ok) {
      console.error('Telegram API error:', telegramData);
      return res.status(500).json({ 
        error: 'Failed to send message to Telegram',
        details: telegramData.description
      });
    }

    console.log('Results sent to Telegram successfully');
    
    res.status(200).json({ 
      success: true, 
      message: 'Results sent to Telegram successfully' 
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};
