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
				currentHp: 100,
				maxHp: 100,
				defenseModifier: 0,
				statusEffects: [],
			},
			enemy: {
				currentHp: 100,
				maxHp: 100,
				defenseModifier: 0,
				statusEffects: [],
			},
			playerHP: 100,
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

const playerHealth = document.querySelector(".bar-ps-player");
const enemyHealth = document.querySelector(".bar-ps-enemy");

const playerCard = document.getElementById("player-battle-card");
const enemyCard = document.getElementById("enemy-battle-card");

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

	switch (action) {
		case "attack":
			result = calculateAttack();
			break;
		case "defence":
			result = calculateDefence();
			break;
        case "sepecial-skill":
            result = calculateSpecialSkill();
            break;
        case "dodge":
            result = calculateDodge();
            break;
	}

    //Funciones de enemigo y actualizar batalla
};

const calculateAttack = () => {
    const battleState = loadFromStorage("battleState");
    const player = loadFromStorage("playerCharacter");
    const enemy = battleState.enemy;

    const attackPower = player.powerstats
};
