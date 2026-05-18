let teamsData = {};
let teamData = null;
let selectedCategory = '';

function slugify(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
}

function renderLogo(logo) {
    if (logo && (logo.includes('.jpg') || logo.includes('.png') || logo.includes('.gif'))) {
        return `<img src="${logo}" alt="Logo" class="logo-image">`;
    }
    return logo;
}

function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        teamFile: params.get('team') || '',
        category: params.get('category') || ''
    };
}

function resolveTeamFile(teamFile) {
    if (teamFile) return teamFile;
    return '';
}

function getCategoryPlayers(team, categoryName) {
    if (team && team.categories && !Array.isArray(team.categories) && Array.isArray(team.categories[categoryName])) {
        return team.categories[categoryName];
    }
    if (Array.isArray(team?.players)) {
        return team.players.filter(player => player.category === categoryName);
    }
    return [];
}

async function loadData() {
    const { teamFile, category } = getQueryParams();
    selectedCategory = category;

    try {
        const teamsResponse = await fetch('./teams.json');
        if (!teamsResponse.ok) throw new Error(`HTTP error! status: ${teamsResponse.status}`);
        teamsData = await teamsResponse.json();

        const resolvedFile = resolveTeamFile(teamFile);
        const teamMeta = (teamsData.teams || []).find(team => `${String(team.id).padStart(2, '0')}-${slugify(team.name)}.json` === resolvedFile);

        if (!teamMeta) {
            renderError('No se encontró el equipo solicitado.');
            return;
        }

        const teamResponse = await fetch(`./equipos/${resolvedFile}`);
        if (!teamResponse.ok) throw new Error(`HTTP error! status: ${teamResponse.status}`);
        teamData = await teamResponse.json();

        renderCategoryDetail(teamMeta, teamData, selectedCategory);
    } catch (error) {
        console.error('Error cargando detalle de categoria:', error);
        renderError('No se pudo cargar la categoría.');
    }
}

function renderError(message) {
    const container = document.getElementById('category-detail');
    container.innerHTML = `<div class="no-data">${message}</div>`;
}

function renderCategoryDetail(teamMeta, teamJson, categoryName) {
    const container = document.getElementById('category-detail');
    const players = getCategoryPlayers(teamJson, categoryName);
    const categoryLabel = categoryName || 'Categoría no especificada';

    document.title = `${teamMeta.name} - ${categoryLabel}`;

    container.innerHTML = `
        <div class="team-card team-card-wide category-detail-card-inner">
            <div class="team-card-header">
                <div class="team-card-logo">${renderLogo(teamMeta.logo)}</div>
                <div class="team-card-info">
                    <h3 class="team-card-name">${teamMeta.name}</h3>
                    <p class="team-card-city">${teamMeta.city}</p>
                </div>
            </div>
            <div class="category-detail-title">${categoryLabel}</div>
            <div class="category-detail-meta">${players.length} jugador${players.length === 1 ? '' : 'es'}</div>
            <div class="category-detail-list">
                ${players.length > 0 ? players.map(player => `
                    <div class="player-chip">
                        <strong>${player.name || 'Sin nombre'}</strong>
                        <span>Fecha de nacimiento: ${player.birthDate || player.dateOfBirth || 'N/D'}</span>
                        <span>Club actual: ${player.currentClub || teamMeta.name || 'N/D'}</span>
                    </div>
                `).join('') : ''}
            </div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', loadData);
