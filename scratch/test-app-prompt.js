const fs = require('fs');

async function test() {
  const apiKey = 'AIzaSyA9KDkMKQU24ovka99EybETMLc9yCtkl6I';
  const MODEL_ID = 'gemini-3.1-flash-image-preview';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${apiKey}`;

  const promptText = `Professional photography, A creative background layout. Visual style: Modern and professional. Industry: general. Color palette inspiration: #0A1A26, #FF5C2B. Brand personality: Professional. High resolution, commercial quality, editorial lighting.`;
  
  const payload = {
    contents: [
      {
        parts: [{ text: promptText }]
      }
    ],
    generationConfig: {
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio: "4:5"
      }
    }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    
    if (data.candidates && data.candidates.length > 0) {
      const parts = data.candidates[0].content?.parts || [];
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part.inlineData) {
          const base64Data = part.inlineData.data;
          console.log(`Length: ${base64Data.length}`);
          fs.writeFileSync('scratch/test-app-prompt.jpg', Buffer.from(base64Data, 'base64'));
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
}

test();
