import { handleCharacterSelection, heroes, renderCharacters, villains } from "./character.js";
import { loadFromStorage, saveToStorage } from "./storage.js";
import { hideModal, modalBackdrop, modalCloseBtn, showModal } from "./utils.js";

const inputUserName = document.getElementById("username");
const charactersSelect = document.getElementById("characters-selector");
const startGameBtn = document.getElementById("start-game-btn");
const loginScreen = document.getElementById("login-screen");
const mapScreen = document.getElementById("map-screen");
export const navbar = document.getElementById("navbar");
let namePlayer = document.getElementById("name-player");
export let imgPlayer = document.getElementById("img-player");

//Btn Start Game disability till fill name and select character
export const checkFormValidity = () => {
	const name = inputUserName.value.trim();
	const selectedCard = document.querySelector(".character-card.selected-card");

	startGameBtn.disabled = !(name && selectedCard);
};

const setupEventListeners = () => {
	inputUserName.addEventListener("input", () => {
		const userName = inputUserName.value.trim();
		saveToStorage("userName", userName);
		checkFormValidity();
	});

	document.addEventListener("click", (e) => {
		const card = e.target.closest(".character-card");
		if (!card) return;

		document.querySelectorAll(".character-card.selected-card").forEach((c) => {
			c.classList.remove("selected-card");
		});

		card.classList.add("selected-card");
		saveToStorage("selectedCharacter", card.dataset.id);
		checkFormValidity();
	});

	charactersSelect.addEventListener("change", handleCharacterSelection);

	startGameBtn.addEventListener("click", (e) => {
		if (startGameBtn.disabled) {
			e.preventDefault();
			showModal("Por favor, introduce un nombre de usuario y selecciona un personaje");
			return;
		}

		loginScreen.style.display = "none";
		mapScreen.style.display = "block";
		navbar.style.display = "flex";

		const selectedCard = document.querySelector(".character-card.selected-card");
		if (selectedCard) {
			const imgElement = selectedCard.querySelector("img");
			saveToStorage("playerImg", imgElement.src);
		}

		saveToStorage("gameStarted", true);
		saveToStorage("playerName", inputUserName.value);

		namePlayer.textContent = inputUserName.value;
		if (selectedCard) {
			imgPlayer.src = selectedCard.querySelector("img").src;
		}
	});

	modalCloseBtn.addEventListener("click", hideModal);

	modalBackdrop.addEventListener("click", (e) => {
		if (e.target === modalBackdrop) {
			hideModal();
		}
	});

	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape" && modalBackdrop.style.display === "flex") {
			hideModal();
		}
	});
};

document.addEventListener("DOMContentLoaded", async () => {
	setupEventListeners();

	const savedUserName = loadFromStorage("userName") || "";
	inputUserName.value = savedUserName;

	const savedCharacterType = loadFromStorage("characterType") || "heroes";
	charactersSelect.value = savedCharacterType;

	await new Promise((resolve) => {
		charactersSelect.addEventListener("change", resolve, { once: true });
		charactersSelect.dispatchEvent(new Event("change"));
	});

	const savedCharacterId = loadFromStorage("selectedCharacter");
	if (savedCharacterId) {
		const selectedCard = document.querySelector(`.character-card[data-id="${savedCharacterId}"]`);
		if (selectedCard) {
			selectedCard.classList.add("selected-card");
			checkFormValidity();
		}
	}

	const gameStarted = loadFromStorage("gameStarted");

	if (gameStarted) {
		loginScreen.style.display = "none";
		mapScreen.style.display = "block";
		navbar.style.display = "flex";

		const savedPlayerName = loadFromStorage("playerName");
		const savedPlayerImg = loadFromStorage("playerImg");

		if(savedPlayerName) namePlayer.textContent = savedPlayerName;
		if (savedPlayerImg) imgPlayer.src = savedPlayerImg;
	} else {
		loginScreen.style.display = "flex";
		mapScreen.style.display = "none";
	}
});
