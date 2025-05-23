import { playMusicForScreen, stopMusic } from "./audio.js";
import { renderBattleCards, resetHealthBars } from "./battle.js";
import { handleCharacterSelection } from "./character.js";
import {
	aside,
	charactersSelect,
	checkValidStartGame,
	imgPlayer,
	infoHeroContainer,
	inputUserName,
	namePlayer,
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
	showLevelInfo,
} from "./map.js";
import { loadFromStorage, saveToStorage, clearStorageKey } from "./storage.js";
import { hideModal, modalAcceptBtn, modalCloseBtn, showBriefing, showModal } from "./utils.js";

export const loginScreen = document.getElementById("login-screen");
export const mapScreen = document.getElementById("map-screen");
export const navbar = document.getElementById("navbar");
export const settingsIcon = document.getElementById("navbar-settings");
export const logout = document.getElementById("close-session");
export const reset = document.getElementById("reset");
export const title = document.getElementById("h1");

const updateAsideVisibility = () => {
	const currentScreen = loadFromStorage("currentScreen");
	if ((currentScreen === "map" || currentScreen === "battle") && window.innerWidth >= 780) {
		aside.classList.add("show");
		settingsIcon.style.display = "none";
	} else {
		aside.classList.remove("show");
		settingsIcon.style.display = "flex";
	}
};

const updateBattleBackground = () => {
	const currentScreen = loadFromStorage("currentScreen");
	if (currentScreen === "battle" && window.innerWidth >= 1024) {
		const currentLevel = loadFromStorage("currentLevel");
		if (!currentLevel) return;

		const existingBg = battleScreen.querySelector(".background-battle-img");
		if (existingBg) existingBg.remove();

		const imgBg = document.createElement("img");
		imgBg.classList.add("background-battle-img");

		const levelImages = {
			1: "/media/images/backgrounds/backgroung-level-1.jpg",
			2: "/media/images/backgrounds/backgroung-level-2.jpg",
			3: "/media/images/backgrounds/backgroung-level-3.jpg",
			4: "/media/images/backgrounds/backgroung-level-4.avif",
			5: "/media/images/backgrounds/background-level-5.jpg",
			6: "/media/images/backgrounds/background-level-6.webp",
		};

		imgBg.src = levelImages[currentLevel];
		battleScreen.appendChild(imgBg);
	}
};

const setupUiListeners = () => {
	settingsIcon.addEventListener("click", () => {
		aside.classList.toggle("show");

		if (aside.classList.contains("show")) {
			const playerData = loadFromStorage("playerCharacter");
			if (playerData) {
				infoHeroContainer.innerHTML = "";
				infoHeroContainer.appendChild(renderCardInfohero(playerData));
			}
		}
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
			stopMusic();
			playMusicForScreen("login");
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
			const charSelector = document.getElementById("characters-selector");
			charSelector.value = "heroes";
			charSelector.dispatchEvent(new Event("change"));

			const selectedCard = document.querySelector(".character-card.selected-card");
			selectedCard?.classList.remove("selected-card");

			document.querySelectorAll(".battle-button").forEach((btn) => {
				btn.disabled = false;
			});

			document.getElementById("rewards").innerHTML = "";

			document.getElementById("difficulty").value = "1";

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
			stopMusic();
			playMusicForScreen("login");
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
			const charSelector = document.getElementById("characters-selector");
			charSelector.value = "heroes";
			charSelector.dispatchEvent(new Event("change"));

			const selectedCard = document.querySelector(".character-card.selected-card");
			selectedCard?.classList.remove("selected-card");

			document.querySelectorAll(".battle-button").forEach((btn) => {
				btn.disabled = false;
			});

			document.getElementById("rewards").innerHTML = "";

			document.getElementById("difficulty").value = "1";

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
			let playerMoved = false;

			for (let i = 6; i >= 1; i--) {
				if (loadFromStorage(`level${i}Unlocked`)) {
					const levelElement = document.querySelector(`.level[data-level="${i}"]`);
					if (levelElement) {
						await movePlayerToLevel(levelElement);
						playerMoved = true;
						break;
					}
				}

				if (!playerMoved) {
					const firstLevel = document.querySelector('.level[data-level="1"]');
					if (firstLevel) await movePlayerToLevel(firstLevel);
				}
			}
			break;
		case "battle":
			await loadbattleState();
			break;
	}
};

export const loadMapState = async () => {
	for (let i = 1; i <= 6; i++) {
		const isUnlocked = loadFromStorage(`level${i}Unlocked`);
		const level = document.querySelector(`.level[data-level="${i}"]`);
		if (level) {
			if (isUnlocked) {
				level.classList.remove("locked");
				level.classList.add("unlocked");
			} else {
				level.classList.add("locked");
				level.classList.remove("unlocked");
			}
		}
	}

	await enemiesInLevel();
	loadPlayerPosition();
	showLevelInfo();

	navbar.style.display = "flex";
	mapScreen.style.display = "flex";
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

	namePlayer.textContent = savedUserName;

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
		showLevelInfo();

		const currentScreen = loadFromStorage("currentScreen") || "login";

		await new Promise((resolve) => setTimeout(resolve, 100));

		if (currentScreen === "login") {
			await playMusicForScreen("login");
		} else if (currentScreen === "map") {
			await playMusicForScreen("map");
		} else if (currentScreen === "battle") {
			await playMusicForScreen("battle");
		}

		const gameStarted = loadFromStorage("gameStarted");

		await imageEnemies();

		if (currentScreen && gameStarted) {
			const currentLevel = loadFromStorage("currentLevel") || 1;

			for (let level = 1; level <= currentLevel; level++) {
				saveToStorage(`level${level}Unlocked`, true);
			}

			let maxUnlockedLevel = 1;
			for (let i = 6; i >= 1; i--) {
				if (loadFromStorage(`level${i}Unlocked`)) {
					maxUnlockedLevel = i;
					break;
				}
			}

			for (let i = 1; i <= maxUnlockedLevel; i++) {
				const level = document.querySelector(`.level[data-level="${i}"]`);
				if (level) {
					level.classList.remove("locked");
					level.classList.add("unlocked");
				}
			}

			await loadGameState(currentScreen);
			updateAsideVisibility();
			updateBattleBackground();
			window.addEventListener("resize", () => {
				updateAsideVisibility();
				updateBattleBackground;
			});
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
		await playMusicForScreen("login");
	}
});
