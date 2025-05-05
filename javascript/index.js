import { renderBattleCards } from "./battle.js";
import {
	aside,
	charactersSelect,
	checkValidStartGame,
	imgPlayer,
	infoHeroContainer,
	inputUserName,
	renderCardInfohero,
	setupGameListeners,
	setupLoginListeners,
} from "./login.js";
import { battleScreen, enemiesInLevel, levels, loadPlayerPosition, resetPlayerPosition } from "./map.js";
import { loadFromStorage, saveToStorage, clearStorageKey } from "./storage.js";
import { hideModal, modalAcceptBtn, modalCloseBtn, showBriefing, showModal } from "./utils.js";

export const loginScreen = document.getElementById("login-screen");
export const mapScreen = document.getElementById("map-screen");
export const navbar = document.getElementById("navbar");
export const settingsIcon = document.getElementById("navbar-settings");

export const volumeIcon = document.getElementById("volume-icon");
export const volumeSlider = document.getElementById("volume-slider");
export const logout = document.getElementById("close-session");
export const reset = document.getElementById("reset");
export const title = document.getElementById("h1");

const setupUiListeners = () => {
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
};

const resetGameState = () => {
	const clearKeys = [
		"userName",
		"selectedCharacter",
		"gameStarted",
		"playerPosition",
		"currentScreen",
		"batttleState",
		"currentLevel",
		"playerCharacter",
	];

	clearKeys.forEach((key) => clearStorageKey(key));
	resetPlayerPosition();
};

const setupEventListeners = () => {
	setupLoginListeners();
	setupGameListeners();
	setupUiListeners();

	logout.addEventListener("click", () => {
		aside.classList.remove("show");

		showModal("Are you sure you want to log out?", {
			isConfirmation: true,
			confirmText: "Accept",
			cancelText: "Cancel",
		});
		modalAcceptBtn.onclick = () => {
			resetGameState();

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
				isConfirmation: false,
			});

			modalAcceptBtn.onclick = () => {
				hideModal();
			};
		};

		modalCloseBtn.onclick = () => {
			hideModal();
		};
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

		modalCloseBtn.onclick = () => {
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
	loginScreen.style.display = "flex";
	title.style.display = "flex";
	navbar.style.display = "none";
	mapScreen.style.display = "none";
	battleScreen.style.display = "none";
	aside.style.display = "none";

	const currentScreen = loadFromStorage("currentScreen") || "login";
	const gameStarted = loadFromStorage("gameStarted");
	const levelOneUnlocked = loadFromStorage("levelOneUnlocked");

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

	const savedPlayerImg = loadFromStorage("playerImg");
	if (savedPlayerImg) {
		imgPlayer.src = savedPlayerImg;
	}

	const savedCharacter = loadFromStorage("playerCharacter");
	if (savedCharacter) {
		infoHeroContainer.appendChild(renderCardInfohero(savedCharacter));
	}

	loadPlayerPosition();
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
			checkValidStartGame();
		}
	}

	if (currentScreen === "map" && gameStarted) {
		const mainBriefing = loadFromStorage("mainBriefing");
		if (mainBriefing && mainBriefing.briefingShow && !mainBriefing.briefingCompleted) {
			const currentSelectedValue = charactersSelect.value;
			showBriefing(
				`Welcome ${inputUserName.value} to the Multiverse Challenge`,
				`As Earth's ${
					currentSelectedValue === "heroes" ? "newest protector" : "most feared conqueror"
				}, you must face 6 formidable opponents across fractured realities.\n\n` +
					`Each victory brings you closer to controlling the Nexus of All Realities.\n` +
					`Choose wisely - your ${
						currentSelectedValue === "heroes" ? "heroic actions" : "villainous schemes"
					} will echo through eternity.`,
				{
					after: {
						text: "Enter the Multiverse",
						action: () => {
							hideModal();
							saveToStorage("mainBriefing", { ...mainBriefing, briefingCompleted: true });
						},
					},
				}
			);
		}
	}
});
