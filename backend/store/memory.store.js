const crypto = require('crypto');

const memoryStore = {
  users: [],
  grounds: [],
  bookings: [],
  payments: []
};

function newId() {
  return crypto.randomUUID();
}

function seedGrounds() {
  if (memoryStore.grounds.length > 0) return;

  memoryStore.grounds.push(
    {
      id: 'g1',
      name: 'Green Turf Arena',
      location: 'Andheri, Mumbai',
      pricePerHour: 1200,
      images: [
        'https://placehold.co/1200x700/0b1f14/22c55e?text=Green+Turf+Arena',
        'https://placehold.co/1200x700/0b1f14/86efac?text=Night+Lights',
        'https://placehold.co/1200x700/0b1f14/bbf7d0?text=Premium+Turf'
      ],
      amenities: ['Parking', 'Washroom', 'Drinking Water', 'Changing Room', 'Flood Lights'],
      openTime: '06:00',
      closeTime: '23:00',
      slotMinutes: 60
    },
    {
      id: 'g2',
      name: 'Nightowl Box Cricket',
      location: 'Koramangala, Bengaluru',
      pricePerHour: 1000,
      images: [
        'https://placehold.co/1200x700/0b1f14/22c55e?text=Nightowl+Box+Cricket',
        'https://placehold.co/1200x700/0b1f14/86efac?text=Fast+Pitch',
        'https://placehold.co/1200x700/0b1f14/bbf7d0?text=Club+Zone'
      ],
      amenities: ['Parking', 'Washroom', 'Umpire (On request)', 'First Aid', 'Flood Lights'],
      openTime: '07:00',
      closeTime: '24:00',
      slotMinutes: 60
    },
    {
      id: 'g3',
      name: 'CityLights Cricket Box',
      location: 'Gachibowli, Hyderabad',
      pricePerHour: 900,
      images: [
        'https://placehold.co/1200x700/0b1f14/22c55e?text=CityLights+Cricket+Box',
        'https://placehold.co/1200x700/0b1f14/86efac?text=Practice+Nets',
        'https://placehold.co/1200x700/0b1f14/bbf7d0?text=Family+Friendly'
      ],
      amenities: ['Parking', 'Washroom', 'Cafeteria', 'Cricket Kit Rental'],
      openTime: '06:00',
      closeTime: '22:00',
      slotMinutes: 60
    }
  );
}

module.exports = {
  memoryStore,
  newId,
  seedGrounds
};
