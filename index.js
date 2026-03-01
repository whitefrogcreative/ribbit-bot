require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const cron = require('node-cron');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const DAILY_THEME_CHANNEL_ID = '1477732205756289046';

const modifiers = [
  "Bioluminescent", "Crystallized", "Clockwork", "Neon", "Haunted",
  "Forgotten", "Ancient", "Living", "Shattered", "Overgrown",
  "Celestial", "Cursed", "Hollow", "Gilded", "Spectral",
  "Submerged", "Fractured", "Eternal", "Burning", "Frozen",
  "Withered", "Radiant", "Corrupted", "Translucent", "Rusted",
  "Twisted", "Luminous", "Decayed", "Sacred", "Volcanic",
  "Serene", "Chaotic", "Mirrored", "Drifting", "Shimmering",
  "Forsaken", "Towering", "Whispering", "Crumbling", "Blazing",
  "Sunken", "Verdant", "Ashen", "Obsidian", "Phantom",
  "Colossal", "Tangled", "Sovereign", "Molten", "Iridescent",
  "Barren", "Shifting", "Glitching", "Feral", "Arcane",
  "Mechanical", "Primordial", "Gilded", "Hollow", "Fractured"
];

const subjects = [
  "Forest", "Ocean", "Temple", "Carnival", "Civilization",
  "Machine", "Garden", "Archive", "Creature", "Tower",
  "Ritual", "Throne", "Ruin", "Dream", "Portal",
  "Vessel", "Labyrinth", "Oracle", "Bloom", "Void",
  "Cathedral", "Wasteland", "Specter", "Colossus", "Abyss",
  "Clocktower", "Shoreline", "Sanctum", "Behemoth", "Mirage",
  "Fortress", "Cavern", "Nebula", "Wraith", "Canopy",
  "Citadel", "Reef", "Monolith", "Phantom", "Ember",
  "Shipwreck", "Meadow", "Spire", "Tundra", "Altar",
  "Swamp", "Glacier", "Throne", "Serpent", "Horizon",
  "Marketplace", "Observatory", "Graveyard", "Hollow", "Titan",
  "Battlefield", "Oasis", "Library", "Volcano", "Crown"
];

function getDailyTheme() {
  const today = new Date().toISOString().slice(0, 10);
  const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0);
  const modifier = modifiers[seed % modifiers.length];
  const subject = subjects[(seed * 7) % subjects.length];
  return `${modifier} ${subject}`;
}

async function postDailyTheme() {
  const channel = await client.channels.fetch(DAILY_THEME_CHANNEL_ID);
  const theme = getDailyTheme();
  
  const embed = new EmbedBuilder()
    .setTitle('🎨 Daily Art Theme')
    .setDescription(`## *${theme}*`)
    .setColor(0x9B59B6)
    .setFooter({ text: 'Create something amazing and share it here!' })
    .setTimestamp();

  await channel.send({ embeds: [embed] });
}

client.once('clientReady', () => {
  console.log(`🐸 Ribbit is online as ${client.user.tag}`);

  // Post daily theme at 7:00 AM MST (14:00 UTC)
  cron.schedule('0 14 * * *', () => {
    console.log('Posting daily theme...');
    postDailyTheme();
  }, {
    timezone: 'America/Denver'
  });

  console.log('📅 Daily theme scheduler is running!');
});

client.on('messageCreate', (message) => {
  if (message.author.bot) return;
  if (message.content === '!theme') {
    const theme = getDailyTheme();
    message.reply(`🎨 **Today's Theme:** *${theme}*`);
  }

  // Test command to preview the embed immediately
  if (message.content === '!testtheme') {
    postDailyTheme();
  }
});

client.login(process.env.DISCORD_TOKEN);