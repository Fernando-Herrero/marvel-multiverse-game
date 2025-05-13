import { renderBattleCards } from "./battle.js";
import { fetchCharactersByName } from "./character.js";
import { mapScreen } from "./index.js";
import { charactersSelect } from "./login.js";
import { clearStorageKey, loadFromStorage, saveToStorage } from "./storage.js";
import { hideModal, showBriefing } from "./utils.js";

export const levelEnemies = {
	heroes: [
		{
			name: "Loki",
			imageUrl: "",
			level: 1,
			description: "Dios de las Mentiras - Nueva York",
			powers: "Ilusiones, Dagas Mágicas",
			reward: "Gema del Espacio",
		},
		{
			name: "Red Skull",
			imageUrl: "",
			level: 2,
			description: "Cráneo Rojo - Europa 1945",
			powers: "Fuerza Mejorada, Pistolas de Energía",
			reward: "Gema de la Mente",
		},
		{
			name: "Ultron",
			imageUrl: "",
			level: 3,
			description: "IA Despiadada - Sokovia",
			powers: "Ejército de Drones, Vuelo",
			reward: "Gema del Alma",
		},
		{
			name: "Hela",
			imageUrl: "",
			level: 4,
			description: "Diosa de la Muerte - Asgard",
			powers: "Espadas Infinitas, Inmortalidad",
			reward: "Gema del Poder",
		},
		{
			name: "Thanos",
			imageUrl: "",
			level: 5,
			description: "El Titán Loco - Titán",
			powers: "Fuerza Cósmica, Guantelete",
			reward: "Gema de la Realidad",
		},
		{
			name: "Doctor Doom",
			imageUrl: "",
			level: 6,
			description: "Señor de Latveria - Dimensión Oscura",
			powers: "Magia y Tecnología, Armadura",
			reward: "Gema del Tiempo",
		},
	],
	villains: [
		{
			name: "Black Widow",
			imageUrl: "",
			level: 1,
			description: "Espía Letal - Budapest",
			powers: "Combate cuerpo a cuerpo, Sigilo",
			reward: "Información secreta obtenida",
		},
		{
			name: "Spider-Man",
			imageUrl: "",
			level: 2,
			description: "El Hombre Araña - Queens",
			powers: "Sentido arácnido, Telarañas",
			reward: "Tecnología de Stark hackeada",
		},
		{
			name: "Iron Man",
			imageUrl: "",
			level: 3,
			description: "Genio, Millonario - Torre Stark",
			powers: "Armadura MK-50, IA Friday",
			reward: "Armadura dañada robada",
		},
		{
			name: "Captain America",
			imageUrl: "",
			level: 4,
			description: "El Primer Vengador - Washington",
			powers: "Escudo de Vibranium, Liderazgo",
			reward: "Escudo copiado para experimentos",
		},
		{
			name: "Thor",
			imageUrl: "",
			level: 5,
			description: "Dios del Trueno - Asgard",
			powers: "Mjolnir, Control del Clima",
			reward: "Energía del rayo condensada",
		},
		{
			name: "Hulk",
			imageUrl: "",
			level: 6,
			description: "Furia Imparable - Laboratorio Gamma",
			powers: "Fuerza Bruta, Regeneración",
			reward: "ADN Gamma mutado",
		},
	],
};

export const levels = document.querySelectorAll(".level");
export const player = document.getElementById("player");
export const map = document.getElementById("map");
export const levelInfo = document.getElementById("level-info");
export const battleScreen = document.getElementById("battle-screen");

export const imageEnemies = async () => {
	for (const enemy of levelEnemies.heroes) {
		const characterData = await fetchCharactersByName(enemy.name);
		if (characterData) {
			enemy.imageUrl = characterData.image.url;
		}
	}

	for (const enemy of levelEnemies.villains) {
		const characterData = await fetchCharactersByName(enemy.name);
		if (characterData) {
			enemy.imageUrl = characterData.image.url;
		}
	}

	return levelEnemies;
};

export const enemiesInLevel = async () => {
	const currentSelection = charactersSelect?.value || loadFromStorage("characterType") || "heroes";

	const enemiesToUse = currentSelection === "heroes" ? levelEnemies.heroes : levelEnemies.villains;

	levels.forEach((level) => {
		level.innerHTML = "";

		const levelNumber = parseInt(level.dataset.level);

		const enemy = enemiesToUse.find((enemy) => enemy.level === levelNumber);

		if (enemy?.imageUrl) {
			const imgEnemie = document.createElement("img");
			imgEnemie.src = enemy.imageUrl;
			imgEnemie.alt = enemy.name;
			imgEnemie.classList.add("enemy-character");

			level.appendChild(imgEnemie);
		}
	});
};

export const showFirstLevel = () => {
	for (let i = 0; i < levels.length; i++) {
		if (levels[i].dataset.level === "1") {
			levels[i].classList.remove("locked");
			levels[i].classList.add("unlocked");
			break;
		}
	}
	saveToStorage("levelOneUnlocked", true);
};

export const showLeveleInfo = () => {
	const getCurrentEnemies = () => {
		const charactersSelect = document.getElementById("characters-selector");
		const currentSelection = charactersSelect.value;
		return currentSelection === "heroes" ? levelEnemies.heroes : levelEnemies.villains;
	};

	const handleLevelClick = async (level, enemies) => {
		const levelNumber = parseInt(level.dataset.level);
		const enemy = enemies.find((enemy) => enemy.level === levelNumber);

		if (!enemy) return;

		await movePlayerToLevel(level);
		await showBattleBriefing(enemy);
	};

	const showBattleBriefing = async (enemy) => {
		console.log("[3] Briefing - Enemigo recibido:", enemy.name);
		return new Promise((resolve) => {
			showBriefing(
				`Level: ${enemy.level}. ${enemy.name}`,
				`${enemy.description}<br>Powers: ${enemy.powers}<br>Reward: ${enemy.reward}`,
				{
					after: {
						text: "Start Battle",
						action: async () => {
							await startBattleFlow(enemy);
							resolve();
						},
					},
				}
			);
		});
	};

	const startBattleFlow = async (enemy) => {
		hideModal();
		mapScreen.style.display = "none";
		battleScreen.style.display = "flex";

		clearStorageKey("battleState");
		saveToStorage("forceBattleReset", false);

		saveToStorage("currentScreen", "battle");
		console.log("[4] StartBattle - Enemigo:", enemy.name);
		await renderBattleCards(enemy.name);
		saveToStorage("currentLevel", enemy.level);
	};

	levels.forEach((level) => {
		level.replaceWith(level.cloneNode(true));
	});

	const enemies = getCurrentEnemies();

	document.querySelectorAll(".level.unlocked").forEach((level) => {
		if (level.querySelector("img")) {
			level.addEventListener("click", () => handleLevelClick(level, enemies));
		}
	});
};

//Absolutamente no se como coño va esto de las coordenadas me gustaria una clase rapida:)
export const movePlayerToLevel = (targetLevel) => {
	return new Promise((resolve) => {
		const player = document.getElementById("player");
		const targetRect = targetLevel.getBoundingClientRect();
		const mapRect = map.getBoundingClientRect();
		const playerRect = player.getBoundingClientRect();

		// Calcular la posición relativa dentro del mapa
		const targetX = targetRect.left - mapRect.left + targetRect.width / 2 - playerRect.width / 2;
		const targetY = targetRect.top - mapRect.top + targetRect.height / 2 - playerRect.height / 2;

		saveToStorage("playerPosition", { x: targetX, y: targetY, level: targetLevel.dataset.level });

		// Guardar posición inicial para la transición
		const initialX = playerRect.left - mapRect.left;
		const initialY = playerRect.top - mapRect.top;

		// Calcular el desplazamiento necesario
		const offsetX = targetX - initialX;
		const offsetY = targetY - initialY;

		// Aplicar la transformación
		player.style.transition = "transform 0.5s ease-out";
		player.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

		// Actualizar la posición absoluta después de la animación
		player.addEventListener(
			"transitionend",
			function onTransitionEnd() {
				player.removeEventListener("transitionend", onTransitionEnd);

				// Establecer posición absoluta y quitar transformación
				player.style.transition = "none";
				player.style.transform = "none";
				player.style.left = `${targetX}px`;
				player.style.top = `${targetY}px`;

				resolve();
			},
			{ once: true }
		);
	});
};

// Función para cargar posición guardada
export const loadPlayerPosition = () => {
	const savedPosition = loadFromStorage("playerPosition");
	const player = document.getElementById("player");

	if (savedPosition) {
		player.style.left = `${savedPosition.x}px`;
		player.style.top = `${savedPosition.y}px`;
		player.style.transform = "none";

		// Marcar nivel como visitado
		const level = document.querySelector(`.level[data-level="${savedPosition.level}"]`);
		if (level) {
			level.classList.remove("locked");
			level.classList.add("unlocked");
		}
		showLeveleInfo();
	}
};

export const resetPlayerPosition = () => {
	const player = document.getElementById("player");

	// Restablecer estilos a la posición inicial
	player.style.transition = "none"; // Desactivar transición para cambio instantáneo
	player.style.left = "50%";
	player.style.top = "1%";
	player.style.transform = "translateX(-50%)";

	// Forzar reflow para asegurar que los cambios se aplican
	void player.offsetHeight;

	// Restaurar transición para futuros movimientos
	player.style.transition = "transform 0.5s ease-out";
};
