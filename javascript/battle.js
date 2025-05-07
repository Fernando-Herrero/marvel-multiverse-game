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

const calculateDefence = () => {
	const battleState = loadFromStorage("battleStatus");

	battleState.player.defenseModifier = 15;
	battleState.player.statusEffects.push({
		type: "defending",
		turnsLeft: 1,
	});

	saveToStorage("battleState", battleState);

	return {
		success: true,
		message: `${battleState.player.character.name} used defence`,
		effect: "defence",
	};
};

const calculateDodge = () => {
	const battleState = loadFromStorage("battleState");
	const player = battleState.player.character;
	const enemy = battleState.enemy.character;

	const dodgeChance = player.powerstats.speed / 2 + player.powerstats.combat / 2;
	const dodgeRoll = Math.random() * 100;

	if (dodgeRoll <= dodgeChance) {
		battleState.player.statusEffects.push({
			type: "dodging",
			turnsLeft: 1,
		});

		saveToStorage("battleState", battleState);

		return {
			success: true,
			message: `${player.name} swiftly dodges the next attack`,
			effect: "dodge",
		};
	} else {
		return {
			success: false,
			message: `${player.name} tries to dodge but loses balance`,
			effect: null,
		};
	}
};

const calculateSpecialSkill = () => {
	const battleState = loadFromStorage("battleState");
	const player = battleState.player.character;
	const enemy = battleState.enemy;

	if (battleState.specialAbilityUsed) {
		return {
			success: false,
			message: "You have already used your special ability in this battle!",
			effect: null,
		};
	}

	let message = "";
	let damage = 0;
	let effect = "special";

	switch (player.name) {
		case "Black Widow":
			damage = 40 + player.powerstats.combat;
			enemy.currentHp -= damage;
			message = "Black Widow executes a Tactical Ambush! Double damage!";
			break;

		case "Spider-Man":
			enemy.statusEffects.push({ type: "webbed", turnsLeft: 1 });
			message = "Spider-Man launches a Paralyzing Web! The enemy cannot attack next turn.";
			break;

		case "Iron Man":
			damage = 30 + player.powerstats.intelligence;
			enemy.currentHp -= damage;
			message = `Iron Man fires a Pulse Blast! Deals ${damage} damage ignoring defense.`;
			break;

		case "Captain America":
			battleState.player.shielded = true;
			battleState.player.defenseModifier = 15;
			message =
				"Captain America executes a Perfect Block! Blocks all damage this turn and increases defense next.";
			break;

		case "Thor":
			damage = 40 + player.powerstats.power;
			enemy.currentHp -= damage;
			message = `Thor calls down Divine Thunder! Unavoidable attack deals ${damage} damage.`;
			break;

		case "Hulk":
			battleState.player.statusEffects.push({
				type: "rage",
				strengthBonus: 5,
				defensePenalty: 10,
				turnsLeft: 2,
			});
			message = "Hulk enters Uncontrollable Rage! Gains +5 strength for 2 turns but loses defense.";
			break;

		case "Thanos":
			if (!battleState.player.charging) {
				battleState.player.charging = true;
				message = "Thanos charges up the Infinity Fist! Will strike next turn with devastating force.";
				effect = "charging";
			} else {
				damage = 60 + player.powerstats.strength;
				enemy.currentHp -= damage;
				battleState.player.charging = false;
				message = `Thanos unleashes the Infinity Fist! Massive blow deals ${damage} damage.`;
			}
			break;

		case "Loki":
			battleState.player.statusEffects.push({ type: "illusion", dodgeChance: 0.5, turnsLeft: 1 });
			message = "Loki uses Multiform Illusion! 50% chance to dodge all attacks this turn.";
			break;

		case "Ultron":
			if (battleState.lastPlayerAbility) {
				player.copiedAbility = battleState.lastPlayerAbility;
				message = `Ultron uses Lethal Upgrade! Copied ability: ${player.copiedAbility.name}`;
			} else {
				message = "Ultron failed to copy a move — no recent player ability found.";
				effect = "fail";
			}
			break;

		case "Red Skull":
			battleState.enemy.statusEffects.push({
				type: "demoralized",
				attackPenalty: 10,
				turnsLeft: 2,
			});
			message = "Red Skull invokes Terror Domination! Player's attack is reduced for 2 turns.";
			break;

		case "Hela":
			if (!battleState.player.revived && battleState.player.currentHp <= 0) {
				battleState.player.currentHp = Math.floor(player.maxHp * 0.3);
				battleState.player.revived = true;
				message = "Hela summons the dead and revives with 30% HP!";
			} else {
				message = "Hela's ability is only activated upon defeat.";
				effect = "fail";
			}
			break;

		case "Killmonger":
			battleState.player.statusEffects.push({ type: "doubleStrike", turnsLeft: 1 });
			message = "Killmonger unleashes Killer Instinct! May attack twice this turn if the first hits.";
			break;

		default:
			damage = 20 + player.powerstats.strength;
			enemy.currentHp -= damage;
			message = `${player.name} uses a basic enhanced attack! Deals ${damage} damage.`;
			break;
	}

	battleState.specialAbilityUsed = true;
	saveToStorage("battleState", battleState);

	return {
		succes: true,
		damage,
		message,
		effect,
	};
};

const updateBattleUi = () => {
	const battleText = document.getElementById("battle-text");

	battleText.textContent = result.message;
	battleText.style.display = "block";

	const battleState = loadFromStorage("battleState");
	document.querySelector(".bar-ps-player").style.width = `${
		(battleState.player.currentHp / battleState.player.maxHp) * 100
	}%`;
	document.querySelector(".bar-ps-enemy").style.width = `${
		(battleState.enemy.currentHp / battleState.enemy.maxHp) * 100
	}%`;

	const playerCard = document.getElementById("enemy-battle-card");
	const enemyCard = document.getElementById("enemy-battle-card");
};
