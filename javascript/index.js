import { handleCharacterSelection, heroes, renderCharacters, villains } from "./character.js";
import { loadFromStorage, saveToStorage } from "./storage.js";

const inputUserName = document.getElementById("username");

const setupEventListeners = () => {
	inputUserName.addEventListener("input", () => {
		const userName = inputUserName.value;
		saveToStorage("userName", userName);
	});

	const charactersSelect = document.getElementById("characters-selector");
	charactersSelect.addEventListener("change", handleCharacterSelection);
};

document.addEventListener("DOMContentLoaded", () => {
	setupEventListeners();

	const savedUserName = loadFromStorage("userName");
	if (savedUserName) {
		inputUserName.value = savedUserName;
	}

	const charactersSelect = document.getElementById("characters-selector");
	const savedCharacterType = loadFromStorage("characterType") || "heroes";
	charactersSelect.value = savedCharacterType;

	charactersSelect.dispatchEvent(new Event("change"));
});
