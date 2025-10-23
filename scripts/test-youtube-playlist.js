const axios = require('axios');

// Dados de exemplo baseados no JSON fornecido pelo usuário
const testData = {
  courseId: "seu-course-id-aqui", // Substitua pelo ID de um curso existente
  subCourseName: "Curso React Completo",
  subCourseDescription: "Curso completo de React do zero ao avançado com todos os conceitos fundamentais",
  videos: [
    {
      "videoId": "FXqX7oof0I4",
      "title": "Curso React: Introdução - #01",
      "description": "💡 Conheça nosso curso completo de React: https://app.horadecodar.com.br/course/curso-react-js-completo/lp\n\n📘 Ebook gratuito de React: https://app.horadecodar.com.br/ebookpages/ebook-react-js-para-iniciantes\n\nNeste vídeo você vai conhecer o projeto que vamos desenvolver no curso de #React e também aprender o que é e para que é utilizado o React, a biblioteca #JavaScript mais utilizada da atualidade\n\nO curso também será apresentado, para você saber os pré-requisitos, o que será ensinado sobre React e muito mais!\n\nRepositório: https://github.com/matheusbattisti/curso_react_yt\n★ Livros recomendados: https://www.horadecodar.com.br/ebooks-hora-de-codar/\n▶ Instagram: @horadecodar\n▶ GitHub: https://github.com/matheusbattisti/ 🔷 Telegram: https://t.me/horadecodar .\n🟣 Discord Hora de Codar: https://discord.gg/Veq4mvsWwk",
      "url": "https://www.youtube.com/watch?v=FXqX7oof0I4",
      "thumbnailUrl": "https://i.ytimg.com/vi/FXqX7oof0I4/hqdefault.jpg",
      "duration": 705,
      "channelTitle": "Matheus Battisti - Hora de Codar",
      "channelId": "UCDoFiMhpOnLFq1uG4RL4xag",
      "channelThumbnailUrl": "https://yt3.ggpht.com/fdujM6d1iUnRixJKEterkZL6fOZ6ecr2GPjlZ6hbzY7GPhkcxBslFKu7GF6mdvu7CWzeVMxN=s800-c-k-c0x00ffffff-no-rj",
      "publishedAt": "2021-08-02T21:30:00Z",
      "viewCount": 390243,
      "tags": [
        "matheus battisti",
        "hora de codar",
        "curso react",
        "cursto react completo",
        "aprender react",
        "tutorial react",
        "react js curso",
        "react hooks",
        "react eventos",
        "react useState",
        "react useRef",
        "react useeffect",
        "react curso completo",
        "tutorial completo react",
        "react js iniciante",
        "react js projeto",
        "react js curso completo",
        "react js curso rápido",
        "react curso rapido"
      ],
      "category": "28"
    },
    {
      "videoId": "Jg6JaEjovJk",
      "title": "Curso React: Instalando o React (create-react-app) - #02",
      "description": "💡 Conheça nosso curso completo de React: https://app.horadecodar.com.br/course/curso-react-js-completo/lp\n\n📘 Ebook gratuito de React: https://app.horadecodar.com.br/ebookpages/ebook-react-js-para-iniciantes\n\nNesta aula você vai aprender a instalar e também rodar uma aplicação em #React, vamos utilizar o create-react-app\n\nUma aplicação muito conhecida que nos dá diversas facilidades para trabalhar com React no ambiente de desenvolvimento, como um servidor embutido, por exemplo\n\nRepositório: https://github.com/matheusbattisti/curso_react_yt\n★ Livros recomendados: https://www.horadecodar.com.br/ebooks-hora-de-codar/\n▶ Instagram: @horadecodar\n▶ GitHub: https://github.com/matheusbattisti/ 🔷 Telegram: https://t.me/horadecodar .\n🟣 Discord Hora de Codar: https://discord.gg/Veq4mvsWwk",
      "url": "https://www.youtube.com/watch?v=Jg6JaEjovJk",
      "thumbnailUrl": "https://i.ytimg.com/vi/Jg6JaEjovJk/hqdefault.jpg",
      "duration": 881,
      "channelTitle": "Matheus Battisti - Hora de Codar",
      "channelId": "UCDoFiMhpOnLFq1uG4RL4xag",
      "channelThumbnailUrl": "https://yt3.ggpht.com/fdujM6d1iUnRixJKEterkZL6fOZ6ecr2GPjlZ6hbzY7GPhkcxBslFKu7GF6mdvu7CWzeVMxN=s800-c-k-c0x00ffffff-no-rj",
      "publishedAt": "2021-08-02T22:30:03Z",
      "viewCount": 205921,
      "tags": [
        "matheus battisti",
        "hora de codar",
        "curso react",
        "cursto react completo",
        "aprender react",
        "tutorial react",
        "react js curso",
        "react hooks",
        "react eventos",
        "react useState",
        "react useRef",
        "react useeffect",
        "react curso completo",
        "tutorial completo react",
        "react js iniciante",
        "react js projeto",
        "react js curso completo",
        "react js curso rápido",
        "react curso rapido",
        "create-react-app",
        "Create React App"
      ],
      "category": "28"
    },
    {
      "videoId": "9iKNxnFJY_Q",
      "title": "Curso React: Entendendo o JSX - #03",
      "description": "🔵Conheça nosso curso completo de React JS: https://app.horadecodar.com.br/course/curso-react-js-completo\n\n📘 Ebook gratuito de React: https://www.horadecodar.com.br/ebook-fundamentos-do-react-gratuito/\n\n★ Nossos Cursos: https://www.horadecodar.com.br/cursos-horadecodar/\n\nNeste vídeo vamos conhecer um recurso muito utilizado no #React o #JSX\n\nQue é a forma que escrevemos HTML no React, podendo deixar ele dinâmico, imprimindo valores de propriedades ou variáveis e também executando lógicas simples\n\nRepositório: https://github.com/matheusbattisti/curso_react_yt\n★ Livros recomendados: https://www.horadecodar.com.br/ebooks-hora-de-codar/\n▶ Instagram: @horadecodar\n▶ GitHub: https://github.com/matheusbattisti/ 🔷 Telegram: https://t.me/horadecodar .\n🟣 Discord Hora de Codar: https://discord.gg/Veq4mvsWwk",
      "url": "https://www.youtube.com/watch?v=9iKNxnFJY_Q",
      "thumbnailUrl": "https://i.ytimg.com/vi/9iKNxnFJY_Q/hqdefault.jpg",
      "duration": 784,
      "channelTitle": "Matheus Battisti - Hora de Codar",
      "channelId": "UCDoFiMhpOnLFq1uG4RL4xag",
      "channelThumbnailUrl": "https://yt3.ggpht.com/fdujM6d1iUnRixJKEterkZL6fOZ6ecr2GPjlZ6hbzY7GPhkcxBslFKu7GF6mdvu7CWzeVMxN=s800-c-k-c0x00ffffff-no-rj",
      "publishedAt": "2021-08-03T22:00:02Z",
      "viewCount": 124446,
      "tags": [
        "matheus battisti",
        "hora de codar",
        "curso react",
        "cursto react completo",
        "aprender react",
        "tutorial react",
        "react js curso",
        "react hooks",
        "react eventos",
        "react useState",
        "react useRef",
        "react useeffect",
        "react curso completo",
        "tutorial completo react",
        "react js iniciante",
        "react js projeto",
        "react js curso completo",
        "react js curso rápido",
        "react curso rapido",
        "react jsx",
        "jsx react"
      ],
      "category": "28"
    },
    {
      "videoId": "-wrsG0IGc-M",
      "title": "Curso React: Criando componentes no React - #04",
      "description": "🔴 CURSO COMPLETO DE REACT: https://www.udemy.com/course/react-do-zero-a-maestria-c-hooks-router-api-projetos/?couponCode=LANCOUREACT\n\n📘 Ebook gratuito de React: https://www.horadecodar.com.br/ebook-fundamentos-do-react-gratuito/\n\n★ Nossos Cursos: https://www.horadecodar.com.br/cursos-horadecodar/\n\nNeste vídeo vamos ampliar ainda mais os nossos conhecimentos em #React, criando componentes e entendendo para que eles servem\n\nDesta forma podemos deixar nossa aplicação com recursos mais reaproveitáveis, também melhorando a organização do código e a manutenibilidade\n\nRepositório: https://github.com/matheusbattisti/curso_react_yt\n★ Livros recomendados: https://www.horadecodar.com.br/ebooks-hora-de-codar/\n▶ Instagram: @horadecodar\n▶ GitHub: https://github.com/matheusbattisti/ 🔷 Telegram: https://t.me/horadecodar .\n🟣 Discord Hora de Codar: https://discord.gg/Veq4mvsWwk",
      "url": "https://www.youtube.com/watch?v=-wrsG0IGc-M",
      "thumbnailUrl": "https://i.ytimg.com/vi/-wrsG0IGc-M/hqdefault.jpg",
      "duration": 809,
      "channelTitle": "Matheus Battisti - Hora de Codar",
      "channelId": "UCDoFiMhpOnLFq1uG4RL4xag",
      "channelThumbnailUrl": "https://yt3.ggpht.com/fdujM6d1iUnRixJKEterkZL6fOZ6ecr2GPjlZ6hbzY7GPhkcxBslFKu7GF6mdvu7CWzeVMxN=s800-c-k-c0x00ffffff-no-rj",
      "publishedAt": "2021-08-04T22:00:00Z",
      "viewCount": 117430,
      "tags": [
        "matheus battisti",
        "hora de codar",
        "curso react",
        "cursto react completo",
        "aprender react",
        "tutorial react",
        "react js curso",
        "react hooks",
        "react eventos",
        "react useState",
        "react useRef",
        "react useeffect",
        "react curso completo",
        "tutorial completo react",
        "react js iniciante",
        "react js projeto",
        "react js curso completo",
        "react js curso rápido",
        "react curso rapido",
        "react componente",
        "react componente lifecycle"
      ],
      "category": "28"
    },
    {
      "videoId": "ZLtBdpwg8tI",
      "title": "Curso React: Trabalhando com props - #05",
      "description": "🔴 CURSO COMPLETO DE REACT: https://www.udemy.com/course/react-do-zero-a-maestria-c-hooks-router-api-projetos/?couponCode=LANCOUREACT\n\n📘 Ebook gratuito de React: https://www.horadecodar.com.br/ebook-fundamentos-do-react-gratuito/\n\n★ Nossos Cursos: https://www.horadecodar.com.br/cursos-horadecodar/\n\nNeste vídeo você vai aprender sobre as props em #React\n\nUm recurso que permite passar dados do componente pai para o componente filho, desta maneira você consegue deixar os componentes dinâmicos, reagindo aos dados enviados\n\nRepositório: https://github.com/matheusbattisti/curso_react_yt\n★ Livros recomendados: https://www.horadecodar.com.br/ebooks-hora-de-codar/\n▶ Instagram: @horadecodar\n▶ GitHub: https://github.com/matheusbattisti/ 🔷 Telegram: https://t.me/horadecodar .\n🟣 Discord Hora de Codar: https://discord.gg/Veq4mvsWwk",
      "url": "https://www.youtube.com/watch?v=ZLtBdpwg8tI",
      "thumbnailUrl": "https://i.ytimg.com/vi/ZLtBdpwg8tI/hqdefault.jpg",
      "duration": 720,
      "channelTitle": "Matheus Battisti - Hora de Codar",
      "channelId": "UCDoFiMhpOnLFq1uG4RL4xag",
      "channelThumbnailUrl": "https://yt3.ggpht.com/fdujM6d1iUnRixJKEterkZL6fOZ6ecr2GPjlZ6hbzY7GPhkcxBslFKu7GF6mdvu7CWzeVMxN=s800-c-k-c0x00ffffff-no-rj",
      "publishedAt": "2021-08-05T22:00:12Z",
      "viewCount": 109618,
      "tags": [
        "matheus battisti",
        "hora de codar",
        "curso react",
        "cursto react completo",
        "aprender react",
        "tutorial react",
        "react js curso",
        "react hooks",
        "react eventos",
        "react useState",
        "react useRef",
        "react useeffect",
        "react curso completo",
        "tutorial completo react",
        "react js iniciante",
        "react js projeto",
        "react js curso completo",
        "react js curso rápido",
        "react curso rapido",
        "react props",
        "react props state",
        "reactjs"
      ],
      "category": "28"
    }
  ]
};

async function testarProcessamentoPlaylist() {
  try {
    console.log('🚀 Testando processamento de playlist do YouTube...\n');

    // URL da API (ajuste conforme necessário)
    const apiUrl = 'http://localhost:3000/courses/process-youtube-playlist';
    
    // Token JWT (você precisa obter um token válido)
    const token = 'SEU_JWT_TOKEN_AQUI'; // Substitua por um token válido

    console.log('📤 Enviando dados para processamento...');
    console.log(`📊 Total de vídeos: ${testData.videos.length}`);
    console.log(`📚 Nome do subcurso: ${testData.subCourseName}\n`);

    const response = await axios.post(apiUrl, testData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Sucesso! Playlist processada com sucesso!\n');
    console.log('📋 Resultado:');
    console.log(`   - Subcurso criado: ${response.data.data.subCourse.name}`);
    console.log(`   - ID do subcurso: ${response.data.data.subCourse.id}`);
    console.log(`   - Total de módulos criados: ${response.data.data.modules.length}\n`);

    console.log('📚 Módulos criados:');
    response.data.data.modules.forEach((module, index) => {
      console.log(`   ${index + 1}. ${module.name}`);
      console.log(`      - ID: ${module.id}`);
      console.log(`      - Ordem: ${module.order}`);
      console.log(`      - Vídeos: ${module.videoCount}`);
      console.log(`      - Descrição: ${module.description}\n`);
    });

    console.log('🎥 Detalhes dos vídeos por módulo:');
    response.data.data.modules.forEach((module, moduleIndex) => {
      console.log(`\n   📁 Módulo ${moduleIndex + 1}: ${module.name}`);
      module.videos.forEach((video, videoIndex) => {
        console.log(`      ${videoIndex + 1}. ${video.title}`);
        console.log(`         - ID: ${video.id}`);
        console.log(`         - Video ID: ${video.videoId}`);
        console.log(`         - Ordem: ${video.order}`);
      });
    });

  } catch (error) {
    console.error('❌ Erro ao processar playlist:');
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Mensagem: ${error.response.data.message || error.response.data.error}`);
      
      if (error.response.data.details) {
        console.error('   Detalhes:', error.response.data.details);
      }
    } else if (error.request) {
      console.error('   Erro de conexão - verifique se a API está rodando');
    } else {
      console.error(`   Erro: ${error.message}`);
    }
  }
}

// Instruções de uso
console.log('📖 INSTRUÇÕES DE USO:');
console.log('1. Certifique-se de que a API está rodando (npm run start:dev)');
console.log('2. Substitua "SEU_JWT_TOKEN_AQUI" por um token JWT válido de admin');
console.log('3. Substitua "seu-course-id-aqui" pelo ID de um curso existente');
console.log('4. Execute: node scripts/test-youtube-playlist.js\n');

// Executar teste
testarProcessamentoPlaylist();
