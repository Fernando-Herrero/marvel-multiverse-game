import { handleCharacterSelection } from "./character.js";
import { loginScreen, mapScreen, navbar, title } from "./index.js";
import { showFirstLevel, showLeveleInfo } from "./map.js";
import { saveToStorage } from "./storage.js";
import { hideModal, modalAcceptBtn, modalBackdrop, showBriefing, showModal } from "./utils.js";

export const inputUserName = document.getElementById("username");
export const startGameBtn = document.getElementById("start-game-btn");
export const charactersSelect = document.getElementById("characters-selector");
export let namePlayer = document.getElementById("name-player");
export let imgPlayer = document.getElementById("img-player");
export const infoHeroContainer = document.getElementById("info-hero");
export const aside = document.getElementById("aside");

export const getSelectedValue = () => charactersSelect.value;

const validateUsername = (name) => {
	const minlenght = 3;

	if (name.length < minlenght) {
		return { valid: false, message: `Minimum ${minlenght} characters` };
	}
	return { valid: true, message: "" };
};

export const checkValidStartGame = () => {
	const name = inputUserName.value.trim();
	const selectedCard = document.querySelector(".character-card.selected-card");
	const validation = validateUsername(name);

	inputUserName.style.borderColor = !validation.valid ? "var(--accent-color)" : "";

	startGameBtn.disabled = !(name && selectedCard && validation.valid);
};

export const renderCardInfohero = (characterData) => {
	const card = document.createElement("div");
	card.classList.add("info-hero-card");

	const imgCard = document.createElement("img");
	imgCard.classList.add("info-hero-card-img");
	imgCard.src = characterData.imageUrl;
	imgCard.alt = characterData.name;

	const infoHero = document.createElement("div");
	infoHero.classList.add("info-hero-card-info");

	const h3Card = document.createElement("h3");
	h3Card.textContent = characterData.name;

	const statsCard = document.createElement("div");
	statsCard.classList.add("stats-info-hero-card");

	characterData.stats.forEach((stat) => {
		const p = document.createElement("p");
		p.textContent = stat;
		statsCard.appendChild(p);
	});

	infoHero.appendChild(h3Card);
	infoHero.appendChild(statsCard);

	card.appendChild(imgCard);
	card.appendChild(infoHero);

	card.style.pointerEvents = "none";

	return card;
};

const getStatValue = (selectedCard, statName) => {
	const statP = Array.from(selectedCard.querySelectorAll(".character-stats p")).find((p) =>
		p.textContent.startsWith(`${statName}:`)
	);
	if (!statP) return 50;
	return parseInt(statP.textContent.split(":")[1].trim()) || 50;
};

export const setupGameListeners = () => {
	startGameBtn.addEventListener("click", (e) => {
		const currentName = inputUserName.value.trim();
		const validation = validateUsername(currentName);
		const selectedCard = document.querySelector(".character-card.selected-card");
		const difficulty = document.getElementById("difficulty");
		saveToStorage("difficulty", difficulty);

		if (startGameBtn.disabled) {
			e.preventDefault();

			if (!currentName) {
				showModal("Please, enter a username", {
					confirmText: "Accept",
					isConfirmation: false,
				});
			} else if (!validation.valid) {
				showModal(`Invalid username ${validation.message}`, {
					confirmText: "Accept",
					isConfirmation: false,
				});
			} else if (!selectedCard) {
				showModal("Please select a character", {
					confirmText: "Accept",
					isConfirmation: false,
				});
			}
			return;
		}

		if (selectedCard) {
			const characterData = {
				id: selectedCard.dataset.id,
				name: selectedCard.querySelector("h3").textContent,
				imageUrl: selectedCard.querySelector("img").src,
				stats: Array.from(selectedCard.querySelectorAll(".character-stats p")).map((p) => p.textContent),
				powerstats: {
					Intelligence: getStatValue(selectedCard, "Intelligence"),
					Strength: getStatValue(selectedCard, "Strength"),
					Speed: getStatValue(selectedCard, "Speed"),
					Durability: getStatValue(selectedCard, "Durability"),
					Power: getStatValue(selectedCard, "Power"),
					Combat: getStatValue(selectedCard, "Combat"),
				},
			};

			saveToStorage("playerCharacter", characterData);

			infoHeroContainer.innerHTML = "";
			infoHeroContainer.appendChild(renderCardInfohero(characterData));
		}

		loginScreen.style.display = "none";
		mapScreen.style.display = "flex";
		navbar.style.display = "flex";
		title.style.display = "none";

		showFirstLevel();

		namePlayer.textContent = inputUserName.value;
		const imgElement = selectedCard.querySelector("img");
		imgPlayer.src = imgElement.src;

		saveToStorage("currentScreen", "map");
		saveToStorage("gameStarted", true);
		saveToStorage("playerName", inputUserName.value);
		saveToStorage("playerImg", imgElement.src);

		showBriefing(
			`Welcome ${getSelectedValue()} to the Multiverse Challenge`,
			`As Earth's ${
				getSelectedValue() === "heroes" ? "newest protector" : "most feared conqueror"
			}, you must face 6 formidable opponents across fractured realities.\n` +
				`Each victory brings you closer to controlling the Nexus of All Realities.\n` +
				`Choose wisely - your ${
					getSelectedValue() === "heroes" ? "heroic actions" : "villainous schemes"
				} will echo through eternity.`,
			{
				after: {
					text: "Enter the Multiverse",
					action: () => hideModal(),
				},
			}
		);

		showFirstLevel();
		showLeveleInfo();

		saveToStorage("mainBriefing", {
			briefingShow: true,
			briefingCompleted: false,
			playerName: inputUserName.value,
			playerType: getSelectedValue(),
		});
	});
};

export const setupLoginListeners = () => {
	inputUserName.addEventListener("input", () => {
		const userName = inputUserName.value.trim();
		saveToStorage("userName", userName);
		checkValidStartGame();
	});

	document.addEventListener("click", (e) => {
		const card = e.target.closest(".character-card");
		if (!card) return;

		document.querySelectorAll(".character-card.selected-card").forEach((c) => {
			c.classList.remove("selected-card");
		});

		card.classList.add("selected-card");
		saveToStorage("selectedCharacter", card.dataset.id);
		checkValidStartGame();
	});

	charactersSelect.addEventListener("change", handleCharacterSelection);

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
};
