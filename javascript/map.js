import { fetchCharactersByName } from "./character.js";
import { selectedValue } from "./utils.js";

export const levelEnemies = {
	heroes: [
		{
			name: "Loki",
			imageUrl: "",
			level: 1,
			description: "Dios de las Mentiras - Nivel 1: Nueva York",
			powers: "Ilusiones, Dagas Mágicas",
			reward: "Gema del Espacio",
		},
		{
			name: "Red Skull",
			imageUrl: "",
			level: 2,
			description: "Cráneo Rojo - Nivel 2: Europa 1945",
			powers: "Fuerza Mejorada, Pistolas de Energía",
			reward: "Gema de la Mente",
		},
		{
			name: "Ultron",
			imageUrl: "",
			level: 3,
			description: "IA Despiadada - Nivel 3: Sokovia",
			powers: "Ejército de Drones, Vuelo",
			reward: "Gema del Alma",
		},
		{
			name: "Hela",
			imageUrl: "",
			level: 4,
			description: "Diosa de la Muerte - Nivel 4: Asgard",
			powers: "Espadas Infinitas, Inmortalidad",
			reward: "Gema del Poder",
		},
		{
			name: "Thanos",
			imageUrl: "",
			level: 5,
			description: "El Titán Loco - Nivel 5: Titán",
			powers: "Fuerza Cósmica, Guantelete",
			reward: "Gema de la Realidad",
		},
		{
			name: "Doctor Doom",
			imageUrl: "",
			level: 6,
			description: "Señor de Latveria - Nivel 6: Dimensión Oscura",
			powers: "Magia y Tecnología, Armadura",
			reward: "Gema del Tiempo",
		},
	],
	villains: [
		{
			name: "Black Widow",
			imageUrl: "",
			level: 1,
			description: "Espía Letal - Nivel 1: Budapest",
			powers: "Combate cuerpo a cuerpo, Sigilo",
			reward: "Información secreta obtenida",
		},
		{
			name: "Spider-Man",
			imageUrl: "",
			level: 2,
			description: "El Hombre Araña - Nivel 2: Queens",
			powers: "Sentido arácnido, Telarañas",
			reward: "Tecnología de Stark hackeada",
		},
		{
			name: "Iron Man",
			imageUrl: "",
			level: 3,
			description: "Genio, Millonario - Nivel 3: Torre Stark",
			powers: "Armadura MK-50, IA Friday",
			reward: "Armadura dañada robada",
		},
		{
			name: "Captain America",
			imageUrl: "",
			level: 4,
			description: "El Primer Vengador - Nivel 4: Washington",
			powers: "Escudo de Vibranium, Liderazgo",
			reward: "Escudo copiado para experimentos",
		},
		{
			name: "Thor",
			imageUrl: "",
			level: 5,
			description: "Dios del Trueno - Nivel 5: Asgard",
			powers: "Mjolnir, Control del Clima",
			reward: "Energía del rayo condensada",
		},
		{
			name: "Hulk",
			imageUrl: "",
			level: 6,
			description: "Furia Imparable - Nivel 6: Laboratorio Gamma",
			powers: "Fuerza Bruta, Regeneración",
			reward: "ADN Gamma mutado",
		},
	],
};

const levels = document.querySelectorAll(".level");

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

	const enemiesToUse = selectedValue === "heroes" ? levelEnemies.villains : levelEnemies.heroes;

	levels.forEach((level) => {
		const levelNumber = parseInt(level.dataset.level);

		const enemiesForThisLevel = enemiesToUse.find((enemy) => enemy.level === levelNumber);

		if (enemiesForThisLevel && enemiesForThisLevel.imageUrl) {
			const imgEnemie = document.createElement("img");
			imgEnemie.src = enemiesForThisLevel.imageUrl;
			imgEnemie.alt = enemiesForThisLevel.name;
			imgEnemie.classList.add("enemy-character");

			level.appendChild(imgEnemie);
		}

		// if (levelNumber < currentLevel) {
		// 	level.classList.add("unlocked");
		// } else if (levelNumber === currentLevel) {
		// 	level.classList.add("level-current");
		// } else {
		// 	level.classList.add("locked");
		// }
	});
};
