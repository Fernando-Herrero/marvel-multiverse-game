import { createCharacterCard, fetchCharactersByName } from "./character.js";
import { battleScreen } from "./map.js";
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
			player: {
				character: playerData,
				currentHp: 100,
				maxHp: 100,
				defenseModifier: 0,
				statusEffects: [],
			},
			enemy: {
				character: enemyData,
				currentHp: 100,
				maxHp: 100,
				defenseModifier: 0,
				statusEffects: [],
			},
			turn: "player",
			specialAbilityUsed: false,
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
	if (playerHealth) playerHealth.style.width = `${battleState.playerHP}%`;
	if (enemyHealth) enemyHealth.style.width = `${battleState.enemyHP}%`;
};

const setupBattleActions = () => {
	const attackbtn = document.getElementById("attack");
	attackbtn.addEventListener("click", () => executeAction("attack"));

	const defencebtn = document.getElementById("defence");
	defencebtn.addEventListener("click", () => executeAction("defence"));

	const specialSkillkbtn = document.getElementById("special-skill");
	specialSkillkbtn.addEventListener("click", () => executeAction("special-skill"));

	const dodgekbtn = document.getElementById("dodge");
	dodgekbtn.addEventListener("click", () => executeAction("dodge"));
};

const executeAction = (action) => {
	const battleState = loadFromStorage("battleState");

	if (battleState.turn !== "player") return;

	let result;
	let turn = 0;

	switch (action) {
		case "attack":
			result = calculateAttack();
			break;
		case "defence":
			result = { message: "You brace yourself to defend against the next attack" };
			battleState.player.defenseModifier = 10;
			break;
		case "sepecial-skill":
			result = calculateSpecialSkill();
			break;
		case "dodge":
			result = calculateDodge();
			break;
	}

	updateBattleUi(result);

	if (action !== "defence") {
		processEnemyTurn();
	}

	turn++;
};

const calculateAttack = () => {
	const battleState = loadFromStorage("battleState");
	const player = loadFromStorage("playerCharacter");
	const enemy = battleState.enemy;

	const attackPower = player.powerstats.strength + Math.random() * 20;
	const defensePower = player.powerstats.durability + Math.random() * 15 + enemy.defenseModifier;

	if (attackPower > defensePower) {
		const damage = Math.max(5, Math.floor(attackPower - defensePower));
		enemy.currentHp = Math.max(0, enemy.currentHp - damage);

		saveToStorage("battleState", battleState);

		return {
			success: true,
			damage,
			message: `Successful attack! ${player.name} deals ${damage} damage points`,
		};
	} else {
		return {
			success: false,
			message: `${enemy.character.name} blocked the attack`,
		};
	}
};

const calculateDodge = () => {
	const battleState = loadFromStorage("battleState");
	const player = loadFromStorage("playerCharacter");
	const enemy = battleState.enemy;
};

const calculateSpecialSkill = () => {};

const updateBattleUi = () => {
	const battleText = document.getElementById("battle-text");

	battleText.textContent = result.message;
	battleText.style.display = "block";

	const battleState = loadFromStorage("battleState");
	document.querySelector(".bar-ps-player").style.width = `${battleState.player.currentHp}%`;
	document.querySelector(".bar-ps-enemy").style.width = `${battleState.enemy.currentHp}%`;

	if (result.success) {
		document.getElementById("enemy-battle-card").classList.add("sake-effect");
		setTimeout(() => {
			document.getElementById("enemy-battle-card").classList.remove("shake-effect");
		}, 500);
	}
};
