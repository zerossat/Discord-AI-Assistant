// Runs once when the Mongo data volume is first created.
// Creates collections and the unique indexes the app relies on.
const database = db.getSiblingDB('discord-ai');

database.createCollection('users');
database.createCollection('conversations');
database.createCollection('settings');

database.users.createIndex({ discordId: 1 }, { unique: true });
database.settings.createIndex({ guildId: 1 }, { unique: true });
database.conversations.createIndex({ userId: 1, guildId: 1 }, { unique: true });

print('✅ Initialized "discord-ai" database (collections + indexes).');
