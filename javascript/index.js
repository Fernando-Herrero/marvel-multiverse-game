import { renderBattleCards, resetHealthBars } from "./battle.js";
import { handleCharacterSelection } from "./character.js";
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
import {
	battleScreen,
	enemiesInLevel,
	imageEnemies,
	levels,
	loadPlayerPosition,
	movePlayerToLevel,
	resetPlayerPosition,
	showFirstLevel,
	showLeveleInfo,
} from "./map.js";
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
		"battleState",
		"currentLevel",
		"playerCharacter",
		"currentEnemy",
		"mainBriefing",
		"characterType",
	];

	clearKeys.forEach((key) => clearStorageKey(key));
	resetPlayerPosition();
	resetHealthBars();

	const levels = [1, 2, 3, 4, 5, 6];
	for (let i = 0; i < levels.length; i++) {
		clearStorageKey(`level${levels[i]}Unlocked`);
	}

	document.querySelectorAll(".level").forEach((levelElement) => {
		const level = parseInt(levelElement.dataset.level);
		if (level > 1) {
			levelElement.classList.add("locked");
			levelElement.classList.remove("unlocked");
		}
	});

	let id = window.setTimeout(() => {}, 0);
	while (id--) {
		window.clearTimeout(id);
	}
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

			document.querySelectorAll(".battle-button").forEach((btn) => {
				btn.disabled = false;
			});

			document.getElementById("rewards").innerHTML = "";

			showModal("You've succesfully logout.", {
				confirmText: "Accept",
				isConfirmation: false,
			});

			modalAcceptBtn.onclick = () => {
				hideModal();
				// window.location.reload
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
			resetGameState();
			saveToStorage("forceBattleReset", true);
			resetPlayerPosition();
			resetHealthBars();

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

			document.querySelectorAll(".battle-button").forEach((btn) => {
				btn.disabled = false;
			});

			document.getElementById("rewards").innerHTML = "";

			saveToStorage("forceBattleReset", true);

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

const loadGameState = async (currentScreen) => {
	switch (currentScreen) {
		case "map":
			await loadMapState();
			const currentLevel = loadFromStorage("currentLevel") || 1;
			const levelElement = document.querySelector(`.level[data-level="${currentLevel}"]`);

			if (levelElement && levelElement.getBoundingClientRect) {
				await movePlayerToLevel(levelElement);
			} else {
				console.log("Nivel actual no encontrado, posicionando en nivel 1");
				const firstLevel = document.querySelector('.level[data-level="1"]');
				if (firstLevel) await movePlayerToLevel(firstLevel);
			}
			break;
		case "battle":
			await loadbattleState();
			break;
	}
};

export const loadMapState = async () => {
	const levelOneUnlocked = loadFromStorage("levelOneUnlocked");

	if (levelOneUnlocked) {
		for (let i = 0; i < levels.length; i++) {
			if (levels[i].dataset.level === "1") {
				levels[i].classList.remove("locked");
				levels[i].classList.add("unlocked");
				break;
			}
		}
		showFirstLevel();
	}

	await enemiesInLevel();
	loadPlayerPosition();

	navbar.style.display = "flex";
	mapScreen.style.display = "flex";
	showLeveleInfo();
};

const loadbattleState = async () => {
	navbar.style.display = "flex";
	battleScreen.style.display = "flex";

	const battleState = loadFromStorage("battleState");
	if (battleState?.enemy) {
		await renderBattleCards(battleState.enemy.character.name);
	} else {
		saveToStorage("currentScreen", "map");
		mapScreen.style.display = "flex";
		battleScreen.style.display = "none";
	}
};

const setupPlayerState = () => {
	const savedUserName = loadFromStorage("userName") || "";
	inputUserName.value = savedUserName;

	const savedPlayerImg = loadFromStorage("playerImg");
	if (savedPlayerImg) {
		imgPlayer.src = savedPlayerImg;
	}

	const savedCharacter = loadFromStorage("playerCharacter");
	if (savedCharacter) {
		infoHeroContainer.appendChild(renderCardInfohero(savedCharacter));
	}
};

const setupCharacterSelection = async () => {
	const savedCharacterType = loadFromStorage("characterType") || "heroes";
	charactersSelect.value = savedCharacterType;

	await handleCharacterSelection();

	await new Promise((resolve) => {
		charactersSelect.addEventListener(
			"change",
			async () => {
				await handleCharacterSelection();
				resolve();
			},
			{ once: true }
		);
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
};

const showInitialBriefing = () => {
	if (loadFromStorage("currentScreen") !== "map" || !loadFromStorage("gameStarted")) return;

	const mainBriefing = loadFromStorage("mainBriefing");
	if (!mainBriefing?.briefingShow || mainBriefing.briefingCompleted) return;

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
};

document.addEventListener("DOMContentLoaded", async () => {
	try {
		[loginScreen, mapScreen, battleScreen, aside, title, navbar].forEach((el) => {
			el.style.display = "none";
		});

		const currentScreen = loadFromStorage("currentScreen") || "login";
		const gameStarted = loadFromStorage("gameStarted");

		await imageEnemies();

		if (currentScreen && gameStarted) {
			await loadGameState(currentScreen);
		} else {
			loginScreen.style.display = "flex";
			title.style.display = "flex";
		}

		setupPlayerState();
		await setupCharacterSelection();
		setupEventListeners();

		if (currentScreen === "map") {
			showInitialBriefing();
		}
	} catch (error) {
		console.error("Initialization error:", error);
		loginScreen.style.display = "flex";
		title.style.display = "flex";
	}
});
