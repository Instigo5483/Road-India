// Major Indian city centers, used as the "base area" for a response team
// (see pages/AdminAddTeam.jsx) instead of an exact map pin -- a team's
// coverage area is naturally a whole city/locality, not one street
// address, and a city-level center is still precise enough for the
// nearest-available-team haversine matching in api/_dispatch-core.js.
export const CITIES = [
  { id: 'new_delhi', name: 'New Delhi', lat: 28.6139, lng: 77.209 },
  { id: 'mumbai', name: 'Mumbai', lat: 19.076, lng: 72.8777 },
  { id: 'bengaluru', name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { id: 'hyderabad', name: 'Hyderabad', lat: 17.385, lng: 78.4867 },
  { id: 'ahmedabad', name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { id: 'kolkata', name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { id: 'chennai', name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { id: 'pune', name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { id: 'jaipur', name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
  { id: 'lucknow', name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
  { id: 'goa', name: 'Goa (Panaji)', lat: 15.4909, lng: 73.8278 },
  { id: 'mysuru', name: 'Mysuru', lat: 12.2958, lng: 76.6394 },
  { id: 'surat', name: 'Surat', lat: 21.1702, lng: 72.8311 },
  { id: 'kochi', name: 'Kochi', lat: 9.9312, lng: 76.2673 },
  { id: 'bhopal', name: 'Bhopal', lat: 23.2599, lng: 77.4126 },
  { id: 'chandigarh', name: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
]

export function getCity(id) {
  return CITIES.find((c) => c.id === id)
}
