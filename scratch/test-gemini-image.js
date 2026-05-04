const fs = require('fs');

async function test() {
  const apiKey = 'AIzaSyA9KDkMKQU24ovka99EybETMLc9yCtkl6I';
  const MODEL_ID = 'gemini-3.1-flash-image-preview'; // Let's also test 'imagen-3.0-generate-001'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [{ text: "A futuristic city skyline at night" }]
      }
    ],
    generationConfig: {
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  };

  try {
    console.log(`Testing ${MODEL_ID}...`);
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
          console.log(`Image ${i} base64 length: ${base64Data.length}`);
          fs.writeFileSync(`scratch/test-${MODEL_ID}-${i}.jpg`, Buffer.from(base64Data, 'base64'));
          console.log(`Saved scratch/test-${MODEL_ID}-${i}.jpg`);
        }
      }
    } else {
      console.log('No images generated:', data);
    }
  } catch (error) {
    console.error(error);
  }
}

test();
