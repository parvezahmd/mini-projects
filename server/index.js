import { config } from 'dotenv'
config({ path: '.env.local' })
config() // fallback to .env if present
import express from 'express'
import cors from 'cors'
import Groq from 'groq-sdk'

const app = express()
const PORT = 3001

app.use(cors({ origin: 'http://localhost:5173' }))

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

app.use(express.json())

const CATEGORY_PROMPTS = {
  sports: `Summarize this sports article in 4–5 sentences in a match report style. Lead with the key result or main event, call out standout performers by name, and close with why this matters for the season or competition. Write directly — no intro phrases like "This article..." or "The article discusses...". Plain text only — no HTML, no markdown, no bullet points.`,
  entertainment: `Summarize this entertainment article in 4–5 sentences in a reviewer's tone. Capture the mood and feel of the piece, highlight the key people involved, keep it spoiler-free, and end with a one-sentence "worth it?" verdict. Write directly — no intro phrases. Plain text only — no HTML, no markdown, no bullet points.`,
  technology: `Summarize this tech article in 4–5 sentences as a TL;DR for a developer or tech-savvy reader. Lead with what changed or was announced, explain the real-world impact for users or developers, and flag any caveats or limitations. Write directly — no intro phrases. Plain text only — no HTML, no markdown, no bullet points.`,
  business: `Summarize this business article in 4–5 sentences as an investor brief. Lead with the key numbers or financial facts, identify who is affected, and explain the market implications. Write directly — no intro phrases. Plain text only — no HTML, no markdown, no bullet points.`,
  health: `Summarize this health article in 4–5 sentences focused on the actionable takeaway. Explain what the finding or development is, who it affects, and most importantly what a reader should do or know differently because of it. If it's preliminary research, say so. Write directly — no intro phrases. Plain text only — no HTML, no markdown, no bullet points.`,
  science: `Summarize this science article in 4–5 sentences in plain, jargon-free language (ELI5 style). Explain what was discovered or studied, how it was done in simple terms, and why it's significant. Write directly — no intro phrases. Plain text only — no HTML, no markdown, no bullet points.`,
  world: `Summarize this world news article in 4–5 sentences as a tight journalist brief. Cover who, what, where, when, and why in clear, direct sentences. Write directly — no intro phrases. Plain text only — no HTML, no markdown, no bullet points.`,
  top: `Summarize this news article as exactly 4–5 bullet points. Format each bullet on its own line starting with •. Each bullet must be a short fragment of 5–10 words — absolutely no full sentences, no verbs where possible. Cover only: what happened, who, key number, main consequence. Output ONLY the bullet lines — no intro, no outro, no blank lines between bullets. Example format:\n• Trump signs executive order on tariffs\n• Targets 60 countries, effective immediately\n• Markets drop 2% on announcement\n• Senate pushback expected next week`,
}

const DEFAULT_PROMPT = `Summarize this news article in 4–5 concise sentences. Cover the key facts, who is involved, and why it matters. Write the summary directly — no intro phrases like "This article..." or "The article discusses...". Use plain text only — no HTML tags, no markdown, no bullet points.`

app.post('/api/summarize', async (req, res) => {
  const { url, fallback, category } = req.body

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url is required' })
  }

  const articleText = typeof fallback === 'string' ? fallback.trim().slice(0, 12000) : ''

  if (!articleText) {
    return res.status(500).json({ error: 'Could not retrieve article content' })
  }

  const prompt = CATEGORY_PROMPTS[category] ?? DEFAULT_PROMPT

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\n${articleText}`,
        },
      ],
    })

    const summary = (completion.choices[0]?.message?.content?.trim() || '').replace(/<[^>]*>/g, '')
    res.json({ summary })
  } catch (err) {
    console.error('[summarize] Groq error:', err.message)
    res.status(500).json({ error: err.message || 'Summarization failed' })
  }
})

app.listen(PORT, () => {
  console.log(`\n  API server running at http://localhost:${PORT}\n`)
})
