import { handleCharacterSelection, heroes, renderCharacters, villains } from "./character.js";
import { loadFromStorage } from "./storage.js";

const setupEventListeners = () => {
	const charactersSelect = document.getElementById("characters-selector");
	charactersSelect.addEventListener("change", handleCharacterSelection);
};

document.addEventListener("DOMContentLoaded", () => {
	setupEventListeners();

	const charactersSelect = document.getElementById("characters-selector");
	const savedCharacterType = loadFromStorage("characterType") || "heroes";
	charactersSelect.value = savedCharacterType;

	charactersSelect.dispatchEvent(new Event('change'));
});
