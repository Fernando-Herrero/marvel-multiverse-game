import { createCharacterCard, fetchCharactersByName } from "./character.js";
import { battleScreen, player } from "./map.js";
import { loadFromStorage, saveToStorage } from "./storage.js";

const playerHealthBar = document.querySelector(".bar-ps-player");
const enemyHealthBar = document.querySelector(".bar-ps-enemy");
const battleText = document.getElementById("battle-text");
const playerCard = document.getElementById("player-battle-card");
const enemyCard = document.getElementById("enemy-battle-card");

export const renderBattleCards = async (enemyName) => {
	const existingBattle = loadFromStorage("battleState");
	const playerData = loadFromStorage("playerCharacter");
	let enemyData;

	if (existingBattle && existingBattle.enemy) {
		enemyData = existingBattle.enemy.character;
	} else {
		enemyData = await fetchCharactersByName(enemyName);

		const initialBattleState = {
			player: {
				character: playerData,
				currentHp: 100,
				maxHp: 100,
				statusEffects: [],
				specialUsed: false,
			},
			enemy: {
				character: enemyData,
				currentHp: 100,
				maxHp: 100,
				statusEffects: [],
				specialUsed: false,
			},
			turn: 0,
			currentLevel: loadFromStorage("currentLevel") || 1,
		};

		saveToStorage("battleState", initialBattleState);
	}

	saveToStorage("currentScreen", "battle");
	renderPlayerCard(playerData);
	renderEnemyCard(enemyData);
	setupBattleActions();

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

const setupBattleActions = () => {
	const attackbtn = document.getElementById("attack");
	attackbtn.addEventListener("click", () => executeAction("attack"));

	const defencebtn = document.getElementById("defence");
	defencebtn.addEventListener("click", () => executeAction("defence"));

	const specialSkillkbtn = document.getElementById("special-skill");
	specialSkillkbtn.addEventListener("click", () => executeAction("special"));

	const dodgekbtn = document.getElementById("dodge");
	dodgekbtn.addEventListener("click", () => executeAction("dodge"));
};

const executeAction = async (playerAction) => {
	const battleState = loadFromStorage("battleState");
	const { player, enemy } = battleState;

	const isPlayerWebbed = player.statusEffects.some((e) => e.type === "webbed");
	if (isPlayerWebbed) {
		updateBattleUi({
			success: false,
			message: "You are webbed and cannot act this turn!",
			effect: null,
		});

		const enemyAction = chooseEnemyAction(battleState);
		const enemyResult = calculateAction(enemyAction, playerAction, enemyAction, true);
		updateBattleUi(enemyResult);

		checkBattleEnd();
		saveToStorage("battleState", battleState);
		return;
	}

	const isEnemyWebbed = enemy.statusEffects.some((e) => e.type === "webbed");
	if (isEnemyWebbed) {
		updateBattleUi({
			success: false,
			message: `${enemy.character.name} is webbed and cannot act this turn!`,
			effect: null,
		});

		const playerResult = calculateAction(player, enemy, playerAction, false);
		updateBattleUi(playerResult);

		checkBattleEnd();
		saveToStorage("battleState", battleState);
		return;
	}

	const enemyAction = chooseEnemyAction(battleState);

	const playerResult = calculateAction(player, enemy, playerAction, false);
	const enemyResult = calculateAction(enemy, player, enemyAction, true);

	handleSpecialInteractions(playerAction, enemyAction, playerResult, enemyResult, battleState);

	updateBattleUi(playerResult);
	updateBattleUi(enemyResult);

	battleState.turn++;

	updateStatusEffects(battleState);

	checkBattleEnd();
	saveToStorage("battleState", battleState);
};

const chooseEnemyAction = (battleState) => {
	const { enemy, player } = battleState;
	const actions = ["attack", "defence", "dodge"];

	if ((!enemy.specialUsed && Math.random() < 0.3) || battleState.turn > 2) {
		return "special";
	}

	if (player.currentHp < 30 && Math.random() < 0.7) {
		return "attack";
	}

	if (enemy.currentHp < 40 && Math.random() < 0.6) {
		return "defence";
	}

	const randomIndex = Math.floor(Math.random() * actions.length);
	return actions[randomIndex];
};

const calculateAction = (attacker, defender, action, isEnemy) => {
	switch (action) {
		case "attack":
			return calculateAttack(attacker, defender, isEnemy);
		case "defence":
			return calculateDefence(attacker, isEnemy);
		case "special":
			return calculateSpecialSkill(attacker, defender, isEnemy);
		case "dodge":
			return calculateDodge(attacker, isEnemy);
		default:
			return {
				success: false,
				message: "Invalid action!",
				effect: null,
			};
	}
};

const calculateAttack = (attacker, defender, isEnemy) => {
	const battleState = loadFromStorage("battleState");
	const target = isEnemy ? player : enemy;

	let attackPower = attacker.character.powerstats.strength + Math.random() * 20;

	const rageEffect = attacker.statusEffects.find((e) => e.type === "rage");
	if (rageEffect) attackPower *= 1.5;

	const strikeEffect = attacker.statusEffects.find((e) => e.type === "doubleStrike");
	if (strikeEffect) attackPower *= 2;

	const demoralizedEffect = attacker.statusEffects.find((e) => e.type === "demoralized");
	if (demoralizedEffect) attackPower *= 0.7;

	const shieldEffect = defender.statusEffects.find((e) => e.type === "shield");
	if (shieldEffect)
		return {
			success: false,
			message: `${defender.character.name} blocked the attack completely with a shield!`,
			effect: null,
		};

	const defencePower = attacker.powerstats.durability + Math.random() * 15;

	let result;

	if (attackPower > defencePower) {
		const damage = Math.max(5, Math.floor(attackPower - defencePower));
		defender.currentHp = Math.max(0, defender.currentHp - damage);

		result = {
			success: true,
			damage,
			message: `${attacker.character.name} attacks and deals ${damage} damage!`,
			effect: "attack",
		};
	} else {
		result = {
			success: false,
			message: `${defender.character.name} blocked the attack`,
			effect: null,
		};
	}

	saveToStorage("battleState", battleState);
	return result;
};

const calculateDefence = (character, isEnemy) => {
	return {
		success: true,
		message: `${character.character.name} takes a defensive stance`,
		effect: "defence",
	};
};

const calculateDodge = (character) => {
	const dodgeChance = character.character.powerstats.speed / 2 + character.character.powerstats.combat / 2;

	if (character.character.name === "Black Widow" || character.character.name === "Spider-Man") {
		dodgeChance += 30;
	}

	const success = Math.random() * 100 <= dodgeChance;

	return {
		success,
		message: success
			? `${character.caharacter.name} succesfully dodged!`
			: `${character.character.name} failed to dodge`,
		effect: "dodge",
	};
};

const calculateSpecialSkill = (attacker, defender, isEnemy) => {
	const battleState = loadFromStorage("battleState");
	const target = isEnemy ? battleState.player : battleState.enemy;

	if (attacker.specialAbilityUsed) {
		return {
			success: false,
			message: `${attacker.character.name} has already used their special ability in this battle!`,
			effect: null,
		};
	}

	let damage = 0;
	let message = "";
	let effect = "special";
	let statusEffect = null;

	switch (attacker.character.name) {
		case "Black Widow":
			damage = 40 + attacker.character.powerstats.combat;
			target.currentHp = Math.max(0, target.currentHp - damage);
			message = `Black Widow executes a Tactical Ambush! Deals ${damage} damage!`;
			break;

		case "Spider-Man":
			statusEffect = { type: "webbed", turnsLeft: 1 };
			defender.statusEffects.push(statusEffect);
			message = "Spider-Man launches a Paralyzing Web! The enemy cannot attack next turn.";
			effect = "status";
			break;

		case "Iron Man":
			damage = 30 + attacker.powerstats.intelligence;
			target.currentHp = Math.max(0, target.currentHp - damage);
			message = `Iron Man fires a Pulse Blast! Deals ${damage} damage ignoring defense.`;
			break;

		case "Captain America":
			statusEffect = { type: "shield", turnsLeft: 2 };
			attacker.statusEffects.push(statusEffect);
			message = "Captain America executes a Perfect Block! Blocks all damage for two turns.";
			break;

		case "Thor":
			damage = 40 + attacker.powerstats.power;
			target.currentHp = Math.max(0, target.currentHp - damage);
			message = `Thor calls down Divine Thunder! Unavoidable attack deals ${damage} damage.`;
			break;

		case "Hulk":
			statusEffect = { type: "rage", turnsLeft: 2 };
			attacker.statusEffects.push(statusEffect);
			message = "Hulk enters Uncontrollable Rage! Increased damage for the next two turns.";
			break;

		case "Thanos":
			damage = 40 + attacker.powerstats.power;
			target.currentHp = Math.max(0, target.currentHp - damage);
			message = "Thanos charges up the Infinity Fist! Strikes with devastating force.";
			break;

		case "Loki":
			statusEffect = { type: "illusion", turnsLeft: 1 };
			attacker.statusEffects.push(statusEffect);
			message = "Loki uses Multiform Illusion! 50% chance to dodge all attacks next turn.";
			break;

		case "Ultron":
			statusEffect = { type: "regen", turnsLeft: 1 };
			attacker.statusEffects.push(statusEffect);
			message = `Ultron uses Regen Upgrade! Will regenerate 30% HP next turn.`;
			break;

		case "Red Skull":
			statusEffect = { type: "demoralized", turnsLeft: 2 };
			defender.statusEffects.push(statusEffect);
			message = "Red Skull invokes Terror Domination! Enemy's attack is reduced for 2 turns.";
			break;

		case "Hela":
			damage = 30;
			target.currentHp = Math.max(0, target.currentHp - damage);
			const heal = 20;
			attacker.currentHp = Math.min(player.maxHp, attacker.currentHp + heal);
			message = `Hela uses Life Drain! Deals ${damage} damage and heals ${heal} HP.`;
			break;

		case "Killmonger":
			statusEffect = { type: "doubleStrike", turnsLeft: 1 };
			attacker.statusEffects.push(statusEffect);
			message = "Killmonger unleashes Killer Instinct! May strike twice next turn if the first hits.";
			break;

		default:
			damage = 20 + attacker.character.powerstats.strength;
			target.currentHp = Math.max(0, target.currentHp - damage);
			message = `${attacker.character.name} uses a basic enhanced attack! Deals ${damage} damage.`;
			break;
	}

	attacker.specialUsed = true;
	saveToStorage("battleState", battleState);

	return {
		success: true,
		message,
		effect,
		damage: damage || 0,
		statusEffect,
	};
};

const updateStatusEffects = (battleState) => {
	const processCharacterEffects = (character) => {
		character.statusEffects.forEach((effect) => effect.turnsLeft--);
		character.statusEffects = character.statusEffect.filter((effect) => effect.turnsLeft > 0);
	};

	processCharacterEffects(battleState.player);
	processCharacterEffects(battleState.enemy);
};

// const processStatusEffects = () => {
// 	const battleState = loadFromStorage("battleState", battleState);
// 	const { player, enemy } = battleState;

// 	player.statusEffects = player.statusEffects.filter((effect) => {
// 		effect.turnsLeft--;
// 		return effect.turnsLeft > 0;
// 	});

// 	enemy.statusEffects = enemy.statusEffects.filter((effect) => {
// 		effect.turnsLeft--;
// 		return effect.turnsLeft > 0;
// 	});

// 	// const regenEffect = battleState.player.statusEffects.find((e) => e.type === "regen");
// 	// if (regenEffect) {
// 	// 	const healAmount = Math.floor(battleState.player.maxHp * 0.3);
// 	// 	battleState.player.currentHp = Math.min(battleState.player.maxHp, battleState.player.currentHp + healAmount);
// 	// 	updateBattleUi({
// 	// 		message: `${battleState.player.character.name} regenerates ${healAmount} HP!`,
// 	// 		effect: "heal",
// 	// 	});
// 	// }
// 	// const regenEffectEnemy = battleState.enemy.statusEffects.find((e) => e.type === "regen");
// 	// if (regenEffectEnemy) {
// 	// 	const healAmount = Math.floor(battleState.enemy.maxHp * 0.3);
// 	// 	battleState.enemy.currentHp = Math.min(battleState.enemy.maxHp, battleState.enemy.currentHp + healAmount);
// 	// 	updateBattleUi({
// 	// 		message: `${battleState.enemy.character.name} regenerates ${healAmount} HP!`,
// 	// 		effect: "heal",
// 	// 	});
// 	// }

// 	for (const character of [player, enemy]) {
// 		const regen = character.statusEffects.find((e) => e.type === "regen");
// 		if (regen) {
// 			const healAmount = Math.floor(character.maxHp * 0.3);
// 			character.currentHp = Math.min(character.maxHp, character.currentHp + healAmount);
// 			updateBattleUi({
// 				message: `${character.character.name} regenerates ${healAmount} HP!`,
// 				effect: "heal",
// 			});
// 		}
// 	}

// 	for (const character of [player, enemy]) {
// 		const webbed = character.statusEffects.find((e) => e.type === "webbed");
// 		if (webbed) {
// 			updateBattleUi({
// 				message: `${character.character.name} is webbed and can't move this turn!`,
// 				effect: "stunned",
// 			});
// 			saveToStorage("battleState", battleState);
// 			return;
// 		}
// 	}

// 	for (const character of [player, enemy]) {
// 		const illusion = character.statusEffects.find((e) => e.type === "illusion");
// 		if (illusion && Math.random() < 0.5) {
// 			updateBattleUi({
// 				message: `${character.character.name} dodged the attack with an illusion!`,
// 				effect: "dodged",
// 			});
// 		}
// 	}

// 	for (const char of [player, enemy]) {
// 		let attackMultiplier = 1;

// 		const rage = char.statusEffects.find((e) => e.type === "rage");
// 		if (rage) {
// 			attackMultiplier *= 1.5;
// 		}

// 		const strike = char.statusEffects.find((e) => e.type === "doubleStrike");
// 		if (strike) {
// 			attackMultiplier *= 2;
// 		}

// 		const demoralized = char.statusEffects.find((e) => e.type === "demoralized");
// 		if (demoralized) {
// 			attackMultiplier *= 0.7;
// 		}

// 		if (char === player) {
// 			battleState.player.attackMultiplier = attackMultiplier;
// 		} else {
// 			battleState.enemy.attackMultiplier = attackMultiplier;
// 		}
// 	}

// 	for (const char of [player, enemy]) {
// 		const shield = char.statusEffects.find((e) => e.type === "shield");

// 		if (shield && char === enemy) {
// 			updateBattleUi({
// 				message: `${enemy.character.name} blocked the attack completely with a shield!`,
// 				effect: "blocked",
// 			});
// 			saveToStorage("battleState", battleState);
// 			return;
// 		}

// 		if (shield && char === player) {
// 			updateBattleUi({
// 				message: `${player.character.name} blocked the attack completely with a shield!`,
// 				effect: "blocked",
// 			});
// 			saveToStorage("battleState", battleState);
// 			return;
// 		}
// 	}
// };
