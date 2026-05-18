let teamsData = {};

const teamCategoryCatalog = [
    'MOSQUITO',
    'U8 BABY MIXTO',
    'U10 PREMINI DAMAS',
    'U10 PREMINI VARONES',
    'U10 PREMINI MIXTO',
    'U12 DAMAS',
    'U12 VARONES',
    'U12 MIXTO',
    'U13 PASARELA DAMAS',
    'U13 PASARELA VARONES',
    'U15 INFANTIL DAMAS',
    'U15 INFANTIL VARONES',
    'U17 CADETES DAMAS',
    'U17 CADETES VARONES',
    'U19 JUVENIL DAMAS',
    'U19 JUVENIL VARONES',
    'U22 DAMAS',
    'U22 VARONES',
    'U25 DAMAS',
    'U25 VARONES',
    '4TA DE ASCENSO VARONES',
    '3RA DE ASCENSO DAMAS',
    '3RA DE ASCENSO VARONES',
    '2DA DE ASCENSO DAMAS',
    '2DA DE ASCENSO VARONES',
    '1RA DE ASCENSO DAMAS',
    '1RA DE ASCENSO VARONES',
    'HONOR DAMAS',
    'HONOR VARONES'
];

async function loadData() {
    try {
        // Cargar datos de equipos
        const teamsResponse = await fetch('./teams.json');
        if (!teamsResponse.ok) throw new Error(`HTTP error! status: ${teamsResponse.status}`);
        teamsData = await teamsResponse.json();

        init();
    } catch (error) {
        console.error('Error cargando datos:', error);
        init();
    }
}

// Función para cambiar de pestaña
function showTab(tabName) {
    // Ocultar todos los tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Remover clase active de todos los botones
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    // Mostrar el tab seleccionado
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

// Función para renderizar logo (imagen o texto)
function renderLogo(logo) {
    // Si contiene extensión de archivo, es una imagen
    if (logo && (logo.includes('.jpg') || logo.includes('.png') || logo.includes('.gif'))) {
        return `<img src="${logo}" alt="Logo" class="logo-image">`;
    }
    // Si no, es una abreviatura de texto
    return logo;
}

function slugify(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
}

function getTeamFileName(team) {
    return `${String(team.id).padStart(2, '0')}-${slugify(team.name)}.json`;
}

// Renderizar Equipos
function renderTeams() {
    const container = document.getElementById('teams-list');
    
    if (!teamsData.teams || teamsData.teams.length === 0) {
        container.innerHTML = '<div class="no-data">No hay datos de equipos disponibles</div>';
        return;
    }

    function getCategoryPlayers(team, categoryName) {
        if (team.categories && !Array.isArray(team.categories) && Array.isArray(team.categories[categoryName])) {
            return team.categories[categoryName];
        }

        if (Array.isArray(team.players)) {
            return team.players.filter(player => player.category === categoryName);
        }

        return [];
    }

    let html = teamsData.teams.map(team => {
        const assignedCategories = Array.isArray(team.categories)
            ? team.categories.filter(category => typeof category === 'string' && category !== 'Por asignar')
            : [];
        const teamFileName = getTeamFileName(team);

        const categoryPanels = teamCategoryCatalog.map(categoryName => {
            const categoryPlayers = getCategoryPlayers(team, categoryName);
            const isAssigned = (Array.isArray(team.activeCategories) && team.activeCategories.includes(categoryName)) || assignedCategories.includes(categoryName) || categoryPlayers.length > 0;
            const detailUrl = `category.html?team=${encodeURIComponent(teamFileName)}&category=${encodeURIComponent(categoryName)}`;

            return `
                <a class="category-panel category-panel-link ${isAssigned ? 'category-panel-active' : ''}" href="${detailUrl}">
                            <div class="category-panel-header">
                                <span class="category-panel-name">${categoryName}</span>
                            </div>
                    <div class="category-panel-body">
                                ${categoryPlayers.length > 0
                                    ? categoryPlayers.map(player => `
                                        <div class="player-chip">
                                            <strong>${player.name || 'Sin nombre'}</strong>
                                            <span>Fecha de nacimiento: ${player.birthDate || player.dateOfBirth || 'N/D'}</span>
                                            <span>Club actual: ${player.currentClub || team.name || 'N/D'}</span>
                                        </div>
                                    `).join('')
                                    : ''}
                    </div>
                        </a>`;
        }).join('');

        return `
            <div class="team-card team-card-wide">
                <div class="team-card-header">
                    <div class="team-card-logo">${renderLogo(team.logo)}</div>
                    <div class="team-card-info">
                        <h3 class="team-card-name">${team.name}</h3>
                        <p class="team-card-city">${team.city}</p>
                    </div>
                </div>
                <div class="team-categories-grid">
                    ${categoryPanels}
                </div>
            </div>`;
    }).join('');

    container.innerHTML = html;
}

// Inicializar la página
function init() {
    renderTeams();
}

// Cargar datos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', loadData);
