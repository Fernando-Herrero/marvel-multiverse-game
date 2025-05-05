import { navbar } from "./index.js";
import { checkValidStartGame, imgPlayer } from "./login.js";
import { enemiesInLevel } from "./map.js";
import { loadFromStorage, saveToStorage } from "./storage.js";

export const heroes = ["Black Widow", "Spider-Man", "Iron Man", "Captain America", "Thor", "Hulk"];
export const villains = ["Thanos", "Loki", "Ultron", "Red Skull", "Hela", "Doctor Doom"];

const localCharacterImage = {
	"Black Widow": "/media/images/characters/black-widow.jpeg",
	"Spider-Man": "/media/images/characters/spider-man.webp",
	"Iron Man": "/media/images/characters/iron-man.avif",
	"Captain America": "/media/images/characters/captain-america.webp",
	Thor: "/media/images/characters/thor.webp",
	Hulk: "/media/images/characters/hulk.avif",

	Thanos: "/media/images/characters/thanos.webp",
	Loki: "/media/images/characters/loki.webp",
	Ultron: "/media/images/characters/ultron.jpeg",
	"Red Skull": "/media/images/characters/red-skull.webp",
	Hela: "/media/images/characters/hela.webp",
	"Doctor Doom": "/media/images/characters/doctor-doom.jpeg",
};

const apiKey = "eabf24a441ea28d7278fbc8d0be33589";

const testImage = (url) => {
	return new Promise((resolve) => {
		if (!url) {
			resolve(false);
			return;
		}

		const img = new Image();
		img.onload = () => resolve(true);
		img.onerror = () => resolve(false);
		img.src = url;

		setTimeout(() => resolve(false), 2000);
	});
};

const MAX_RETRIES = 3;

/* ==== Fetch Characters ==== */
export const fetchCharactersByName = async (name) => {
	try {
		const response = await fetch(`https://superheroapi.com/api.php/${apiKey}/search/${name}`);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();

		if (!data.results || data.results.length === 0) {
			throw new Error("Character not found in API");
		}

		const character = name === "Thor" && data.results.length > 1 ? data.results[1] : data.results[0];

		const imgValid = await testImage(character.image?.url);
		if (!imgValid) {
			const localImageValid = await testImage(localCharacterImage[name]);
			character.image.url = localImageValid
				? localCharacterImage[name]
				: "/media/images/backgrounds/img-back.jpg";

			const finalCheck = await testImage(character.image.url);
			if (!finalCheck) {
				console.error(`All image sources failed for ${name}`);
				character.image.url = "/media/images/backgrounds/img-back.jpg";
			}
		}

		return character;
	} catch (error) {
		console.error(`Error al obtener datos del personaje ${name}:`, error);
	}
};

/* ==== Card Characters ==== */
export const createCharacterCard = (character, type) => {
	const card = document.createElement("div");
	card.classList.add("character-card", `${type}-border`);
	card.dataset.id = character.id;

	const imgCard = document.createElement("img");
	imgCard.src = character.image.url;
	imgCard.alt = character.name;

	let retryCount = 0;

	imgCard.onerror = async () => {
		retryCount++;

		if (retryCount >= MAX_RETRIES) {
			console.warn(`Max retries reached for ${character.name}`);
			imgCard.src = "/media/images/backgrounds/img-back.jpg";
			imgCard.onerror = null;
			return;
		}

		const imgBack = await testImage(localCharacterImage[character.name]);
		if (imgBack) {
			imgCard.src = localCharacterImage[character.name];
		} else {
			imgCard.src = "/media/images/backgrounds/img-back.jpg";
			imgCard.onerror = null;
		}
	};

	const infoCharacter = document.createElement("div");
	infoCharacter.classList.add("card-info-character");

	const nameCharacter = document.createElement("h3");
	nameCharacter.textContent = character.name;

	const statsCharacter = document.createElement("div");
	statsCharacter.classList.add("character-stats");

	for (let stat in character.powerstats) {
		const statsP = document.createElement("p");
		statsP.textContent = `${stat.charAt(0).toUpperCase() + stat.slice(1)}: ${character.powerstats[stat]}`;
		statsCharacter.appendChild(statsP);
	}

	infoCharacter.appendChild(nameCharacter);
	infoCharacter.appendChild(statsCharacter);

	card.appendChild(imgCard);
	card.appendChild(infoCharacter);

	return card;
};

/* ==== Render Characters ==== */
export const renderCharacters = async (namesArray, type = "hero") => {
	const containerCharacters = document.getElementById("cards-player-container");
	containerCharacters.innerHTML = "";
	containerCharacters.classList.add("loading");

	for (const name of namesArray) {
		const character = await fetchCharactersByName(name);

		if (character) {
			const card = createCharacterCard(character, type);
			containerCharacters.appendChild(card);
		}
	}

	containerCharacters.classList.remove("loading");
};

/* ==== Select Characters ==== */
export const handleCharacterSelection = async (initialLoad = false) => {
	const charactersSelect = document.getElementById("characters-selector");
	const selectedValue = charactersSelect.value;

	saveToStorage("characterType", selectedValue);

	const containerCharacters = document.getElementById("cards-player-container");
	containerCharacters.innerHTML = "";

	if (selectedValue === "heroes") {
		await renderCharacters(heroes, "hero");
		navbar.style.background = "var(--hero-color)";
		imgPlayer.style.border = "2px solid var(--hero-color)";
	} else if (selectedValue === "villains") {
		await renderCharacters(villains, "villain");
		navbar.style.background = "var(--villain-color)";
		imgPlayer.style.border = "2px solid var(--villain-color)";
	}

	await enemiesInLevel();

	if (initialLoad) {
		const savedCharacterId = loadFromStorage("selectedCharacter");

		if (savedCharacterId) {
			const card = document.querySelector(`.character-card[data-id="${savedCharacterId}"]`);

			if (card) {
				card.classList.add("selected-card");
				checkValidStartGame();
			}
		}
	} else {
		clearStorageKey("selectedCharacter");
		checkFormValidity();
	}
};
