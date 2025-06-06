const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const TOKEN = process.env.TOKEN || 'MTM4MDE5NDUwMDUyNTI5MzYzOA.GO4OTw._iGOufXHBXOwBUz3bbRfPQ54NDvM_up7_NpmRQ';
const CLIENT_ID = process.env.CLIENT_ID || '1380194500525293638';
const gameMessages = [
    "今すぐジャンプしろ！",
    "左に3歩移動せよ",
    "武器を捨てろ",
    "隠れろ！敵が来る",
    "右クリックを連打しろ",
    "アイテムを拾え",
    "敵を無視して進め",
    "後ろを振り返るな",
    "クラフトテーブルを作れ",
    "食べ物を食べろ",
    "水に飛び込め",
    "高い場所に登れ",
    "地面を掘れ",
    "建物に入れ",
    "走り続けろ",
    "歩いて移動しろ",
    "しゃがみ移動しろ",
    "敵と戦え",
    "回復アイテムを使え",
    "インベントリを整理しろ"
];
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages
    ]
});
const commands = [
    new SlashCommandBuilder()
        .setName('randomvl')
        .setDescription('VC参加者にランダムなゲーム指示をDMで送信します')
        .toJSON()
];
client.once('ready', async () => {
    console.log(client.user.tag + ' がオンラインになりました');
    
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        console.log('コマンドを登録中...');
        // グローバルコマンド（反映まで最大1時間）
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );
        
        // 特定のサーバーのみ（即座に反映）- 必要に応じてコメントアウト解除
        // const GUILD_ID = 'あなたのサーバーID';
        // await rest.put(
        //     Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        //     { body: commands }
        // );
        console.log('コマンド登録完了');
    } catch (error) {
        console.error('コマンド登録失敗:', error);
    }
});
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    console.log(`コマンド実行: ${interaction.commandName} by ${interaction.user.tag}`);
    
    if (interaction.commandName === 'randomvl') {
        try {
            // 最初に遅延レスポンスを送信（3秒制限を回避）
            await interaction.deferReply({ ephemeral: true });
            console.log('deferReply完了');
            
            const member = interaction.member;
            const voiceChannel = member.voice.channel;
            if (!voiceChannel) {
                console.log('ユーザーがVCに参加していません');
                return await interaction.editReply({
                    content: 'ボイスチャンネルに参加してください'
                });
            }
            
            const vcMembers = voiceChannel.members.filter(m => !m.user.bot);
            console.log(`VC参加者数: ${vcMembers.size}`);
            
            if (vcMembers.size === 0) {
                return await interaction.editReply({
                    content: '他の参加者がいません'
                });
            }
            
            let successCount = 0;
            let failCount = 0;
            for (const [userId, member] of vcMembers) {
                try {
                    const randomMessage = gameMessages[Math.floor(Math.random() * gameMessages.length)];
                    console.log(`${member.user.tag}にDM送信中: ${randomMessage}`);
                    await member.user.send('ゲーム指示: ' + randomMessage);
                    successCount++;
                    console.log(`${member.user.tag}への送信成功`);
                } catch (error) {
                    console.error(member.user.tag + ' へのDM送信失敗:', error.message);
                    failCount++;
                }
            }
            const resultMessage = successCount + '名にメッセージを送信しました' + 
                (failCount > 0 ? '\n' + failCount + '名への送信に失敗しました' : '');
            
            console.log(`結果: ${resultMessage}`);
            await interaction.editReply({
                content: resultMessage
            });
        } catch (error) {
            console.error('メインエラー:', error);
            if (interaction.deferred) {
                await interaction.editReply({
                    content: 'エラーが発生しました: ' + error.message
                });
            } else {
                await interaction.reply({
                    content: 'エラーが発生しました: ' + error.message,
                    ephemeral: true
                });
            }
        }
    }
});
// プロセス終了時の処理
process.on('SIGINT', () => {
    console.log('Botを終了します...');
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Botを終了します...');
    client.destroy();
    process.exit(0);
});

// 未処理の例外をキャッチ
process.on('unhandledRejection', (reason, promise) => {
    console.error('未処理のPromise拒否:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('未処理の例外:', error);
});

client.on('error', console.error);
client.login(TOKEN);