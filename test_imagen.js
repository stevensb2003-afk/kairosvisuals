
require('dotenv').config({ path: '.env.local' });

async function run() {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API Key");
    return;
  }

  const MODEL_ID = 'gemini-3.1-flash-image-preview';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [{ text: "A futuristic city skyline at sunset" }]
      }
    ],
    generationConfig: {
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio: "4:5"
      }
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Error:", JSON.stringify(data, null, 2));
  } else {
    console.log("Success!");
    const part = data.candidates[0]?.content?.parts[0];
    if (part && part.inlineData) {
      console.log("MimeType:", part.inlineData.mimeType);
      console.log("Data length:", part.inlineData.data.length);
      const fs = require('fs');
      fs.writeFileSync('test_image.jpg', Buffer.from(part.inlineData.data, 'base64'));
      console.log("Saved test_image.jpg");
    } else {
      console.log("No inlineData found", JSON.stringify(part, null, 2));
    }
  }
}
run();
