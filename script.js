let teamsData = {};

const carnetPathMatch = window.location.pathname.replace(/\/+$/, '').match(/^\/carnet\/([^/?#]+)$/i);
const selectedCarnet = carnetPathMatch ? decodeURIComponent(carnetPathMatch[1]) : '';

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

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function normalizeIdentifier(value) {
    return String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '')
        .toLowerCase();
}

async function loadData() {
    try {
        const teamsResponse = await fetch('./teams.json');
        if (!teamsResponse.ok) throw new Error(`HTTP error! status: ${teamsResponse.status}`);
        teamsData = await teamsResponse.json();

        if (selectedCarnet) {
            await renderCarnetView(selectedCarnet);
            return;
        }

        init();
    } catch (error) {
        console.error('Error cargando datos:', error);
        renderError('No se pudieron cargar los datos de la asociación.');
    }
}

function showTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

function renderLogo(logo) {
    if (logo && (logo.includes('.jpg') || logo.includes('.png') || logo.includes('.gif'))) {
        return `<img src="${logo}" alt="Logo" class="logo-image">`;
    }
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

function updateMainSectionTitle(title) {
    const titleElement = document.getElementById('main-section-title');
    if (titleElement) {
        titleElement.textContent = title;
    }
}

function setCarnetModeControls(carnetValue) {
    const tabs = document.querySelector('.tabs');
    if (tabs) {
        tabs.innerHTML = `<a class="tab-btn active" href="/">Volver a equipos</a>`;
    }

    updateMainSectionTitle(`Carnet ${carnetValue}`);
    document.title = `Carnet ${carnetValue} - Asociación Cochabamba`;
}

function getPlayerIdentifierFields(player) {
    const fields = [
        player?.ci,
        player?.CI,
        player?.carnet,
        player?.carnetNumber,
        player?.numeroCarnet,
        player?.nroCarnet,
        player?.documentNumber,
        player?.numeroDocumento,
        player?.dni,
        player?.cedula,
        player?.identityCard,
        player?.id,
        player?.identification?.ci,
        player?.identification?.carnet,
        player?.identification?.documentNumber,
        player?.identification?.numeroDocumento
    ];

    return fields
        .filter(value => value !== undefined && value !== null && String(value).trim() !== '')
        .map(value => normalizeIdentifier(value));
}

function playerMatchesCarnet(player, carnetValue) {
    const target = normalizeIdentifier(carnetValue);
    return getPlayerIdentifierFields(player).some(identifier => identifier === target);
}

function collectPlayersFromTeam(teamMeta, teamJson) {
    const matches = [];
    const teamInfo = teamJson.team || teamMeta;
    const categories = teamJson.categories && typeof teamJson.categories === 'object' ? teamJson.categories : {};

    Object.entries(categories).forEach(([categoryName, players]) => {
        if (!Array.isArray(players)) {
            return;
        }

        players.forEach(player => {
            matches.push({
                team: teamInfo,
                categoryName,
                player,
            });
        });
    });

    if (Array.isArray(teamJson.players)) {
        teamJson.players.forEach(player => {
            matches.push({
                team: teamInfo,
                categoryName: player.category || 'Sin categoría',
                player,
            });
        });
    }

    return matches;
}

async function loadAllPlayers() {
    if (!Array.isArray(teamsData.teams)) {
        return [];
    }

    const teamLoads = await Promise.allSettled(
        teamsData.teams.map(async team => {
            const teamFileName = getTeamFileName(team);
            const response = await fetch(`./equipos/${teamFileName}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const teamJson = await response.json();
            return collectPlayersFromTeam(team, teamJson);
        })
    );

    return teamLoads.flatMap(result => (result.status === 'fulfilled' ? result.value : []));
}

function renderError(message) {
    const tabs = document.querySelector('.tabs');
    if (tabs && selectedCarnet) {
        tabs.innerHTML = `<a class="tab-btn active" href="/">Volver a equipos</a>`;
        updateMainSectionTitle(`Carnet ${selectedCarnet}`);
        document.title = `Carnet ${selectedCarnet} - Asociación Cochabamba`;
    }

    const container = document.getElementById('teams-list');
    if (container) {
        container.innerHTML = `<div class="no-data">${escapeHtml(message)}</div>`;
    }
}

function renderCarnetCard(match, carnetValue) {
    const player = match.player || {};
    const team = match.team || {};
    const displayName = player.name || 'Sin nombre';
    const matchedId = getPlayerIdentifierFields(player)[0] || carnetValue;

    return `
        <div class="team-card team-card-wide category-detail-card-inner">
            <div class="team-card-header">
                <div class="team-card-logo">${renderLogo(team.logo)}</div>
                <div class="team-card-info">
                    <h3 class="team-card-name">${escapeHtml(displayName)}</h3>
                    <p class="team-card-city">${escapeHtml(team.name || 'Equipo no disponible')}</p>
                </div>
            </div>
            <div class="category-detail-title">Resultado del carnet</div>
            <div class="category-detail-meta">CI consultado: ${escapeHtml(carnetValue)}</div>
            <div class="category-detail-list">
                <div class="player-chip">
                    <strong>CI</strong>
                    <span>${escapeHtml(matchedId)}</span>
                </div>
                <div class="player-chip">
                    <strong>Categoría</strong>
                    <span>${escapeHtml(match.categoryName || 'Sin categoría')}</span>
                </div>
                <div class="player-chip">
                    <strong>Fecha de nacimiento</strong>
                    <span>${escapeHtml(player.birthDate || player.dateOfBirth || 'N/D')}</span>
                </div>
                <div class="player-chip">
                    <strong>Club actual</strong>
                    <span>${escapeHtml(player.currentClub || team.name || 'N/D')}</span>
                </div>
            </div>
        </div>
    `;
}

async function renderCarnetView(carnetValue) {
    setCarnetModeControls(carnetValue);

    const container = document.getElementById('teams-list');
    if (container) {
        container.innerHTML = '<div class="no-data">Buscando información del carnet...</div>';
    }

    const allPlayers = await loadAllPlayers();
    const matches = allPlayers.filter(entry => playerMatchesCarnet(entry.player, carnetValue));
    const containerTitle = document.getElementById('teams-list');

    if (!containerTitle) {
        return;
    }

    if (matches.length === 0) {
        const hasAnyIdentifiers = allPlayers.some(entry => getPlayerIdentifierFields(entry.player).length > 0);
        containerTitle.innerHTML = `
            <div class="team-card team-card-wide category-detail-card-inner">
                <div class="team-card-header">
                    <div class="team-card-logo">QR</div>
                    <div class="team-card-info">
                        <h3 class="team-card-name">Carnet no encontrado</h3>
                        <p class="team-card-city">No existe una coincidencia para el CI escaneado</p>
                    </div>
                </div>
                <div class="category-detail-title">${escapeHtml(carnetValue)}</div>
                <div class="category-detail-meta">
                    ${hasAnyIdentifiers
                        ? 'Verifica que el CI del carnet coincida exactamente con el valor cargado en el registro del jugador.'
                        : 'Los datos actuales todavía no incluyen CI cargados en los registros de jugadores. Agrega el número de carnet al campo ci, carnet o documentNumber para habilitar la búsqueda.'}
                </div>
            </div>
        `;
        return;
    }

    const renderMatches = matches.map(match => renderCarnetCard(match, carnetValue)).join('');
    containerTitle.innerHTML = renderMatches;
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

function init() {
    renderTeams();
}

document.addEventListener('DOMContentLoaded', loadData);
