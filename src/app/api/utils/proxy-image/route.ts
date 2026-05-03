import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json({ error: 'Falta la URL de la imagen' }, { status: 400 });
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Error al obtener la imagen: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';
    const base64 = Buffer.from(buffer).toString('base64');

    return NextResponse.json({
      data: base64,
      mimeType: contentType
    });
  } catch (error: any) {
    console.error('[Proxy Image Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
