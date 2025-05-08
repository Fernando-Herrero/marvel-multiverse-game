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
			},
			enemy: {
				character: enemyData,
				currentHp: 100,
				maxHp: 100,
				statusEffects: [],
			},
			turn: "player",
			playerSpecialused: false,
			enemySpecialUsed: false,
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

const executeAction = (action) => {
	const battleState = loadFromStorage("battleState");

	const isWebbed = battleState.player.statusEffects.some((e) => e.type === "webbed");
	if (isWebbed) {
		updateBattleUi({
			success: false,
			message: "You are webbed and cannot act this turn!",
			effect: null,
		});
	}

	const isEnemyShield = battleState.enemy.statusEffects.some((e) => e.type === "shield");
	if (isEnemyShield && action === "attack") {
		updateBattleUi({
			success: false,
			message: "Enemy is shielded! Your attack is completely blocked!",
			effect: null,
		});
		battleState.statusEffects.turnsLeft--;
	}

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
};

const calculateAttack = () => {
	const battleState = loadFromStorage("battleState");
	const { player, enemy } = battleState;

	let attackPower = player.powerstats.strength + Math.random() * 20;

	const rageEffect = player.statusEffects.find((e) => e.type === "rage");
	if (rageEffect) {
		attackPower *= 1.5;
		rageEffect.turnsLeft--;

		if (rageEffect.turnsLeft <= 0) {
			player.statusEffects = player.statusEffects.filter((e) => e.type !== "rage");
		}
	}

	const strikeEffect = player.statusEffects.find((e) => e.type === "doubleStrike");
	if (strikeEffect) {
		attackPower *= 2;
		strikeEffect.turnsLeft--;

		if (strikeEffect.turnsLeft <= 0) {
			player.statusEffects = player.statusEffects.filter((e) => e.type !== "doubleStrike");
		}
	}

	const demoralizedEffect = player.statusEffects.find((e) => e.type === "demoralized");
	if (demoralizedEffect) {
		attackPower *= 0.7;
		demoralizedEffect.turnsLeft--;

		if (demoralizedEffect.turnsLeft <= 0) {
			player.statusEffects = player.statusEffects.filter((e) => e.type !== "demoralized");
		}
	}

	const shieldEffect = enemy.statusEffects.find((e) => e.type === "shield");
	if (shieldEffect) {
		shieldEffect.turnsLeft--;

		if (shieldEffect.turnsLeft <= 0) {
			enemy.statusEffects = enemy.statusEffects.filter((e) => e.type !== "shield");
		}

		return {
			success: false,
			message: `${enemy.character.name} blocked the attack completely with a shield!`,
			effect: null,
		};
	}

	const defencePower = player.powerstats.durability + Math.random() * 15;

	let result;

	if (attackPower > defencePower) {
		const damage = Math.max(5, Math.floor(attackPower - defencePower));
		enemy.currentHp = Math.max(0, enemy.currentHp - damage);

		result = {
			success: true,
			damage,
			message: `${player.character.name} attacks and deals ${damage} damage!`,
			effect: "attack",
		};
	} else {
		result = {
			success: false,
			message: `${enemy.character.name} blocked the attack`,
			effect: null,
		};
	}

	saveToStorage("battleState", battleState);
	return result;
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
		message: `${battleState.player.character.name} assumes a defensive stance!`,
		effect: "defence",
	};
};

const calculateDodge = () => {
	const battleState = loadFromStorage("battleState");
	const { player, enemy } = battleState;

	const dodgeChance = player.character.powerstats.speed / 2 + player.character.powerstats.combat / 2;
	if (player.character.name === "Black Widow") {
		dodgeChance += 60;
	}
	const dodgeRoll = Math.random() * 100;

	if (dodgeRoll <= dodgeChance) {
		player.statusEffects.push({
			type: "dodging",
			turnsLeft: 1,
		});

		saveToStorage("battleState", battleState);

		return {
			success: true,
			message: `${player.character.name} prepares to dodge the next attack!`,
			effect: "dodge",
		};
	} else {
		return {
			success: false,
			message: `${player.character.name} tries to dodge but loses balance`,
			effect: null,
		};
	}
};

const calculateSpecialSkill = () => {
	const battleState = loadFromStorage("battleState");
	const { player, enemy } = battleState;

	if (battleState.specialAbilityUsed) {
		return {
			success: false,
			message: "You have already used your special ability in this battle! Can't use it anymore!",
			effect: null,
		};
	}

	let damage = 0;
	let message = "";
	let effect = "special";

	switch (player.character.name) {
		case "Black Widow":
			damage = 40 + player.character.powerstats.combat;
			enemy.currentHp = Math.max(0, enemy.currentHp - damage);
			message = `Black Widow executes a Tactical Ambush! Deals ${damage} damage!`;
			break;

		case "Spider-Man":
			enemy.statusEffects.push({ type: "webbed", turnsLeft: 1 });
			message = "Spider-Man launches a Paralyzing Web! The enemy cannot attack next turn.";
			effect = "status";
			break;

		case "Iron Man":
			damage = 30 + player.powerstats.intelligence;
			enemy.currentHp = Math.max(0, enemy.currentHp - damage);
			message = `Iron Man fires a Pulse Blast! Deals ${damage} damage ignoring defense.`;
			break;

		case "Captain America":
			player.statusEffects.push({ type: "shield", turnsLeft: 2 });
			message = "Captain America executes a Perfect Block! Blocks all damage for two turns.";
			break;

		case "Thor":
			damage = 40 + player.powerstats.power;
			enemy.currentHp = Math.max(0, enemy.currentHp - damage);
			message = `Thor calls down Divine Thunder! Unavoidable attack deals ${damage} damage.`;
			break;

		case "Hulk":
			player.statusEffects.push({ type: "rage", turnsLeft: 2 });
			message = "Hulk enters Uncontrollable Rage! Increased damage for the next two turns.";
			break;

		case "Thanos":
			damage = 40 + player.powerstats.power;
			enemy.currentHp = Math.max(0, enemy.currentHp - damage);
			message = "Thanos charges up the Infinity Fist! Strikes with devastating force.";
			break;

		case "Loki":
			player.statusEffects.push({ type: "illusion", turnsLeft: 1 });
			message = "Loki uses Multiform Illusion! 50% chance to dodge all attacks next turn.";
			break;

		case "Ultron":
			player.statusEffects.push({ type: "regen", turnsLeft: 1 });
			message = `Ultron uses Regen Upgrade! Will regenerate 30% HP next turn.`;
			break;

		case "Red Skull":
			enemy.statusEffects.push({ type: "demoralized", turnsLeft: 2 });
			message = "Red Skull invokes Terror Domination! Enemy's attack is reduced for 2 turns.";
			break;

		case "Hela":
			damage = 30;
			enemy.currentHp = Math.max(0, enemy.currentHp - damage);
			const heal = 20;
			player.currentHp = Math.min(player.maxHp, player.currentHp + heal);
			message = `Hela uses Life Drain! Deals ${damage} damage and heals ${heal} HP.`;
			break;

		case "Killmonger":
			player.statusEffects.push({ type: "doubleStrike", turnsLeft: 1 });
			message = "Killmonger unleashes Killer Instinct! May strike twice next turn if the first hits.";
			break;

		default:
			damage = 20 + player.powerstats.strength;
			enemy.currentHp = Math.max(0, enemy.currentHp - damage);
			message = `${player.name} uses a basic enhanced attack! Deals ${damage} damage.`;
			break;
	}

	battleState.specialAbilityUsed = true;
	saveToStorage("battleState", battleState);

	return {
		success: true,
		message,
		effect,
		damage,
	};
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
