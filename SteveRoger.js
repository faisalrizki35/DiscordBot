// index.js
require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, PermissionsBitField, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

client.once('ready', () => {
  console.log(`✅ Bot sudah login sebagai ${client.user.tag}`);
  registerCommands();
});

async function registerCommands() {
  const commands = [
    {
      name: 'settings',
      description: 'Atur Voice Channel',
    },
  ];

  try {
    const rest = new REST({ version: '10' }).setToken(token);
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );
    console.log('✅ Perintah berhasil didaftarkan!');
  } catch (error) {
    console.error('❌ Gagal mendaftarkan perintah:', error);
  }
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'settings') {
    const vc = interaction.member.voice.channel;

    if (!vc) return interaction.reply('❌ Kamu harus berada di Voice Channel!');

    const buttonsRow1 = {
      type: 1,
      components: [
        { type: 2, style: 2, label: '🎚️ Bitrate', custom_id: 'bitrate' },
        { type: 2, style: 2, label: '👥 Limit', custom_id: 'limit' },
        { type: 2, style: 2, label: '✏️ Rename', custom_id: 'rename' },
        { type: 2, style: 2, label: '🌍 Region', custom_id: 'region' },
        { type: 2, style: 2, label: '❌ Kick', custom_id: 'kick' },
      ],
    };

    const buttonsRow2 = {
      type: 1,
      components: [
        { type: 2, style: 2, label: 'ℹ️ Info', custom_id: 'info' },
        { type: 2, style: 2, label: '📤 Transfer', custom_id: 'transfer' },
        { type: 2, style: 2, label: '📌 Claim', custom_id: 'claim' },
      ],
    };

    await interaction.reply({ content: '🔧 Voice Settings:', components: [buttonsRow1, buttonsRow2] });
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const vc = interaction.member.voice.channel;
  if (!vc) return interaction.reply('❌ Kamu harus di Voice Channel!');

  switch (interaction.customId) {
    case 'bitrate': {
      const modal = new ModalBuilder()
        .setCustomId('set_bitrate')
        .setTitle('Atur Bitrate')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('bitrate_value')
              .setLabel('Masukkan bitrate (8000-96000)')
              .setStyle(TextInputStyle.Short)
          )
        );
      await interaction.showModal(modal);
      break;
    }

    case 'limit': {
      const modal = new ModalBuilder()
        .setCustomId('set_limit')
        .setTitle('Atur Limit')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('limit_value')
              .setLabel('Masukkan limit pengguna (1-99)')
              .setStyle(TextInputStyle.Short)
          )
        );
      await interaction.showModal(modal);
      break;
    }

    case 'rename': {
      const modal = new ModalBuilder()
        .setCustomId('set_name')
        .setTitle('Ganti Nama')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('name_value')
              .setLabel('Masukkan nama baru')
              .setStyle(TextInputStyle.Short)
          )
        );
      await interaction.showModal(modal);
      break;
    }

    case 'region': {
      const modal = new ModalBuilder()
        .setCustomId('set_region')
        .setTitle('Atur Region')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('region_value')
              .setLabel('Masukkan region (contoh: singapore, europe)')
              .setStyle(TextInputStyle.Short)
          )
        );
      await interaction.showModal(modal);
      break;
    }

    case 'kick': {
      vc.members.forEach((member) => {
        if (member.id !== interaction.user.id) member.voice.disconnect();
      });
      interaction.reply('❌ Semua member di-kick dari channel!');
      break;
    }

    case 'info': {
      interaction.reply(`ℹ️ Nama: ${vc.name}, Limit: ${vc.userLimit || '∞'}, Bitrate: ${vc.bitrate / 1000}kbps`);
      break;
    }

    case 'transfer': {
      await vc.permissionOverwrites.create(interaction.user, {
        ManageChannels: true,
      });
      interaction.reply('📤 Kamu sekarang pemilik channel ini!');
      break;
    }

    case 'claim': {
      await vc.permissionOverwrites.create(interaction.user, {
        ManageChannels: true,
      });
      interaction.reply('📌 Kepemilikan berhasil di-claim!');
      break;
    }
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isModalSubmit()) return;

  const vc = interaction.member.voice.channel;
  if (!vc) return interaction.reply('❌ Kamu harus di Voice Channel!');

  switch (interaction.customId) {
    case 'set_bitrate': {
      const bitrate = parseInt(interaction.fields.getTextInputValue('bitrate_value'), 10);
      if (bitrate < 8000 || bitrate > 96000) return interaction.reply('❌ Bitrate harus di antara 8000-96000!');
      await vc.setBitrate(bitrate);
      interaction.reply(`🎚️ Bitrate diatur ke ${bitrate}bps!`);
      break;
    }

    case 'set_limit': {
      const limit = parseInt(interaction.fields.getTextInputValue('limit_value'), 10);
      if (limit < 1 || limit > 99) return interaction.reply('❌ Limit harus di antara 1-99!');
      await vc.setUserLimit(limit);
      interaction.reply(`👥 Limit diatur ke ${limit} pengguna!`);
      break;
    }

    case 'set_name': {
      const name = interaction.fields.getTextInputValue('name_value');
      await vc.setName(name);
      interaction.reply(`✏️ Nama diubah menjadi ${name}!`);
      break;
    }

    case 'set_region': {
      const region = interaction.fields.getTextInputValue('region_value');
      await vc.setRTCRegion(region);
      interaction.reply(`🌍 Region diatur ke ${region}!`);
      break;
    }
  }
});

client.login(token);
