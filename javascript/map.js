import { fetchCharactersByName } from "./character.js";
import { mapScreen } from "./index.js";
import { loadFromStorage, saveToStorage } from "./storage.js";
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
	await imageEnemies();

	const charactersSelect = document.getElementById("characters-selector");
	const currentSelection = charactersSelect.value;
	const enemiesToUse = currentSelection === "heroes" ? levelEnemies.heroes : levelEnemies.villains;

	levels.forEach((level) => {
		level.innerHTML = "";

		const levelNumber = parseInt(level.dataset.level);

		const enemiesForThisLevel = enemiesToUse.find((enemy) => enemy.level === levelNumber);

		if (enemiesForThisLevel && enemiesForThisLevel.imageUrl) {
			const imgEnemie = document.createElement("img");
			imgEnemie.src = enemiesForThisLevel.imageUrl;
			imgEnemie.alt = enemiesForThisLevel.name;
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
	const charactersSelect = document.getElementById("characters-selector");
	const currentSelection = charactersSelect.value;
	const enemiesToUse = currentSelection === "heroes" ? levelEnemies.heroes : levelEnemies.villains;

	levels.forEach((level) => {
		if (level.classList.contains("unlocked")) {
			level.addEventListener("click", () => {
				const levelNumber = parseInt(level.dataset.level);
				const enemy = enemiesToUse.find((enemy) => enemy.level === levelNumber);

				if (enemy) {
					showBriefing(
						`Level: ${enemy.level}. ${enemy.name}`,
						`${enemy.description}<br>Powers: ${enemy.powers}<br>Reward: ${enemy.reward}`,
						{
							after: {
								text: "Start Battle",
								action: () => {
									hideModal();
								},
							},
						}
					);
				}
			});
		}
	});
};
