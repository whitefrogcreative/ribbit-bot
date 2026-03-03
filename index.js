require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');
const cron = require('node-cron');

// 1. Setup Environment Logic
const isDev = process.env.NODE_ENV === 'development';
const TOKEN = isDev ? process.env.DEV_TOKEN : process.env.PROD_TOKEN;
const DAILY_THEME_CHANNEL_ID = isDev ? process.env.DEV_CHANNEL_ID : process.env.PROD_CHANNEL_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// --- Blocklist ---
const blocklist = [
  "very", "mere", "own", "half", "least", "whole", "entire", "nearby",
  "mixed", "heavy", "light", "natural", "national", "primary", "secondary",
  "original", "native", "cardiac", "acoustic", "mediastinal", "geometrical",
  "shaped", "growth", "boreal", "montane", "amazonian", "equatorial",
  "slight", "slightest", "faintest", "vain", "cool", "cold", "open",
  "deep", "deeper", "deepest", "tall", "huge", "giant", "gigantic",
  "broad", "thin", "sharp", "soft", "vast", "great", "large", "small",
  "long", "high", "low", "warm", "blue", "green", "gray", "grey", "purple",
  "black", "white", "red", "pink", "yellow", "brown"
];

// --- Seed Words for Datamuse ---
const seedWords = [
  // Dark & Mysterious
  "shadow", "void", "ruin", "ghost", "abyss", "curse", "dread", "omen", "specter", "hollow",
  // Nature & Organic
  "forest", "ocean", "storm", "crystal", "flame", "glacier", "swamp", "thorn", "moss", "petal",
  // Cosmic & Celestial
  "galaxy", "nebula", "comet", "eclipse", "cosmos", "pulsar", "aurora", "solstice", "zenith", "meteor",
  // Mystical & Magical
  "spirit", "dream", "ancient", "magic", "oracle", "ritual", "relic", "myth", "fable", "enchant",
  // Decay & Time
  "fossil", "tomb", "ember", "ash", "rust", "dust", "erosion", "wreckage", "remnant", "solitude",
  // Elemental
  "inferno", "tempest", "torrent", "avalanche", "quake", "frost", "surge", "vapor", "miasma", "ether",
  // Architectural
  "cathedral", "labyrinth", "fortress", "sanctum", "vault", "citadel", "spire", "crypt", "dungeon", "tower",
  // Ethereal & Abstract
  "illusion", "mirage", "echo", "whisper", "silence", "reverie", "phantom", "wisp", "haze", "specter"
];

// --- Fallback Modifiers (used if Datamuse fails) ---
const fallbackModifiers = [
  "Bioluminescent", "Crystallized", "Clockwork", "Neon", "Haunted", "Forgotten", "Ancient", "Living", "Shattered", "Overgrown",
  "Celestial", "Cursed", "Hollow", "Gilded", "Spectral", "Submerged", "Fractured", "Eternal", "Burning", "Frozen",
  "Withered", "Radiant", "Corrupted", "Translucent", "Rusted", "Twisted", "Luminous", "Decayed", "Sacred", "Volcanic",
  "Serene", "Chaotic", "Mirrored", "Drifting", "Shimmering", "Forsaken", "Towering", "Whispering", "Crumbling", "Blazing",
  "Sunken", "Verdant", "Ashen", "Obsidian", "Phantom", "Colossal", "Tangled", "Sovereign", "Molten", "Iridescent",
  "Barren", "Shifting", "Glitching", "Feral", "Arcane", "Mechanical", "Primordial",
  "Cybernetic", "Industrial", "Prismatic", "Ethereal", "Nebulous", "Gothic", "Cinematic", "Vaporwave", "Retro", "Mythical",
  "Starlit", "Opalescent", "Synthetic", "Impossible", "Geometric", "Velvet", "Static", "Floral", "Abyssal", "Monolithic"
];

const subjects = [
  "Forest", "Ocean", "Temple", "Carnival", "Civilization", "Machine", "Garden", "Archive", "Creature", "Tower",
  "Ritual", "Throne", "Ruin", "Dream", "Portal", "Vessel", "Labyrinth", "Oracle", "Bloom", "Void",
  "Cathedral", "Wasteland", "Specter", "Colossus", "Abyss", "Clocktower", "Shoreline", "Sanctum", "Behemoth", "Mirage",
  "Fortress", "Cavern", "Nebula", "Wraith", "Canopy", "Citadel", "Reef", "Monolith", "Ember", "Shipwreck",
  "Meadow", "Spire", "Tundra", "Altar", "Swamp", "Glacier", "Serpent", "Horizon", "Marketplace", "Observatory",
  "Graveyard", "Titan", "Battlefield", "Oasis", "Library", "Volcano", "Crown",
  "Metropolis", "Outpost", "Sanctuary", "Greenhouse", "Relic", "Automaton", "Deity", "Artifact", "Monument", "Engine",
  "Key", "Tide", "Supernova", "Peak", "Grove", "Summit", "Android", "Samurai"
];

let modifiers = [];

// --- Fetch Modifiers from Datamuse ---
async function fetchModifiers() {
  console.log('🌐 Fetching modifiers from Datamuse...');
  const wordSet = new Set();

  for (const seed of seedWords) {
    try {
      const response = await fetch(`https://api.datamuse.com/words?rel_jjb=${seed}&max=100`);
      const words = await response.json();
      words.forEach(w => {
        const word = w.word.toLowerCase();
        if (
          word.length >= 3 &&
          !blocklist.includes(word) &&
          !word.includes(' ') &&
          /^[a-z]+$/.test(word)
        ) {
          wordSet.add(word.charAt(0).toUpperCase() + word.slice(1));
        }
      });
    } catch (err) {
      console.error(`Failed to fetch for seed: ${seed}`, err);
    }
  }

  if (wordSet.size > 0) {
    modifiers = [...wordSet];
    console.log(`✅ Loaded ${modifiers.length} modifiers from Datamuse!`);
  } else {
    modifiers = fallbackModifiers;
    console.log(`⚠️ Datamuse failed, using ${modifiers.length} fallback modifiers.`);
  }
}

// --- Theme Generator ---
function getDailyTheme() {
  const modifier = modifiers[Math.floor(Math.random() * modifiers.length)] || "Mystical";
  const subject = subjects[Math.floor(Math.random() * subjects.length)] || "Ethereal";
  return `${modifier} ${subject}`;
}


// --- Post Theme Embed ---
async function postDailyTheme(targetChannel = null) {
  try {
    const channel = targetChannel || await client.channels.fetch(DAILY_THEME_CHANNEL_ID);
    if (!channel) return console.error("Could not find the channel!");

    const theme = getDailyTheme();
    const embed = new EmbedBuilder()
      .setTitle('🐸 Daily Art Theme')
      .setDescription(`## *${theme}*`)
      .setColor(isDev ? 0xFFA500 : 0x50C878)
      .setFooter({ text: 'Create something amazing and share with the pond!' });

    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error("Error posting theme:", err);
  }
}

// --- Bot Ready ---
client.once('clientReady', async () => {
  const mode = isDev ? 'DEVELOPMENT' : 'PRODUCTION';
  console.log(`🐸 Ribbit is online as ${client.user.tag} [${mode} MODE]`);

  client.user.setActivity({
    name: isDev ? 'Ripples and Bugs (Dev Mode)' : 'Pond-ering Your Next Theme',
    type: ActivityType.Watching
  });

  await fetchModifiers();

  cron.schedule('0 7 * * *', () => {
    console.log(`[${new Date().toLocaleTimeString()}] Posting scheduled daily theme...`);
    postDailyTheme();
  }, {
    timezone: 'America/Denver'
  });

  console.log('📅 Daily theme scheduler is running!');
});

// --- Message Commands ---
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content === '!theme' || message.content === '!testtheme') {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply("🚫 Only Grandmaster WhiteFrog can call for a new theme!");
    }
    postDailyTheme(message.channel);
  }

  if (message.content === '!ribbit') {
    const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
    const subject = subjects[Math.floor(Math.random() * subjects.length)];

    const ribbitEmbed = new EmbedBuilder()
      .setTitle('🐸 Ribbit!')
      .setDescription(`## *${modifier} ${subject}*`)
      .setColor(0x9B59B6)
      .setFooter({ text: 'Is this... Ribbit-ing enough for you?' });

    return message.reply({ embeds: [ribbitEmbed] });
  }
});

client.login(TOKEN);