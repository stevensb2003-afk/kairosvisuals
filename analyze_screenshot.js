const fs = require('fs');
require('dotenv').config({ path: '.env.local' });


async function analyze() {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API key");
    return;
  }
  const imgPath = 'test_image.jpg';
  if (!fs.existsSync(imgPath)) {
    console.error("Image not found:", imgPath);
    return;
  }
  const base64Data = fs.readFileSync(imgPath, { encoding: 'base64' });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{
      parts: [
        { text: "Describe this image in detail. Is it just a white spot or a blank image, or is it a real picture of a futuristic city skyline at sunset?" },
        { inlineData: { mimeType: 'image/jpeg', data: base64Data } }
      ]
    }]
  };
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await res.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "No text found";
  console.log(text);
}

analyze();
