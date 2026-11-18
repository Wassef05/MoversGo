const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const net = require('net');
const { BSON } = require('mongodb');

// Path to persistent development JSON dump
const DUMP_FILE_PATH = path.join(__dirname, '..', '..', '.mongo_dev_dump.json');
const BACKUP_FILE_PATH = path.join(__dirname, '..', '..', '.mongo_dev_dump.backup.json');

let autoSaveTimer = null;

/**
 * Check if a TCP port is open (fast pre-flight check)
 */
const isPortOpen = (port, host = '127.0.0.1') => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
};

/**
 * Export all collections to disk in BSON.EJSON format
 * (preserves ObjectIds, Dates, Buffers, Maps and passwords without validation errors)
 */
const exportAllData = async () => {
  try {
    if (mongoose.connection.readyState !== 1) return;
    const db = mongoose.connection.db;
    if (!db) return;

    const collections = await db.listCollections().toArray();
    const dump = {};
    for (const c of collections) {
      if (c.name.startsWith('system.')) continue;
      dump[c.name] = await db.collection(c.name).find().toArray();
    }

    // Safety guard: never overwrite an existing dump with an empty user collection
    if (!dump.users || dump.users.length === 0) {
      if (fs.existsSync(DUMP_FILE_PATH)) {
        console.warn('⚠️ Sauvegarde ignorée: la collection utilisateurs est vide, préservation du dump existant.');
        return;
      }
    }

    const jsonString = BSON.EJSON.stringify(dump, null, 2);
    const tempPath = `${DUMP_FILE_PATH}.tmp`;
    fs.writeFileSync(tempPath, jsonString, 'utf-8');
    fs.renameSync(tempPath, DUMP_FILE_PATH);

    // Keep a synced safety copy
    try {
      fs.copyFileSync(DUMP_FILE_PATH, BACKUP_FILE_PATH);
    } catch (_) {}
  } catch (err) {
    console.warn('⚠️ Auto-save dump warning:', err.message);
  }
};

/**
 * Restore collections from disk if dump exists
 */
const restoreDataFromDump = async () => {
  const tryRestore = async (filePath) => {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    if (!raw || raw.trim().length === 0) return null;

    const dump = BSON.EJSON.parse(raw);
    const db = mongoose.connection.db;
    let totalRestored = 0;

    for (const [colName, docs] of Object.entries(dump)) {
      if (Array.isArray(docs) && docs.length > 0) {
        await db.collection(colName).deleteMany({});
        await db.collection(colName).insertMany(docs);
        totalRestored += docs.length;
      }
    }
    return totalRestored;
  };

  try {
    let total = await tryRestore(DUMP_FILE_PATH);
    if (!total || total === 0) {
      console.log('🔄 Tentative de restauration depuis la sauvegarde backup...');
      total = await tryRestore(BACKUP_FILE_PATH);
    }

    if (total && total > 0) {
      console.log(`📦 Données persistantes restaurées depuis le disque (${total} documents restaurés).`);
      console.log('   Vos utilisateurs, devis et réservations sont conservés ! 🎉\n');
      return true;
    }
    return false;
  } catch (err) {
    console.warn('⚠️ Échec de restauration du dump principal:', err.message);
    try {
      const backupTotal = await tryRestore(BACKUP_FILE_PATH);
      if (backupTotal && backupTotal > 0) {
        console.log(`📦 Données restaurées depuis le fichier de secours (${backupTotal} documents restaurés).`);
        return true;
      }
    } catch (bErr) {
      console.warn('⚠️ Échec de restauration du backup:', bErr.message);
    }
    return false;
  }
};

/**
 * Connect to MongoDB with intelligent fallback and automatic persistence
 */
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/moveflow_tn';
  const portOpen = await isPortOpen(27017);

  let activeUri = primaryUri;

  if (portOpen) {
    try {
      const conn = await mongoose.connect(primaryUri);
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      console.log(`📦 Database: ${conn.connection.name}`);
      console.log(`💡 MongoDB Compass URI: ${primaryUri}\n`);
    } catch (err) {
      console.warn(`⚠️  Cannot connect to port 27017: ${err.message}`);
      await startEmbeddedMongo();
    }
  } else {
    console.log('🔄 Aucun service MongoDB externe détecté sur le port 27017.');
    console.log('⚡ Démarrage du moteur MongoDB intégré avec persistance automatique...');
    await startEmbeddedMongo();
  }

  // Restore data or seed
  const db = mongoose.connection.db;
  const usersCount = await db.collection('users').countDocuments();
  if (usersCount === 0) {
    const restored = await restoreDataFromDump();
    if (!restored) {
      const { runSeed } = require('../../seeds/seedHelper');
      await runSeed();
      await exportAllData();
    }
  } else {
    console.log(`ℹ️ Base de données prête avec ${usersCount} utilisateur(s).`);
  }

  startAutoSave();
  return mongoose.connection;
};

/**
 * Helper to spin up MongoMemoryServer
 */
const startEmbeddedMongo = async () => {
  if (!global.__mongodInstance) {
    const { MongoMemoryServer } = require('mongodb-memory-server');

    try {
      global.__mongodInstance = await MongoMemoryServer.create({
        instance: {
          port: 27017,
          dbName: 'moveflow_tn',
        },
      });
    } catch (portErr) {
      global.__mongodInstance = await MongoMemoryServer.create({
        instance: {
          dbName: 'moveflow_tn',
        },
      });
    }
  }

  let activeUri = global.__mongodInstance.getUri();
  if (!activeUri.endsWith('/moveflow_tn')) {
    activeUri = activeUri.replace(/\/$/, '') + '/moveflow_tn';
  }

  const conn = await mongoose.connect(activeUri);
  console.log(`✅ Moteur MongoDB Intégré Connecté: ${conn.connection.host}`);
  console.log(`📦 URI: ${activeUri}`);
  console.log(`💡 Ouvrez MongoDB Compass et connectez-vous à: ${activeUri}`);
  console.log('   (Persistance automatique active sur disque: .mongo_dev_dump.json)\n');
  return conn;
};

/**
 * Auto-save timer: exports database to disk periodically
 */
const startAutoSave = () => {
  if (autoSaveTimer) return;
  autoSaveTimer = setInterval(async () => {
    await exportAllData();
  }, 10000); // sync every 10 seconds
};

// Graceful cleanup: save everything before exiting
const cleanUp = async () => {
  console.log('\n💾 Sauvegarde de la base de données sur disque avant arrêt...');
  await exportAllData();
  if (autoSaveTimer) clearInterval(autoSaveTimer);
  if (global.__mongodInstance) {
    try {
      await global.__mongodInstance.stop();
    } catch (e) {}
  }
  process.exit(0);
};

process.on('SIGINT', cleanUp);
process.on('SIGTERM', cleanUp);
process.once('SIGUSR2', async () => {
  console.log('\n💾 Sauvegarde de la base de données avant redémarrage nodemon...');
  await exportAllData();
  process.kill(process.pid, 'SIGUSR2');
});

module.exports = connectDB;
module.exports.exportAllData = exportAllData;
