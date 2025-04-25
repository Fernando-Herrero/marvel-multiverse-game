import { handleCharacterSelection, heroes, renderCharacters, villains } from "./character.js";

const setupEventListeners = () => {
	const charactersSelect = document.getElementById("characters-selector").addEventListener("change", handleCharacterSelection)
};

document.addEventListener("DOMContentLoaded", () => {
	renderCharacters(heroes);
});