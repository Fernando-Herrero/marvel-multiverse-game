import { renderBattleCards } from "./battle.js";
import { handleCharacterSelection } from "./character.js";
import {
	battleScreen,
	enemiesInLevel,
	levels,
	loadPlayerPosition,
	resetPlayerPosition,
	showFirstLevel,
	showLeveleInfo,
} from "./map.js";
import { loadFromStorage, saveToStorage, clearStorageKey } from "./storage.js";
import { hideModal, modalAcceptBtn, modalBackdrop, modalCloseBtn, showBriefing, showModal } from "./utils.js";

const inputUserName = document.getElementById("username");
const charactersSelect = document.getElementById("characters-selector");
const startGameBtn = document.getElementById("start-game-btn");
const loginScreen = document.getElementById("login-screen");
export const mapScreen = document.getElementById("map-screen");
export const navbar = document.getElementById("navbar");
let namePlayer = document.getElementById("name-player");
export let imgPlayer = document.getElementById("img-player");
const settingsIcon = document.getElementById("navbar-settings");
const aside = document.getElementById("aside");
const infoHeroContainer = document.getElementById("info-hero");
const volumeIcon = document.getElementById("volume-icon");
const volumeSlider = document.getElementById("volume-slider");
const logout = document.getElementById("close-session");
const reset = document.getElementById("reset");
const title = document.getElementById("h1");
const selectedValue = charactersSelect.value;
// const levelsLocked = document.querySelectorAll(".level.locked");

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

		const selectedCard = document.querySelector(".character-card.selected-card");
		if (selectedCard) {
			const characterData = {
				id: selectedCard.dataset.id,
				name: selectedCard.querySelector("h3").textContent,
				imageUrl: selectedCard.querySelector("img").src,
				stats: Array.from(selectedCard.querySelectorAll(".character-stats p")).map((p) => p.textContent),
			};

			saveToStorage("playerCharacter", characterData);
		}

		loginScreen.style.display = "none";
		mapScreen.style.display = "flex";
		navbar.style.display = "flex";
		title.style.display = "none";

		showFirstLevel();

		namePlayer.textContent = inputUserName.value;
		const imgElement = selectedCard.querySelector("img");
		imgPlayer.src = imgElement.src;

		saveToStorage("gameStarted", true);
		saveToStorage("playerName", inputUserName.value);
		saveToStorage("playerImg", imgElement.src);

		const cardClone = selectedCard.cloneNode(true);
		infoHeroContainer.innerHTML = "";
		infoHeroContainer.appendChild(cardClone);

		showBriefing(
			`Welcome ${charactersSelect.value} to the Multiverse Challenge`,
			`As Earth's ${
				selectedValue === "heroes" ? "newest protector" : "most feared conqueror"
			}, you must face 6 formidable opponents across fractured realities.\n` +
				`Each victory brings you closer to controlling the Nexus of All Realities.\n` +
				`Choose wisely - your ${
					selectedValue === "heroes" ? "heroic actions" : "villainous schemes"
				} will echo through eternity.`,
			{
				after: {
					text: "Enter the Multiverse",
					action: () => hideModal(),
				},
			}
		);
		showLeveleInfo();

		saveToStorage("mainBriefing", {
			briefingShow: true,
			briefingCompleted: false,
			playerName: inputUserName.value,
			playerType: selectedValue,
		});
	});

	modalAcceptBtn.addEventListener("click", hideModal);

	modalBackdrop.addEventListener("click", (e) => {
		if (e.target === modalBackdrop) {
			hideModal();
		}
	});

	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape") {
			if (modalBackdrop.style.display === "flex") {
				hideModal();
			}
			if (aside.classList.contains("show")) {
				aside.classList.remove("show");
			}
		}
	});

	settingsIcon.addEventListener("click", () => {
		aside.classList.toggle("show");

		if (aside.classList.contains("show")) {
			const selectedCard = document.querySelector(".character-card.selected-card");
			if (selectedCard) {
				const cardClone = selectedCard.cloneNode(true);
				cardClone.classList.remove("selected-card");
				cardClone.style.pointerEvents = "none";
				infoHeroContainer.innerHTML = "";
				infoHeroContainer.appendChild(cardClone);
			}
		}
	});

	volumeIcon.addEventListener("click", () => {
		volumeSlider.classList.toggle("show-slider");
	});

	logout.addEventListener("click", () => {
		clearStorageKey("userName");
		clearStorageKey("selectedCharacter");
		clearStorageKey("gameStarted");
		clearStorageKey("playerPosition");
		clearStorageKey("currentScreen");

		resetPlayerPosition();

		saveToStorage("currentScreen", "login");

		loginScreen.style.display = "flex";
		mapScreen.classList.remove("active");
		mapScreen.style.display = "none";
		navbar.style.display = "none";
		title.style.display = "flex";
		aside.classList.remove("show");
		aside.style.display = "none";
		battleScreen.style.display = "none";

		inputUserName.value = " ";
		const selectedCard = document.querySelector(".character-card.selected-card");
		selectedCard?.classList.remove("selected-card");

		showModal("You've succesfully logout.", {
			confirmText: "Accept",
		});
	});

	reset.addEventListener("click", () => {
		aside.classList.remove("show");
		aside.style.display = "none";

		showModal("Are you sure you want to reset the game? You will lose all your progress", {
			isConfirmation: true,
			confirmText: "Yes, reset",
			cancelText: "Keep playing",
		});

		modalAcceptBtn.onclick = () => {
			localStorage.clear();
			resetPlayerPosition();

			mapScreen.style.display = "none";
			loginScreen.style.display = "flex";
			navbar.style.display = "none";
			title.style.display = "block";
			battleScreen.style.display = "none";

			inputUserName.value = "";
			charactersSelect.value = "" || "heroes";
			document.querySelectorAll(".character-card.selected-card").forEach((card) => {
				card.classList.remove("selected-card");
			});

			hideModal();
		};
	});

	levels.forEach((level) => {
		if (level.classList.contains("locked")) {
			level.addEventListener("click", () => {
				showBriefing("This Level is not available", "This level is still blocked", {
					after: {
						text: "Accept",
						action: () => hideModal(),
					},
				});
			});
		}
	});
};

document.addEventListener("DOMContentLoaded", async () => {
	loadPlayerPosition();

	const currentScreen = loadFromStorage("currentScreen") || "login";
	const gameStarted = loadFromStorage("gameStarted");
	const levelOneUnlocked = loadFromStorage("levelOneUnlocked");

	loginScreen.style.display = "flex";
	title.style.display = "flex";
	navbar.style.display = "none";
	mapScreen.style.display = "none";
	battleScreen.style.display = "none";
	aside.style.display = "none";

	if (currentScreen && gameStarted) {
		loginScreen.style.display = "none";
		title.style.display = "none";

		switch (currentScreen) {
			case "map":
				navbar.style.display = "flex";
				mapScreen.style.display = "flex";
				break;

			case "battle":
				navbar.style.display = "flex";
				battleScreen.style.display = "flex";

				const battleState = loadFromStorage("battleState");
				if (battleState?.enemy) {
					await renderBattleCards(battleState.enemy.name);
				} else {
					saveToStorage("currentScreen", "map");
					mapScreen.style.display = "flex";
					battleScreen.style.display = "none";
				}
				break;
		}
	}

	if (levelOneUnlocked) {
		for (let i = 0; i < levels.length; i++) {
			if (levels[i].dataset.level === "1") {
				levels[i].classList.remove("locked");
				levels[i].classList.add("unlocked");
				break;
			}
		}
	}

	setupEventListeners();
	enemiesInLevel();

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

	if (currentScreen === "map" && gameStarted) {
		const mainBriefing = loadFromStorage("mainBriefing");
		if (mainBriefing && mainBriefing.briefingShow && !mainBriefing.briefingCompleted) {
			showBriefing(
				`Welcome ${inputUserName.value} to the Multiverse Challenge`,
				`As Earth's ${
					selectedValue === "heroes" ? "newest protector" : "most feared conqueror"
				}, you must face 6 formidable opponents across fractured realities.\n\n` +
					`Each victory brings you closer to controlling the Nexus of All Realities.\n` +
					`Choose wisely - your ${
						selectedValue === "heroes" ? "heroic actions" : "villainous schemes"
					} will echo through eternity.`,
				{
					after: {
						text: "Enter the Multiverse",
						action: () => {
							hideModal();
							saveToStorage("mainBriefign", { ...mainBriefing, briefingCompleted: true });
						},
					},
				}
			);
		}
	}
});
