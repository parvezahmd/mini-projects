export default async function handler(req, res) {
  try {
    const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR')
    const data = await response.json()
    res.json({ rate: data.rates.INR, date: data.date })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch exchange rate' })
  }
}
