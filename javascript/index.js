import { handleCharacterSelection, heroes, renderCharacters, villains } from "./character.js";

const setupEventListeners = () => {
	const charactersSelect = document.getElementById("characters-selector");
	charactersSelect.addEventListener("change", handleCharacterSelection);
};

document.addEventListener("DOMContentLoaded", () => {
	setupEventListeners();
	renderCharacters(heroes);
});