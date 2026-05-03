import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, negativePrompt, aspectRatio, personGeneration, seed, sampleCount } = body;

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: { message: "La API Key no está configurada en el servidor." } },
        { status: 500 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: { message: "El prompt es requerido." } },
        { status: 400 }
      );
    }

    // Usar el modelo gemini-3.1-flash-image-preview
    const MODEL_ID = 'gemini-3.1-flash-image-preview';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${apiKey}`;

    // Mapeo seguro de aspect ratio: 4:5 no es oficialmente soportado por la API base, usamos 3:4 internamente
    // 21:9 tampoco es soportado, usamos 16:9
    let apiRatio = aspectRatio || '1:1';
    if (apiRatio === '4:5') {
      apiRatio = '3:4';
    } else if (apiRatio === '21:9') {
      apiRatio = '16:9';
    }

    // Modificar el prompt para incluir exclusiones y configuraciones no soportadas nativamente
    let finalPrompt = prompt;
    if (negativePrompt && negativePrompt.trim() !== '') {
      finalPrompt += `\nDO NOT INCLUDE THE FOLLOWING: ${negativePrompt.trim()}`;
    }
    
    const personGenUpper = personGeneration ? personGeneration.toUpperCase() : 'DONT_ALLOW';
    
    if (personGenUpper === 'DONT_ALLOW') {
      finalPrompt += `\nCRITICAL INSTRUCTION: DO NOT generate any people, faces, humans, or silhouettes. This image MUST be entirely free of people.`;
    }

    // Configuración para la generación de la imagen
    const imageConfig: any = {
      aspectRatio: apiRatio
    };

    const payload: any = {
      contents: [
        {
          parts: [{ text: finalPrompt }]
        }
      ],
      generationConfig: {
        responseModalities: ["IMAGE"],
        imageConfig
      }
    };
    
    if (seed !== undefined && seed !== null && seed !== '') {
      payload.generationConfig.seed = Number(seed);
    }

    const generateSingleImage = async () => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || JSON.stringify(data));
      }
      return data;
    };

    const count = sampleCount ? Number(sampleCount) : 1;
    const promises = Array.from({ length: count }).map(() => generateSingleImage());
    const results = await Promise.all(promises);

    let images: string[] = [];
    
    for (const data of results) {
      if (data.candidates && data.candidates.length > 0) {
        const parts = data.candidates[0].content?.parts || [];
        for (const part of parts) {
          if (part.inlineData) {
            const mimeType = part.inlineData.mimeType || 'image/jpeg';
            const base64Data = part.inlineData.data;
            images.push(`data:${mimeType};base64,${base64Data}`);
          }
        }
      }
    }

    return NextResponse.json({ images });
  } catch (error: any) {
    console.error('[Imagen API Proxy Exception]:', error);
    return NextResponse.json(
      { error: { message: error.message || 'Internal Server Error' } },
      { status: 500 }
    );
  }
}
