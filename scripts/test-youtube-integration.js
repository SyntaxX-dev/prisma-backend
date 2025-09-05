const { google } = require('googleapis');
require('dotenv').config();

async function testarIntegracaoYouTube() {
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
        console.log('❌ YOUTUBE_API_KEY não encontrada no .env');
        console.log('📝 Adicione YOUTUBE_API_KEY=sua-chave no arquivo .env');
        console.log('🔗 Obtenha sua chave em: https://console.cloud.google.com/');
        return;
    }

    const youtube = google.youtube({
        version: 'v3',
        auth: apiKey,
    });

    console.log('🚀 Testando integração com YouTube Data API v3\n');

    try {

        console.log('📚 Teste 1: Buscando vídeos sobre "curso online"...');
        const searchResponse = await youtube.search.list({
            part: ['snippet'],
            q: 'curso online programação',
            maxResults: 3,
            order: 'relevance',
            type: ['video'],
        });

        if (searchResponse.data.items && searchResponse.data.items.length > 0) {
            console.log(`✅ Encontrados ${searchResponse.data.items.length} vídeos\n`);

            const videoIds = searchResponse.data.items
                .map(item => item.id?.videoId)
                .filter(Boolean);

            const videoDetails = await youtube.videos.list({
                part: ['snippet', 'statistics', 'contentDetails'],
                id: videoIds,
            });

            videoDetails.data.items?.forEach((video, index) => {
                const snippet = video.snippet;
                const stats = video.statistics;
                const content = video.contentDetails;

                console.log(`${index + 1}. 📹 ${snippet?.title}`);
                console.log(`   📺 Canal: ${snippet?.channelTitle}`);
                console.log(`   👀 Views: ${stats?.viewCount || 'N/A'}`);
                console.log(`   📅 Publicado: ${snippet?.publishedAt}`);
                console.log(`   🔗 URL: https://www.youtube.com/watch?v=${video.id}`);
                console.log(`   ⏱️  Duração: ${content?.duration || 'N/A'}`);
                console.log('');
            });
        } else {
            console.log('❌ Nenhum vídeo encontrado\n');
        }

        console.log('🎵 Teste 2: Buscando playlists educacionais...');
        const playlistResponse = await youtube.search.list({
            part: ['snippet'],
            q: 'playlist programação javascript',
            maxResults: 2,
            type: ['playlist'],
        });

        if (playlistResponse.data.items && playlistResponse.data.items.length > 0) {
            console.log(`✅ Encontradas ${playlistResponse.data.items.length} playlists\n`);

            for (const playlist of playlistResponse.data.items) {
                const snippet = playlist.snippet;
                console.log(`📚 ${snippet?.title}`);
                console.log(`   📺 Canal: ${snippet?.channelTitle}`);
                console.log(`   🔗 URL: https://www.youtube.com/playlist?list=${playlist.id?.playlistId}`);
                console.log(`   📝 Descrição: ${snippet?.description?.substring(0, 100)}...`);
                console.log('');
            }
        } else {
            console.log('❌ Nenhuma playlist encontrada\n');
        }

        console.log('🎯 Teste 3: Extraindo dados de vídeo específico...');
        const videoId = 'dQw4w9WgXcQ';

        try {
            const videoResponse = await youtube.videos.list({
                part: ['snippet', 'statistics', 'contentDetails'],
                id: [videoId],
            });

            if (videoResponse.data.items && videoResponse.data.items.length > 0) {
                const video = videoResponse.data.items[0];
                const snippet = video.snippet;
                const stats = video.statistics;
                const content = video.contentDetails;

                console.log('✅ Dados extraídos com sucesso:');
                console.log(`   📹 Título: ${snippet?.title}`);
                console.log(`   📺 Canal: ${snippet?.channelTitle}`);
                console.log(`   👀 Views: ${stats?.viewCount || 'N/A'}`);
                console.log(`   👍 Likes: ${stats?.likeCount || 'N/A'}`);
                console.log(`   📅 Publicado: ${snippet?.publishedAt}`);
                console.log(`   ⏱️  Duração: ${content?.duration || 'N/A'}`);
                console.log(`   🏷️  Tags: ${snippet?.tags?.slice(0, 3).join(', ') || 'Nenhuma'}`);
                console.log(`   🔗 URL: https://www.youtube.com/watch?v=${video.id}`);
                console.log('');
            } else {
                console.log('❌ Vídeo não encontrado\n');
            }
        } catch (videoError) {
            console.log('❌ Erro ao obter vídeo específico:', videoError.message);
        }

        console.log('🎉 Todos os testes concluídos com sucesso!');
        console.log('💡 Sua integração com YouTube está funcionando perfeitamente.');
        console.log('📖 Consulte YOUTUBE_INTEGRATION.md para mais detalhes sobre como usar.');

    } catch (error) {
        console.error('❌ Erro durante os testes:', error.message);

        if (error.code === 403) {
            console.log('\n💡 Possíveis soluções:');
            console.log('   1. Verifique se sua API key está correta');
            console.log('   2. Confirme se a YouTube Data API v3 está habilitada');
            console.log('   3. Verifique se não excedeu a quota diária');
        } else if (error.code === 400) {
            console.log('\n💡 Verifique se os parâmetros da requisição estão corretos');
        }
    }
}

testarIntegracaoYouTube();
