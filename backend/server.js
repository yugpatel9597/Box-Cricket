const app = require('./app');
const { memoryStore } = require('./store/memory.store');

const PORT = process.env.PORT || 5000;

// Seed demo data if empty
if (memoryStore.grounds.length === 0) {
  console.log('Seeding demo grounds...');
  // Demo grounds are already added in memory.store.js
}

app.listen(PORT, () => {
  console.log(`Box Cricket server running on http://localhost:${PORT}`);
});
