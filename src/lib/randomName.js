// Simulates the name a real Aadhaar/DigiLocker verification would return --
// this app never asks a citizen to type their own name (see Login.jsx),
// since a real identity provider already supplies it as part of
// verification. Only used once, for a brand-new account: existing accounts
// keep whatever name they were first given (see AuthContext.jsx /
// mockBackend.js's findOrCreateUser -- a repeat login never overwrites it).
const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan',
  'Krishna', 'Ishaan', 'Rohan', 'Kabir', 'Farhan', 'Devansh', 'Chandana',
  'Ananya', 'Diya', 'Priya', 'Aadhya', 'Saanvi', 'Myra', 'Anika', 'Kiara',
  'Meera', 'Riya', 'Sara', 'Aisha', 'Ira', 'Rimjhim', 'Kavya',
]
const LAST_INITIALS = ['S', 'K', 'R', 'M', 'P', 'T', 'V', 'G', 'N', 'J', 'D', 'B', 'C', 'H', 'A']

export function generateRandomName() {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
  const last = LAST_INITIALS[Math.floor(Math.random() * LAST_INITIALS.length)]
  return `${first} ${last}.`
}
