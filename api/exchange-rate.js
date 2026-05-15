export default async function handler(req, res) {
  try {
    const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR,GBP,EUR,AED')
    const data = await response.json()
    res.json({ rates: { INR: data.rates.INR, GBP: data.rates.GBP, EUR: data.rates.EUR, AED: data.rates.AED }, date: data.date })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch exchange rate' })
  }
}
