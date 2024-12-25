import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { sdp, model } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: 'OpenAI API key is not set' 
      }, { status: 500 });
    }

    const baseUrl = "https://api.openai.com/v1/realtime";
    const selectedModel = model || "gpt-4o-mini-realtime-preview-2024-12-17";

    const sdpResponse = await fetch(`${baseUrl}?model=${selectedModel}`, {
      method: "POST",
      body: sdp,
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/sdp"
      },
    });

    if (!sdpResponse.ok) {
      const errorText = await sdpResponse.text();
      return NextResponse.json({ 
        error: `OpenAI API returned ${sdpResponse.status}`,
        details: errorText
      }, { status: sdpResponse.status });
    }

    const answerSdp = await sdpResponse.text();

    return NextResponse.json({ 
      type: "answer", 
      sdp: answerSdp 
    });

  } catch (error) {
    console.error('WebRTC Signaling Error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: (error as Error).message
    }, { status: 500 });
  }
} 