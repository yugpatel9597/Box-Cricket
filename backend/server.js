const mongoose = require('mongoose');
const app = require('./app');
const { connectDB } = require('./db');
const { memoryStore } = require('./store/memory.store');

const PORT = process.env.PORT || 5000;

async function startServer() {
  if (process.env.MONGO_URI) {
    await connectDB();
    app.locals.dbConnected = true;
  } else {
    console.warn('MONGO_URI not set; running in memory-only mode');
    app.locals.dbConnected = false;
  }

  // Seed demo data if empty
  if (app.locals.dbConnected) {
    const Ground = require('./models/Ground');
    const count = await Ground.countDocuments();
    if (count === 0) {
      await Ground.insertMany(memoryStore.grounds);
      console.log('Seeded demo grounds into MongoDB');
    }
  } else {
    if (memoryStore.grounds.length === 0) {
      console.log('Seeding demo grounds...');
    }
  }

  app.listen(PORT, () => {
    console.log(`Box Cricket server running on http://localhost:${PORT}`);
  });
}

startServer();
