async function testText() {
  const apiKey = 'AIzaSyA9KDkMKQU24ovka99EybETMLc9yCtkl6I';
  const MODEL_ID = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: "Hello" }] }]
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

testText();
