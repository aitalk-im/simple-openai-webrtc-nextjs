import { NextResponse } from 'next/server';
export const runtime = 'edge';

export async function GET(): Promise<NextResponse> {
    try {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OpenAI API key is not set');
        }
        
        const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-mini-realtime-preview-2024-12-17",
                voice: "verse",
            }),
        });

        const responseText = await response.text();
        console.log('OpenAI API response:', responseText);

        if (!response.ok) {
            throw new Error(`OpenAI API returned ${response.status}: ${responseText}`);
        }

        const data = JSON.parse(responseText);
        console.log('Session created successfully');
        return NextResponse.json(data);
    } catch (error) {
        console.error('Session creation error:', error);
        return NextResponse.json({
            error: (error as Error).message,
            details: (error as Error).stack
        }, { status: 500 });
    }
}