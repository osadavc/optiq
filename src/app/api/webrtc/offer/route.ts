import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Forward the request to the Python backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:7860'
    
    const response = await fetch(`${backendUrl}/api/offer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`)
    }

    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error proxying WebRTC offer:', error)
    
    return NextResponse.json(
      { error: 'Failed to process WebRTC offer' },
      { status: 500 }
    )
  }
}