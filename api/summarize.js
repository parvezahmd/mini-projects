import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url, fallback } = req.body

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url is required' })
  }

  const articleText = typeof fallback === 'string' ? fallback.trim().slice(0, 12000) : ''

  if (!articleText) {
    return res.status(500).json({ error: 'Could not retrieve article content' })
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Summarize this news article in 4–5 concise sentences. Cover the key facts, who is involved, and why it matters. Write the summary directly — no intro phrases like "This article..." or "The article discusses...". Use plain text only — no HTML tags, no markdown, no bullet points.\n\n${articleText}`,
        },
      ],
    })

    const summary = (completion.choices[0]?.message?.content?.trim() || '').replace(/<[^>]*>/g, '')
    res.json({ summary })
  } catch (err) {
    console.error('[summarize] Groq error:', err.message)
    res.status(500).json({ error: err.message || 'Summarization failed' })
  }
}
