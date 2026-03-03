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

// --- Updated Blocklist (Strictly killing the "Boring" words) ---
const blocklist = [
  "very", "mere", "own", "half", "least", "whole", "entire", "nearby",
  "mixed", "heavy", "light", "natural", "national", "primary", "secondary",
  "original", "native", "cardiac", "acoustic", "mediastinal", "shaped", "growth", "boreal", "montane", "equatorial",
  "slight", "slightest", "faintest", "vain", "cool", "cold", "open",
  "deep", "deeper", "deepest", "tall", "huge", "giant", "gigantic",
  "broad", "thin", "sharp", "soft", "vast", "great", "large", "small",
  "long", "high", "low", "warm", "blue", "green", "gray", "grey", "purple",
  "black", "white", "red", "pink", "yellow", "brown", "respective", "modified",
  "interesting", "saxon", "otic", "bad", "good", "various", "several", "minimum", "maximum", "average", "standard", "initial", "former", "latter", 
  "present", "current", "potential", "possible", "actual", "relative", 
  "sufficient", "adequate", "appropriate", "particular", "specific", 
  "certain", "various", "multiple", "numorous", "several"
];

// --- The Master Seed List (Combining your Vibes + Artistic Anchors) ---
const masterSeeds = [
  "shadow", "void", "ruin", "ghost", "abyss", "curse", "dread", "omen", "specter", "hollow",
  "forest", "ocean", "storm", "crystal", "flame", "glacier", "swamp", "thorn", "moss", "petal",
  "galaxy", "nebula", "comet", "eclipse", "cosmos", "pulsar", "aurora", "solstice", "zenith", "meteor",
  "spirit", "dream", "ancient", "magic", "oracle", "ritual", "relic", "myth", "fable", "enchant",
  "fossil", "tomb", "ember", "ash", "rust", "dust", "erosion", "wreckage", "remnant", "solitude",
  "inferno", "tempest", "torrent", "avalanche", "quake", "frost", "surge", "vapor", "miasma", "ether",
  "cathedral", "labyrinth", "fortress", "sanctum", "vault", "citadel", "spire", "crypt", "dungeon", "tower",
  "cinematic", "vibrant", "luminous", "iridescent", "monochrome", "neon", "vivid", "opalescent", "prismatic",
  "ethereal", "ominous", "serene", "melancholy", "haunting", "mystical", "celestial", "dreamy", "gloomy", "radiant",
  "surreal", "dystopian", "cyberpunk", "gothic", "baroque", "minimalist", "steampunk", "abstract", "vaporwave", "noir",
  "intricate", "shattered", "weathered", "fluid", "crystalline", "ornate", "decayed", "polished", "biomorphic", "geometric",
  "volcanic", "frozen", "overgrown", "submerged", "verdant", "ashen", "cosmic", "primordial", "eternal",
  "bloom", "fauna", "thicket", "willow", "nautilus", "talisman", "amulet", "automaton", "hourglass", "apparatus"
];

// --- Hand-Picked Fallbacks (Your "Gems" that always stay in the pool) ---
const fallbackModifiers = [
  "Bioluminescent", "Crystallized", "Clockwork", "Neon", "Haunted", "Forgotten", "Ancient", "Living", "Shattered", "Overgrown",
  "Celestial", "Cursed", "Hollow", "Gilded", "Spectral", "Submerged", "Fractured", "Eternal", "Burning", "Frozen",
  "Withered", "Radiant", "Corrupted", "Translucent", "Rusted", "Twisted", "Luminous", "Decayed", "Sacred", "Volcanic",
  "Serene", "Chaotic", "Mirrored", "Drifting", "Shimmering", "Forsaken", "Towering", "Whispering", "Crumbling", "Blazing",
  "Sunken", "Verdant", "Ashen", "Obsidian", "Phantom", "Colossal", "Tangled", "Sovereign", "Molten", "Iridescent",
  "Barren", "Shifting", "Glitching", "Feral", "Arcane", "Mechanical", "Primordial", "Cybernetic", "Industrial", 
  "Prismatic", "Ethereal", "Nebulous", "Gothic", "Cinematic", "Vaporwave", "Retro", "Mythical", "Starlit", 
  "Opalescent", "Synthetic", "Impossible", "Geometric", "Velvet", "Static", "Floral", "Abyssal", "Monolithic"
];

// --- Hand-Picked Base Subjects ---
const fallbackSubjects = [
  "Forest", "Ocean", "Temple", "Carnival", "Civilization", "Machine", "Garden", "Archive", "Creature", "Tower",
  "Ritual", "Throne", "Ruin", "Dream", "Portal", "Vessel", "Labyrinth", "Oracle", "Bloom", "Void",
  "Cathedral", "Wasteland", "Specter", "Colossus", "Abyss", "Clocktower", "Shoreline", "Sanctum", "Behemoth", "Mirage",
  "Fortress", "Cavern", "Nebula", "Wraith", "Canopy", "Citadel", "Reef", "Monolith", "Ember", "Shipwreck",
  "Meadow", "Spire", "Tundra", "Altar", "Swamp", "Glacier", "Serpent", "Horizon", "Marketplace", "Observatory",
  "Graveyard", "Titan", "Battlefield", "Oasis", "Library", "Volcano", "Crown", "Metropolis", "Outpost", 
  "Sanctuary", "Greenhouse", "Relic", "Automaton", "Deity", "Artifact", "Monument", "Engine", "Key", "Tide", 
  "Supernova", "Peak", "Grove", "Summit", "Android", "Samurai", "Sunflower", "Ashtray", "Embroidery", "Interface", 
  "Ink Blot", "Lace", "Porcelain", "Tarot Card", "Matchstick", "Microscope", "Statue", "Velvet", "Poseidon",
  "Hourglass", "Phonograph", "Koi Fish", "Dandelion", "Pocket Watch", "Hummingbird", "Amulet", "Raindrop", 
  "Telescope", "Feather", "Lantern", "Chessboard", "Willow Tree", "Cat's Eye", "Stained Glass", "Inkwell", "Moth", "Coral"
];

let modifiers = [];
let dynamicSubjects = [];

// --- Fetch Modifiers (Adjectives) ---
async function fetchModifiers() {
  console.log('🔄 Ribbit is curating modifiers...');
  const wordSet = new Set();
  for (const seed of masterSeeds) {
    try {
      const response = await fetch(`https://api.datamuse.com/words?ml=${seed}&max=15&md=p`);
      const words = await response.json();
      words.forEach(w => {
        const word = w.word.toLowerCase();
        const isAdj = w.tags && w.tags.includes('adj');
        if (isAdj && word.length > 5 && !blocklist.includes(word) && /^[a-z]+$/.test(word)) {
          wordSet.add(word.charAt(0).toUpperCase() + word.slice(1));
        }
      });
    } catch (err) { /* silent */ }
  }
  modifiers = [...new Set([...fallbackModifiers, ...wordSet])];
  console.log(`✅ Loaded ${modifiers.length} modifiers.`);
}

// --- Fetch Subjects (Nouns) ---
async function fetchSubjects() {
  console.log('🔄 Ribbit is hunting for dynamic subjects...');
  const subjectSet = new Set();
  for (const seed of masterSeeds) {
    try {
      const response = await fetch(`https://api.datamuse.com/words?ml=${seed}&max=15&md=p`);
      const words = await response.json();
      words.forEach(w => {
        const word = w.word.toLowerCase();
        const isNoun = w.tags && w.tags.includes('n');
        if (isNoun && word.length > 4 && !blocklist.includes(word) && /^[a-z]+$/.test(word)) {
          subjectSet.add(word.charAt(0).toUpperCase() + word.slice(1));
        }
      });
    } catch (err) { /* silent */ }
  }
  dynamicSubjects = [...new Set([...fallbackSubjects, ...subjectSet])];
  console.log(`✅ Loaded ${dynamicSubjects.length} dynamic subjects.`);
}

// --- Theme Generator (The Whirl Logic) ---
function getDailyTheme() {
  const roll = Math.random();
  const mod = modifiers[Math.floor(Math.random() * modifiers.length)] || "Ethereal";
  const sub = dynamicSubjects[Math.floor(Math.random() * dynamicSubjects.length)] || "Relic";

  // 25% Chance: Single Word (Pure Whirl)
  if (roll < 0.25) return sub;

  // 15% Chance: Color Vibe
  if (roll < 0.40) {
    const colors = ["Indigo", "Cerulean", "Crimson", "Amber", "Obsidian", "Onyx", "Pearl", "Violet", "Ochre", "Emerald"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    return `${color} ${sub}`;
  }

  // 60% Chance: Dynamic Duo
  return `${mod} ${sub}`;
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
client.once('ready', async () => { // Fixed typo: 'clientReady' to 'ready'
  const mode = isDev ? 'DEVELOPMENT' : 'PRODUCTION';
  console.log(`🐸 Ribbit is online as ${client.user.tag} [${mode} MODE]`);

  client.user.setActivity({
    name: isDev ? 'Ripples and Bugs (Dev Mode)' : 'Pond-ering Your Next Theme',
    type: ActivityType.Watching
  });

  // Load both dynamic lists at startup
  await fetchModifiers();
  await fetchSubjects();

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
    const theme = getDailyTheme(); // Use the shared logic for !ribbit too!

    const ribbitEmbed = new EmbedBuilder()
      .setTitle('🐸 Ribbit!')
      .setDescription(`## *${theme}*`)
      .setColor(0x9B59B6)
      .setFooter({ text: 'Is this... Ribbit-ing enough for you?' });

    return message.reply({ embeds: [ribbitEmbed] });
  }
});

client.login(TOKEN);