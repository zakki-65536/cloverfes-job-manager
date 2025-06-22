const { REST, Routes } = require('discord.js');
const { CLIENT_ID, DISCORD_TOKEN } = process.env;
const GUILD_ID = process.env.GUILD_ID_PRODUCT;
// const GUILD_ID = process.env.GUILD_ID_TEST;
const fs = require('node:fs');

// 各スラッシュコマンドのJSON形式で格納する
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

// スラッシュコマンドを登録するためのAPI
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

// デプロイ
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		const data = await rest.put(
			Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();