import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'OpenAI API key is not configured' },
      { status: 501 }
    )
  }

  try {
    const openai = new OpenAI({ apiKey })
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1'
    })

    return NextResponse.json({ text: transcription.text })
  } catch (error) {
    console.error('Error transcribing audio:', error)
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    )
  }
}
