import { checkFormValidity, imgPlayer, navbar } from "./index.js";
import { enemiesInLevel } from "./map.js";
import { loadFromStorage, saveToStorage } from "./storage.js";

export const heroes = ["Black Widow", "Spider-Man", "Iron Man", "Captain America", "Thor", "Hulk"];

export const villains = ["Thanos", "Loki", "Ultron", "Red Skull", "Hela", "Doctor Doom"];

const apiKey = "eabf24a441ea28d7278fbc8d0be33589";

/* ==== Fetch Characters ==== */
export const fetchCharactersByName = async (name) => {
	try {
		const response = await fetch(`https://superheroapi.com/api.php/${apiKey}/search/${name}`);
		const data = await response.json();

		if (name === "Thor" && data.results.length > 1) {
			return data.results[1];
		}

		return data.results[0];
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
				checkFormValidity();
			}
		}
	} else {
		clearStorageKey("selectedCharacter");
		checkFormValidity();
	}
};
