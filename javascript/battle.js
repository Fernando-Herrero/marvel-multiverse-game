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
				defenseModifier: 0,
				statusEffects: [],
				charging: false,
				revived: false,
			},
			enemy: {
				character: enemyData,
				currentHp: 100,
				maxHp: 100,
				defenseModifier: 0,
				statusEffects: [],
				charging: false,
				revived: false,
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

	if (battleState.turn !== "player" || battleState.player.statusEffects.some((e) => e.type === "paralyzed")) return;

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

	updateBattleUi(result);

	processStatusEffects();

	if (!checkBattleEnd()) {
		if (action !== "defence") {
			setTimeout(() => {
				processEnemyTurn();
			}, 1500);
		}
	}
};

const calculateAttack = () => {
	const battleState = loadFromStorage("battleState");
	const { player, enemy } = battleState;

	if (player.charging) {
		player.character = false;
		const damage = 60 + player.character.powerstats.strength;
		enemy.currentHp = Math.max(0, enemy.currentHp - damage);

		saveToStorage("battleState", battleState);

		return {
			success: true,
			damage,
			message: `${player.character.name} unleashes a charged attack! Deals ${damage} damage!`,
			effect: "special",
		};
	}

	const attackPower =
		player.powerstats.strength +
		Math.random() * 20 +
		(player.statusEffects.find((e) => e.type === "rage")?.strengthBonus || 0);
	const defencePower = player.powerstats.durability + Math.random() * 15 + enemy.defenseModifier;

	if (attackPower > defencePower) {
		const damage = Math.max(5, Math.floor(attackPower - defencePower));
		enemy.currentHp = Math.max(0, enemy.currentHp - damage);

		saveToStorage("battleState", battleState);

		if (player.statusEffects.some((e) => e.type === " doubleStrike")) {
			return {
				success: true,
				message: `${player.character.name} attacks and deals ${damage} damage! Prepares for a second strike...`,
				effect: "attack",
				doubleStrike: true,
			};
		}

		return {
			success: true,
			damage,
			message: `${player.character.name} attacks and deals ${damage} damage!`,
			effect: "attack",
		};
	} else {
		return {
			success: false,
			message: `${enemy.character.name} blocked the attack`,
			effect: null,
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
			message: "You have already used your special ability in this battle!",
			effect: null,
		};
	}

	let result;

	switch (player.character.name) {
		case "Black Widow":
			if (player.statusEffects.some((e) => e.type === "dodging")) {
				const damage = 40 + player.character.powerstats.combat;
				enemy.currentHp = Math.max(0, enemy.currentHp - damage);
				result = {
					success: true,
					message: `Black Widow executes a Tactical Ambush! Deals ${damage} damage!`,
					effect: "special",
				};
			} else {
				result = {
					success: false,
					message: "Black Widow needs to dodge first to set up her Tactical Ambush!",
					effect: null,
				};
			}
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

	playerCard.classList.remove("attack-effect", "defence-effect", "dodge-effect", "special-effect");
	enemyCard.classList.remove("attack-effect", "defence-effect", "dodge-effect", "special-effect");

	if (result.effect) {
		switch (result.effect) {
			case "attack":
				enemyCard.classList.add("shake-effect");
				break;
			case "defense":
				playerCard.classList.add("defense-effect");
				break;
			case "dodge":
				playerCard.classList.add("dodge-effect");
				break;
			case "special":
				playerCard.classList.add("special-effect");
				enemyCard.classList.add("shake-effect");
				break;
		}
	}
};

const calculateEnemyAttack = () => {
	const battleState = loadFromStorage("battleState");
	const enemy = battleState.enemy.character;
	const player = battleState.player;

	const attackPower = enemy.powerstats.strength + Math.random() * 20;
	const defensePower = player.character.powerstats.durability + Math.random() * 15 + player.defenseModifier;

	// Verificar si el jugador está esquivando
	const isDodging = player.statusEffects.some((e) => e.type === "dodging");

	if (isDodging) {
		return {
			success: false,
			message: `${player.character.name} esquiva hábilmente el ataque de ${enemy.name}!`,
			effect: "dodge",
		};
	}

	if (attackPower > defensePower) {
		const damage = Math.max(5, Math.floor(attackPower - defensePower));
		player.currentHp = Math.max(0, player.currentHp - damage);

		saveToStorage("battleState", battleState);

		return {
			success: true,
			damage,
			message: `${enemy.name} attacks and deals ${damage} damage!`,
			effect: "attack",
		};
	} else {
		return {
			success: false,
			message: `${player.character.name} blocks ${enemy.name}'s attack`,
			effect: null,
		};
	}
};

const useEnemySpecialSkill = () => {
	const battleState = loadFromStorage("battleState");
	const enemy = battleState.enemy.character;

	if (enemy.name === "Thanos") {
		battleState.player.statusEffects.push({
			type: "intimidated",
			turnsLeft: 2,
			attackReduction: 10,
		});

		battleState.enemy.specialAbilityUsed = true;
		saveToStorage("battleState", battleState);

		return {
			success: true,
			message: "¡Thanos usa el Puño del Infinito! Tu fuerza de ataque se reduce por 2 turnos",
			effect: "special",
		};
	}

	const damage = 25 + enemy.powerstats.strength;
	battleState.player.currentHp = Math.max(0, battleState.player.currentHp - damage);

	battleState.enemy.specialAbilityUsed = true;
	saveToStorage("battleState", battleState);

	return {
		success: true,
		damage,
		message: `¡${enemy.name} usa un ataque especial! Te causa ${damage} puntos de daño`,
		effect: "special",
	};
};

const processEnemyTurn = () => {
	setTimeout(() => {
		const battleState = loadFromStorage("battleState");
		battleState.turn = "enemy";
		saveToStorage("battleState", battleState);

		const isWebbed = battleState.enemy.statusEffects.some((e) => e.type === "webbed");
		if (isWebbed) {
			battleState.enemy.statusEffects = battleState.enemy.statusEffects.filter((e) => e.type !== "webbed");
			saveToStorage("battleState", battleState);

			const battleText = document.getElementById("battle-text");
			battleText.textContent = `${battleState.enemy.character.name} is paralyzed by a web and cannot attack!`;
			battleText.style.display = "block";

			battleState.turn = "player";
			saveToStorage("battleState", battleState);
			updateBattleUi(result);
			return;
		} else {
			let enemyAction;
			const hpPercentage = battleState.enemy.currentHp / battleState.enemy.maxHp;

			if (hpPercentage < 0.3 && Math.random() > 0.6) {
				enemyAction = "defence";
			} else if (!battleState.specialAbilityUsed && Math.random() > 0.7) {
				enemyAction = "special";
			} else {
				enemyAction = "attack";
			}

			let result;
			switch (enemyAction) {
				case "attack":
					result = calculateEnemyAttack();
					break;
				case "defence":
					result = {
						message: `${battleState.enemy.character.name} assumes a defensive stance`,
						effect: "defence",
					};
					battleState.enemy.defenseModifier = 15;
					break;
				case "special":
					result = useEnemySpecialSkill();
					break;
			}

			updateBattleUi(result);
		}

		battleState.turn = "player";
		battleState.player.defenseModifier = 0;
		battleState.enemy.defenseModifier = 0;

		saveToStorage("battleState", battleState);

		checkBattleEnd();
	}, 1500);
};

const checkBattleEnd = () => {
	const battleState = loadFromStorage("battleState");

	if (battleState.player.currentHp <= 0) {
		showBattleResult(false);
	} else if (battleState.enemy.currentHp <= 0) {
		showBattleResult(true);
	}
};

const showBattleResult = (isVictory) => {
	const battleState = loadFromStorage("battleState");
	const enemy = battleState.enemy.character;

	if (isVictory) {
		showModal(`¡Victoria contra ${enemy.name}!`, {
			confirmText: "Continuar",
			isConfirmation: false,
		});

		const currentLevel = loadFromStorage("currentLevel") || 1;
		if (currentLevel < 6) {
			const nextLevel = document.querySelector(`.level[data-level="${currentLevel + 1}"]`);
			if (nextLevel) {
				nextLevel.classList.remove("locked");
				nextLevel.classList.add("unlocked");
			}
		}
	} else {
		showModal(`Derrota contra ${enemy.name}`, {
			confirmText: "Reintentar",
			isConfirmation: false,
		});
	}

	modalAcceptBtn.onclick = () => {
		hideModal();
		battleScreen.style.display = "none";
		mapScreen.style.display = "flex";
		saveToStorage("currentScreen", "map");
	};
};
