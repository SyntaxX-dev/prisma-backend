/**
 * Exemplo de uso da YouTube Data API
 * 
 * Para usar este script:
 * 1. Configure a variável YOUTUBE_API_KEY no seu .env
 * 2. Execute: node scripts/youtube-example.js
 */

const { google } = require('googleapis');
require('dotenv').config();

async function exemploYouTubeAPI() {
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
        console.error('❌ YOUTUBE_API_KEY não encontrada no .env');
        console.log('📝 Adicione YOUTUBE_API_KEY=your-api-key no seu arquivo .env');
        return;
    }

    const youtube = google.youtube({
        version: 'v3',
        auth: apiKey,
    });

    try {
        console.log('🔍 Buscando vídeos sobre "NestJS tutorial"...\n');

        // Buscar vídeos
        const searchResponse = await youtube.search.list({
            part: ['snippet'],
            q: 'NestJS tutorial',
            maxResults: 5,
            order: 'relevance',
            type: ['video'],
        });

        if (!searchResponse.data.items) {
            console.log('❌ Nenhum vídeo encontrado');
            return;
        }

        // Obter IDs dos vídeos
        const videoIds = searchResponse.data.items
            .map(item => item.id?.videoId)
            .filter(Boolean);

        console.log(`📹 Encontrados ${videoIds.length} vídeos:\n`);

        // Buscar detalhes dos vídeos
        const videoResponse = await youtube.videos.list({
            part: ['snippet', 'statistics', 'contentDetails'],
            id: videoIds,
        });

        videoResponse.data.items?.forEach((video, index) => {
            const snippet = video.snippet;
            const statistics = video.statistics;
            const contentDetails = video.contentDetails;

            console.log(`${index + 1}. ${snippet?.title}`);
            console.log(`   📺 Canal: ${snippet?.channelTitle}`);
            console.log(`   👀 Visualizações: ${statistics?.viewCount || 'N/A'}`);
            console.log(`   📅 Publicado: ${snippet?.publishedAt}`);
            console.log(`   🔗 URL: https://www.youtube.com/watch?v=${video.id}`);
            console.log(`   📝 Descrição: ${snippet?.description?.substring(0, 100)}...`);
            console.log('');
        });

        // Exemplo de busca por playlist
        console.log('🎵 Buscando playlists sobre "JavaScript"...\n');

        const playlistResponse = await youtube.search.list({
            part: ['snippet'],
            q: 'JavaScript playlist',
            maxResults: 3,
            type: ['playlist'],
        });

        if (playlistResponse.data.items) {
            console.log(`📚 Encontradas ${playlistResponse.data.items.length} playlists:\n`);

            playlistResponse.data.items.forEach((playlist, index) => {
                const snippet = playlist.snippet;
                console.log(`${index + 1}. ${snippet?.title}`);
                console.log(`   📺 Canal: ${snippet?.channelTitle}`);
                console.log(`   🔗 URL: https://www.youtube.com/playlist?list=${playlist.id?.playlistId}`);
                console.log('');
            });
        }

    } catch (error) {
        console.error('❌ Erro ao buscar dados do YouTube:', error.message);

        if (error.code === 403) {
            console.log('💡 Dica: Verifique se sua API key está correta e se a YouTube Data API v3 está habilitada');
        } else if (error.code === 400) {
            console.log('💡 Dica: Verifique se os parâmetros da requisição estão corretos');
        }
    }
}

// Executar exemplo
exemploYouTubeAPI();
