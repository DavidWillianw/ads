// Configurações do Airtable (Mantidas conforme o original)
const CONFIG = {
    BASE_ID: 'appG5NOoblUmtSMVI',
    API_KEY: 'pat5T28kjmJ4t6TQG.69bf34509e687fff6a3f76bd52e64518d6c92be8b1ee0a53bcc9f50fedcb5c70'
};

// Estado Global da Aplicação
const AppState = {
    artists: [],
    songs: []
};

// 1. API: Funções de Comunicação com o Airtable
async function fetchAirtableData(tableName) {
    const url = `https://api.airtable.com/v0/${CONFIG.BASE_ID}/${encodeURIComponent(tableName)}`;
    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${CONFIG.API_KEY}` }
        });
        
        if (!response.ok) throw new Error(`Erro ao carregar ${tableName}`);
        
        const data = await response.json();
        return data.records;
    } catch (error) {
        console.error(error);
        return [];
    }
}

// 2. Lógica Principal: Carregar Dados
async function initApp() {
    console.log("A inicializar a aplicação...");
    
    // Carregar Artistas e Músicas em paralelo para ser mais rápido
    const [artistsData, songsData] = await Promise.all([
        fetchAirtableData('Artists'),
        fetchAirtableData('Músicas')
    ]);

    // Formatar Artistas
    AppState.artists = artistsData.map(record => ({
        id: record.id,
        name: record.fields.Name || 'Artista Desconhecido',
        imageUrl: record.fields['URL da Imagem']?.[0]?.url || 'https://i.imgur.com/AD3MbBi.png'
    }));

    // Formatar Músicas
    AppState.songs = songsData.map(record => {
        // Encontrar o nome do artista usando a relação de IDs
        const artistId = record.fields['Artista']?.[0];
        const artistObj = AppState.artists.find(a => a.id === artistId);
        
        return {
            id: record.id,
            title: record.fields['Nome da Faixa'] || 'Faixa Sem Nome',
            artistName: artistObj ? artistObj.name : 'Vários Artistas',
            // Aqui você pode adicionar um campo no seu Airtable chamado "Spotify ID" futuramente
            // Para testar, estou a atribuir um ID do Spotify genérico (AKB48 - Heavy Rotation) a todas as faixas que não tenham ID
            spotifyId: record.fields['Spotify ID'] || '1xKPEh3HwEiEQE4S8Hn6tS' 
        };
    });

    renderUI();
}

// 3. Interface: Renderizar os elementos no ecrã
function renderUI() {
    const artistsGrid = document.getElementById('artistsGrid');
    const songsList = document.getElementById('songsList');

    // Renderizar Artistas (Limitado a 10 para o Início)
    if (AppState.artists.length > 0) {
        artistsGrid.innerHTML = AppState.artists.slice(0, 10).map(artist => `
            <div class="artist-card">
                <img src="${artist.imageUrl}" alt="${artist.name}">
                <h4>${artist.name}</h4>
            </div>
        `).join('');
    } else {
        artistsGrid.innerHTML = '<p>Nenhum artista encontrado no Airtable.</p>';
    }

    // Renderizar Músicas
    if (AppState.songs.length > 0) {
        songsList.innerHTML = AppState.songs.slice(0, 10).map(song => `
            <div class="song-row" onclick="playTrackOnSpotify('${song.spotifyId}')">
                <i class="fas fa-play"></i>
                <div class="song-info">
                    <span class="song-title">${song.title}</span>
                    <span class="song-artist">${song.artistName}</span>
                </div>
            </div>
        `).join('');
    } else {
        songsList.innerHTML = '<p>Nenhuma música encontrada no Airtable.</p>';
    }
}

// 4. Integração Spotify: Tocar música no Iframe
window.playTrackOnSpotify = function(spotifyTrackId) {
    const player = document.getElementById('spotifyPlayer');
    // Atualiza o src do iframe com o ID da nova música, o que força o Spotify a carregar a nova faixa
    player.src = `https://open.spotify.com/embed/track/${spotifyTrackId}?utm_source=generator&theme=0`;
    console.log(`A tocar faixa do Spotify com ID: ${spotifyTrackId}`);
};

// Arrancar a aplicação quando a página carregar
document.addEventListener('DOMContentLoaded', initApp);
