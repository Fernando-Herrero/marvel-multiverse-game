import { playMusicForScreen } from "./audio.js";
import { renderBattleCards } from "./battle.js";
import { fetchCharactersByName } from "./character.js";
import { mapScreen } from "./index.js";
import { charactersSelect } from "./login.js";
import { clearStorageKey, loadFromStorage, saveToStorage } from "./storage.js";
import { hideModal, showBriefing, showModal } from "./utils.js";

export const levelEnemies = {
	heroes: [
		{
			name: "Loki",
			imageUrl: "",
			level: 1,
			description: "Dios de las Mentiras - Nueva York",
			powers: "Ilusiones, Dagas Mágicas",
			reward: "/media/images/icons/time-stone.webp",
		},
		{
			name: "Red Skull",
			imageUrl: "",
			level: 2,
			description: "Cráneo Rojo - Europa 1945",
			powers: "Fuerza Mejorada, Pistolas de Energía",
			reward: "/media/images/icons/space-stone.webp",
		},
		{
			name: "Ultron",
			imageUrl: "",
			level: 3,
			description: "IA Despiadada - Sokovia",
			powers: "Ejército de Drones, Vuelo",
			reward: "/media/images/icons/mind-stone.webp",
		},
		{
			name: "Hela",
			imageUrl: "",
			level: 4,
			description: "Diosa de la Muerte - Asgard",
			powers: "Espadas Infinitas, Inmortalidad",
			reward: "/media/images/icons/soul-stone.webp",
		},
		{
			name: "Thanos",
			imageUrl: "",
			level: 5,
			description: "El Titán Loco - Titán",
			powers: "Fuerza Cósmica, Guantelete",
			reward: "/media/images/icons/power-stone.webp",
		},
		{
			name: "Doctor Doom",
			imageUrl: "",
			level: 6,
			description: "Señor de Latveria - Dimensión Oscura",
			powers: "Magia y Tecnología, Armadura",
			reward: "/media/images/icons/reality-stone.webp",
		},
	],
	villains: [
		{
			name: "Black Widow",
			imageUrl: "",
			level: 1,
			description: "Espía Letal - Budapest",
			powers: "Combate cuerpo a cuerpo, Sigilo",
			reward: "/media/images/icons/space-stone.webp",
		},
		{
			name: "Spider-Man",
			imageUrl: "",
			level: 2,
			description: "El Hombre Araña - Queens",
			powers: "Sentido arácnido, Telarañas",
			reward: "/media/images/icons/power-stone.webp",
		},
		{
			name: "Iron Man",
			imageUrl: "",
			level: 3,
			description: "Genio, Millonario - Torre Stark",
			powers: "Armadura MK-50, IA Friday",
			reward: "/media/images/icons/mind-stone.webp",
		},
		{
			name: "Captain America",
			imageUrl: "",
			level: 4,
			description: "El Primer Vengador - Washington",
			powers: "Escudo de Vibranium, Liderazgo",
			reward: "/media/images/icons/reality-stone.webp",
		},
		{
			name: "Thor",
			imageUrl: "",
			level: 5,
			description: "Dios del Trueno - Asgard",
			powers: "Mjolnir, Control del Clima",
			reward: "/media/images/icons/soul-stone.webp",
		},
		{
			name: "Hulk",
			imageUrl: "",
			level: 6,
			description: "Furia Imparable - Laboratorio Gamma",
			powers: "Fuerza Bruta, Regeneración",
			reward: "/media/images/icons/time-stone.webp",
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
	const levelOne = document.querySelector(`.level[data-level="1"]`);
	if (levelOne) {
		levelOne.classList.remove("locked");
		levelOne.classList.add("unlocked");

		saveToStorage("levelOneUnlocked", true);
	}
};

let levelClickListenerAdded = false;

export const showLevelInfo = () => {
	if (levelClickListenerAdded) return; // ✅ Previene múltiples bindings
	levelClickListenerAdded = true;

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
		await playMusicForScreen("battle");
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

	mapScreen.addEventListener("click", (event) => {
		const level = event.target.closest(".level");
		if (!level) return;

		const enemies = getCurrentEnemies();

		if (level.classList.contains("unlocked")) {
			console.log("Clicked unlocked level:", level.dataset.level);
			handleLevelClick(level, enemies);
		} else if (level.classList.contains("locked")) {
			console.log("Clicked locked level:", level.dataset.level);
			showModal("Level Locked! You must complete previous levels before unlocking this one!", {
				confirmText: "OK",
			});
		}
	});
	// const unlockedLevels = document.querySelectorAll(".level.unlocked");
	// unlockedLevels.forEach((level) => {
	// 	level.addEventListener("click", async (event) => {
	// 		event.stopPropagation();
	// 		console.log("Clicked unlocked level:", level.dataset.level, level.className);
	// 		await handleLevelClick(level, enemies);
	// 	});
	// });

	// const lockedLevels = document.querySelectorAll(".level.locked");
	// lockedLevels.forEach((level) => {
	// 	level.addEventListener("click", (event) => {
	// 		event.stopPropagation();
	// 		console.log("Clicked locked level:", level.dataset.level, level.className);
	// 		showModal("Level Locked! You must complete previous levels before unlocking this one!", {
	// 			confirmText: "OK",
	// 		});
	// 	});
	// });
};

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
		saveToStorage("currentLevel", targetLevel.dataset.level);

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
				player.style.transition = "none";
				player.style.transform = "none";
				player.style.left = `${targetX}px`;
				player.style.top = `${targetY}px`;

				// Volver a asignar eventos después de mover
				showLevelInfo();
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
		// Asegurar que el jugador esté visible
		player.style.display = "block";

		// Calcular posición relativa al mapa
		const mapRect = map.getBoundingClientRect();
		const playerWidth = player.offsetWidth;
		const playerHeight = player.offsetHeight;

		// Aplicar posición
		player.style.left = `${savedPosition.x}px`;
		player.style.top = `${savedPosition.y}px`;
		player.style.transform = "none";

		// Verificar que la posición es visible
		setTimeout(() => {
			const playerRect = player.getBoundingClientRect();
			if (playerRect.right > mapRect.right || playerRect.bottom > mapRect.bottom) {
				// Si está fuera de vista, ajustar posición
				player.style.left = "50%";
				player.style.top = "1%";
				player.style.transform = "translateX(-50%)";
			}
		}, 100);
	} else {
		// Posición por defecto
		player.style.left = "50%";
		player.style.top = "1%";
		player.style.transform = "translateX(-50%)";
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
