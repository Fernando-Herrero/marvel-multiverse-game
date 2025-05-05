import { createCharacterCard, fetchCharactersByName } from "./character.js";
import { loadFromStorage, saveToStorage } from "./storage.js";

export const renderBattleCards = async (enemyName) => {
	const existingBattle = loadFromStorage("battleState");

	const playerData = loadFromStorage("playerCharacter");
	let enemyData;

	if (existingBattle && existingBattle.enemy) {
		enemyData = existingBattle.enemy;
	} else {
		enemyData = await fetchCharactersByName(enemyName);

		saveToStorage("battleState", {
			enemy: enemyData,
			playerHP: 100,
			enemyHP: 100,
			currentTurn: "player",
		});
	}

	saveToStorage("currentScreen", "battle");

	renderPlayerCard(playerData);
	renderEnemyCard(enemyData);

	if (existingBattle) {
		restoreBattleState(existingBattle);
	}
};

const renderPlayerCard = (playerData) => {
	const playerBattleCardContainer = document.getElementById("player-battle-card");
	playerBattleCardContainer.innerHTML = "";

	if (playerData) {
		const playerBattleCard = document.createElement("div");
		playerBattleCard.classList.add("player-battle-card-content");

		const imgBattleCard = document.createElement("img");
		imgBattleCard.classList.add("img-battle-card");
		imgBattleCard.src = playerData.imageUrl;
		imgBattleCard.alt = playerData.name;

		const infoBattleCard = document.createElement("div");
		infoBattleCard.classList.add("info-battle-card");

		const nameBattleCard = document.createElement("h3");
		nameBattleCard.textContent = playerData.name;

		const statsDivBattleCard = document.createElement("div");
		statsDivBattleCard.classList.add("stats-battle-card");

		playerData.stats.forEach((stats) => {
			const p = document.createElement("p");
			p.textContent = stats;
			statsDivBattleCard.appendChild(p);
		});

		infoBattleCard.appendChild(nameBattleCard);
		infoBattleCard.appendChild(statsDivBattleCard);

		playerBattleCard.appendChild(imgBattleCard);
		playerBattleCard.appendChild(infoBattleCard);

		playerBattleCardContainer.appendChild(playerBattleCard);
	}
};

const renderEnemyCard = (enemyData) => {
	const enemyCardBattleContainer = document.getElementById("enemy-battle-card");
	enemyCardBattleContainer.innerHTML = "";

	if (enemyData) {
		const enemyCard = createCharacterCard(
			enemyData,
			loadFromStorage("characterType") === "heroes" ? "villain" : "hero"
		);

		enemyCard.style.pointerEvents = "none";
		enemyCard.dataset.context = "battle";
		enemyCard.dataset.role = "enemy";

		const hijos = enemyCard.querySelectorAll(".card-info-character");
		hijos.forEach((hijo) => (hijo.dataset.context = "battle"));

		enemyCardBattleContainer.appendChild(enemyCard);
	}
};

const restoreBattleState = (battleState) => {
	const playerHealth = document.querySelector(".bar-ps-player");
	const enemyHealth = document.querySelector(".bar-ps-enemy");

	if (playerHealth) playerHealth.style.width = `${battleState.playerHP}%`;
	if (enemyHealth) enemyHealth.style.width = `${battleState.enemyHP}%`;
};
