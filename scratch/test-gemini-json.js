async function testFull() {
  const apiKey = 'AIzaSyA9KDkMKQU24ovka99EybETMLc9yCtkl6I';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: "Genera 1 slide de prueba" }] }],
    systemInstruction: { parts: [{ text: "Genera slides de carrusel en JSON" }] },
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: "OBJECT",
        properties: {
          slides: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                title: { type: "STRING" }
              }
            }
          }
        }
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
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(error);
  }
}

testFull();
