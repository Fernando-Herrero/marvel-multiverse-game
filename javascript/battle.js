import { createCharacterCard, fetchCharactersByName } from "./character.js";
import { battleScreen, player } from "./map.js";
import { clearStorageKey, loadFromStorage, saveToStorage } from "./storage.js";
import { disableButtons, initialBattleUi, showBattleText } from "./utils.js";

const battleText = document.getElementById("battle-text");
const playerCard = document.getElementById("player-battle-card");
const enemyCard = document.getElementById("enemy-battle-card");

export const renderBattleCards = async (enemyName) => {
	console.log("[1] Nombre del enemigo recibido:", enemyName);
	console.log("1. Iniciando renderBattleCards...");

	const existingBattle = loadFromStorage("battleState");
	console.log("2. Estado de batalla existente:", existingBattle);

	const playerData = loadFromStorage("playerCharacter");
	console.log("3. Datos del jugador:", playerData);

	let enemyData;

	if (existingBattle && existingBattle.enemy) {
		enemyData = existingBattle.enemy.character;
		console.log("4. Usando enemigo existente:", enemyData);
		updateHealthBars(existingBattle);
	} else {
		enemyData = await fetchCharactersByName(enemyName);
		console.log("5. Datos del enemigo obtenidos:", enemyData);

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
		console.log("6. Nuevo estado de batalla guardado:", initialBattleState);
	}

	saveToStorage("currentScreen", "battle");
	console.log("7. Pantalla actual establecida como 'battle'");

	console.log("8. Renderizando carta del jugador...");
	renderPlayerCard(playerData);

	console.log("9. Renderizando carta del enemigo...");
	renderEnemyCard(enemyData);

	console.log("10. Configurando botones de batalla...");
	setupBattleActions();

	console.log("--- BATALLA LISTA PARA COMENZAR ---");
	console.log("Estado completo:", loadFromStorage("battleState"));

	// if (existingBattle) {
	// 	restoreBattleState(existingBattle);
	// }
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
	const attackBtn = document.getElementById("attack");
	const defenceBtn = document.getElementById("defence");
	const specialBtn = document.getElementById("special-skill");
	const dodgeBtn = document.getElementById("dodge");

	if (!attackBtn || !defenceBtn || !specialBtn || !dodgeBtn) {
		console.error("¡Botones no encontrados en el DOM!");
		return;
	}

	attackBtn.addEventListener("click", () => {
		console.log("Botón ATTACK pulsado");
		executeAction("attack");
	});

	defenceBtn.addEventListener("click", () => {
		console.log("Botón DEFENCE pulsado");
		executeAction("defence");
	});

	specialBtn.addEventListener("click", () => {
		console.log("Botón SPECIAL pulsado");
		executeAction("special");
	});

	dodgeBtn.addEventListener("click", () => {
		console.log("Botón DODGE pulsado");
		executeAction("dodge");
	});

	console.log("Botones configurados correctamente");
};

const executeAction = (playerAction) => {
	console.log("🔘 Botón pulsado:", playerAction);

	const battleState = loadFromStorage("battleState");
	console.log("🔄 Estado ANTES:", JSON.parse(JSON.stringify(battleState)));

	battleState.turn++;

	disableButtons(true);

	processAction("player", playerAction, battleState);

	setTimeout(() => {
		console.log("🤖 Turno del enemigo (HP actual:", battleState.enemy.currentHp, ")");
		const enemyAction = chooseEnemyAction(battleState);
		processAction("enemy", enemyAction, battleState);
		console.log(processAction());
		disableButtons(false);
	}, 1000);
};

const processAction = (actor, action, battleState) => {
	const target = actor === "player" ? battleState.enemy : battleState.player;
	let damage = 0;

	switch (action) {
		case "attack":
			damage = actor === "player" ? 20 : 15;
			break;
		case "special":
			damage = actor === "player" ? 35 : 30;
			break;
	}

	target.currentHp = Math.max(0, target.currentHp - damage);
	updateHealthBars(battleState);

	showBattleText(
		actor === "player" ? "player" : "enemy",
		`${actor === "player" ? "Usas" : "Enemigo usa"} ${action}! -${damage}HP`
	);

	saveToStorage("battleState", battleState);
	checkBattleEnd(battleState);
};

const chooseEnemyAction = (battleState) => {
	const actions = ["attack", "defence", "dodge", "special"];
	const randomIndex = Math.floor(Math.random() * actions.length);
	return actions[randomIndex];
};

export let playerHealthBar, enemyHealthBar;

export const updateHealthBars = (battleState) => {
	if (!playerHealthBar || !enemyHealthBar) initialBattleUi(); 

	playerHealthBar.style.width = `${battleState.player.currentHp}%`;
	enemyHealthBar.style.width = `${battleState.enemy.currentHp}%`;

	const setHealthBarColor = (healthBar, currentHp) => {
		if (currentHp > 70) {
			healthBar.style.backgroundColor = "green";
		} else if (currentHp > 50) {
			healthBar.style.backgroundColor = "#9ACD32";
		} else if (currentHp > 30) {
			healthBar.style.backgroundColor = "yellow";
		} else if (currentHp > 15) {
			healthBar.style.backgroundColor = "orange";
		} else {
			healthBar.style.backgroundColor = "red";
		}
	};

	setHealthBarColor(playerHealthBar, battleState.player.currentHp);
	setHealthBarColor(enemyHealthBar, battleState.enemy.currentHp);
};

const checkBattleEnd = (battleState) => {
	if (battleState.enemy.currentHp <= 0) {
		showBattleText("player", "¡Has ganado la batalla!");
		setTimeout(() => endBattle(true), 1500);
	} else if (battleState.player.currentHp <= 0) {
		showBattleText("enemy", "¡Has sido derrotado!");
		setTimeout(() => endBattle(false), 1500);
	}
};

const endBattle = (playerWon) => {
	console.log(playerWon ? "Ganaste" : "Perdiste");
};

// const setupBattleActions = () => {
// 	const attackbtn = document.getElementById("attack");
// 	attackbtn.addEventListener("click", () => executeAction("attack"));

// 	const defencebtn = document.getElementById("defence");
// 	defencebtn.addEventListener("click", () => executeAction("defence"));

// 	const specialSkillkbtn = document.getElementById("special-skill");
// 	specialSkillkbtn.addEventListener("click", () => executeAction("special"));

// 	const dodgekbtn = document.getElementById("dodge");
// 	dodgekbtn.addEventListener("click", () => executeAction("dodge"));
// };

// const executeAction = async (playerAction) => {
// 	const battleState = loadFromStorage("battleState");
// 	const { player, enemy } = battleState;

// 	const isPlayerWebbed = player.statusEffects.some((e) => e.type === "webbed");
// 	if (isPlayerWebbed) {
// 		updateBattleUi({
// 			success: false,
// 			message: "You are webbed and cannot act this turn!",
// 			effect: null,
// 		});

// 		const enemyAction = chooseEnemyAction(battleState);
// 		const enemyResult = calculateAction(enemyAction, playerAction, enemyAction, true);
// 		updateBattleUi(enemyResult);

// 		checkBattleEnd();
// 		saveToStorage("battleState", battleState);
// 		return;
// 	}

// 	const isEnemyWebbed = enemy.statusEffects.some((e) => e.type === "webbed");
// 	if (isEnemyWebbed) {
// 		updateBattleUi({
// 			success: false,
// 			message: `${enemy.character.name} is webbed and cannot act this turn!`,
// 			effect: null,
// 		});

// 		const playerResult = calculateAction(player, enemy, playerAction, false);
// 		updateBattleUi(playerResult);

// 		checkBattleEnd();
// 		saveToStorage("battleState", battleState);
// 		return;
// 	}

// 	const enemyAction = chooseEnemyAction(battleState);

// 	const playerResult = calculateAction(player, enemy, playerAction, false);
// 	const enemyResult = calculateAction(enemy, player, enemyAction, true);

// 	handleSpecialInteractions(playerAction, enemyAction, playerResult, enemyResult, battleState);

// 	updateBattleUi(playerResult);
// 	updateBattleUi(enemyResult);

// 	battleState.turn++;

// 	updateStatusEffects(battleState);

// 	checkBattleEnd();
// 	saveToStorage("battleState", battleState);
// };

// const chooseEnemyAction = (battleState) => {
// 	const { enemy, player } = battleState;
// 	const actions = ["attack", "defence", "dodge"];

// 	if ((!enemy.specialUsed && Math.random() < 0.3) || battleState.turn > 2) {
// 		return "special";
// 	}

// 	if (player.currentHp < 30 && Math.random() < 0.7) {
// 		return "attack";
// 	}

// 	if (enemy.currentHp < 40 && Math.random() < 0.6) {
// 		return "defence";
// 	}

// 	const randomIndex = Math.floor(Math.random() * actions.length);
// 	return actions[randomIndex];
// };

// const calculateAction = (attacker, defender, action, isEnemy) => {
// 	switch (action) {
// 		case "attack":
// 			return calculateAttack(attacker, defender, isEnemy);
// 		case "defence":
// 			return calculateDefence(attacker, isEnemy);
// 		case "special":
// 			return calculateSpecialSkill(attacker, defender, isEnemy);
// 		case "dodge":
// 			return calculateDodge(attacker, isEnemy);
// 		default:
// 			return {
// 				success: false,
// 				message: "Invalid action!",
// 				effect: null,
// 			};
// 	}
// };

// const calculateAttack = (attacker, defender, isEnemy) => {
// 	const battleState = loadFromStorage("battleState");
// 	const target = isEnemy ? battleState.player : battleState.enemy;

// 	let attackPower = attacker.character.powerstats.strength + Math.random() * 20;

// 	const rageEffect = attacker.statusEffects.find((e) => e.type === "rage");
// 	if (rageEffect) attackPower *= 1.5;

// 	const strikeEffect = attacker.statusEffects.find((e) => e.type === "doubleStrike");
// 	if (strikeEffect) attackPower *= 2;

// 	const demoralizedEffect = attacker.statusEffects.find((e) => e.type === "demoralized");
// 	if (demoralizedEffect) attackPower *= 0.7;

// 	const shieldEffect = defender.statusEffects.find((e) => e.type === "shield");
// 	if (shieldEffect)
// 		return {
// 			success: false,
// 			message: `${defender.character.name} blocked the attack completely with a shield!`,
// 			effect: null,
// 		};

// 	const defencePower = attacker.character.powerstats.durability + Math.random() * 15;

// 	let result;

// 	if (attackPower > defencePower) {
// 		const damage = Math.max(5, Math.floor(attackPower - defencePower));
// 		defender.currentHp = Math.max(0, defender.currentHp - damage);

// 		result = {
// 			success: true,
// 			damage,
// 			message: `${attacker.character.name} attacks and deals ${damage} damage!`,
// 			effect: "attack",
// 		};
// 	} else {
// 		result = {
// 			success: false,
// 			message: `${defender.character.name} blocked the attack`,
// 			effect: null,
// 		};
// 	}

// 	saveToStorage("battleState", battleState);
// 	return result;
// };

// const calculateDefence = (character, isEnemy) => {
// 	return {
// 		success: true,
// 		message: `${character.character.name} takes a defensive stance`,
// 		effect: "defence",
// 	};
// };

// const calculateDodge = (character) => {
// 	const dodgeChance = character.character.powerstats.speed / 2 + character.character.powerstats.combat / 2;

// 	if (character.character.name === "Black Widow" || character.character.name === "Spider-Man") {
// 		dodgeChance += 30;
// 	}

// 	if (character.character.name === "Loki") {
// 		if (character.statusEffects.some((e) => e.type === "ilusion")) {
// 			dodgeChance *= 1.5;
// 		}
// 	}

// 	const success = Math.random() * 100 <= dodgeChance;

// 	return {
// 		success,
// 		message: success
// 			? `${character.character.name} succesfully dodged!`
// 			: `${character.character.name} failed to dodge`,
// 		effect: "dodge",
// 	};
// };

// const calculateSpecialSkill = (attacker, defender, isEnemy) => {
// 	const battleState = loadFromStorage("battleState");
// 	const target = isEnemy ? battleState.player : battleState.enemy;

// 	if (attacker.specialUsed) {
// 		return {
// 			success: false,
// 			message: `${attacker.character.name} has already used their special ability in this battle!`,
// 			effect: null,
// 		};
// 	}

// 	let damage = 0;
// 	let message = "";
// 	let effect = "special";
// 	let statusEffect = null;

// 	switch (attacker.character.name) {
// 		case "Black Widow":
// 			damage = 40 + attacker.character.powerstats.combat;
// 			target.currentHp = Math.max(0, target.currentHp - damage);
// 			message = `Black Widow executes a Tactical Ambush! Deals ${damage} damage!`;
// 			break;

// 		case "Spider-Man":
// 			statusEffect = { type: "webbed", turnsLeft: 1 };
// 			defender.statusEffects.push(statusEffect);
// 			message = "Spider-Man launches a Paralyzing Web! The enemy cannot attack next turn.";
// 			effect = "status";
// 			break;

// 		case "Iron Man":
// 			damage = 30 + attacker.character.powerstats.intelligence;
// 			target.currentHp = Math.max(0, target.currentHp - damage);
// 			message = `Iron Man fires a Pulse Blast! Deals ${damage} damage ignoring defense.`;
// 			break;

// 		case "Captain America":
// 			statusEffect = { type: "shield", turnsLeft: 2 };
// 			attacker.statusEffects.push(statusEffect);
// 			message = "Captain America executes a Perfect Block! Blocks all damage for two turns.";
// 			break;

// 		case "Thor":
// 			damage = 40 + attacker.character.powerstats.power;
// 			target.currentHp = Math.max(0, target.currentHp - damage);
// 			message = `Thor calls down Divine Thunder! Unavoidable attack deals ${damage} damage.`;
// 			break;

// 		case "Hulk":
// 			statusEffect = { type: "rage", turnsLeft: 2 };
// 			attacker.statusEffects.push(statusEffect);
// 			message = "Hulk enters Uncontrollable Rage! Increased damage for the next two turns.";
// 			break;

// 		case "Thanos":
// 			damage = 40 + attacker.character.powerstats.power;
// 			target.currentHp = Math.max(0, target.currentHp - damage);
// 			message = "Thanos charges up the Infinity Fist! Strikes with devastating force.";
// 			break;

// 		case "Loki":
// 			statusEffect = { type: "illusion", turnsLeft: 1 };
// 			attacker.statusEffects.push(statusEffect);
// 			message = "Loki uses Multiform Illusion! 50% chance to dodge all attacks next turn.";
// 			break;

// 		case "Ultron":
// 			const regen = 30;
// 			attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + regen);
// 			message = `Ultron uses Regen Upgrade! Regenerate 30% HP.`;
// 			break;

// 		case "Red Skull":
// 			statusEffect = { type: "demoralized", turnsLeft: 2 };
// 			defender.statusEffects.push(statusEffect);
// 			message = "Red Skull invokes Terror Domination! Enemy's attack is reduced for 2 turns.";
// 			break;

// 		case "Hela":
// 			damage = 30;
// 			target.currentHp = Math.max(0, target.currentHp - damage);
// 			const heal = 20;
// 			attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + heal);
// 			message = `Hela uses Life Drain! Deals ${damage} damage and heals ${heal} HP.`;
// 			break;

// 		case "Killmonger":
// 			statusEffect = { type: "doubleStrike", turnsLeft: 1 };
// 			attacker.statusEffects.push(statusEffect);
// 			message = "Killmonger unleashes Killer Instinct! May strike twice next turn if the first hits.";
// 			break;

// 		default:
// 			damage = 20 + attacker.character.powerstats.strength;
// 			target.currentHp = Math.max(0, target.currentHp - damage);
// 			message = `${attacker.character.name} uses a basic enhanced attack! Deals ${damage} damage.`;
// 			break;
// 	}

// 	attacker.specialUsed = true;
// 	saveToStorage("battleState", battleState);

// 	return {
// 		success: true,
// 		message,
// 		effect,
// 		damage: damage || 0,
// 		statusEffect,
// 	};
// };

// const handleSpecialInteractions = (playerAction, enemyAction, playerResult, enemyResult, battleState) => {
// 	if (playerAction === "defence" && enemyAction === "special") {
// 		const enemyChar = battleState.enemy.character.name;
// 		if (enemyChar === "Iron Man" || enemyChar === "Thor") {
// 			(playerResult.success = false),
// 				(playerResult.message = `${enemyChar}'s special attack pierces through defense!`);
// 		}
// 	}

// 	if (enemyAction === "defence" && playerAction === "special") {
// 		const playerChar = battleState.player.character.name;
// 		if (playerChar === "Iron Man" || playerChar === "Thor") {
// 			enemyResult.success = false;
// 			enemyResult.message = `${playerChar}'s special attack pierces through defense!`;
// 		}
// 	}

// 	if (playerAction === "dodge" && enemyAction === "special") {
// 		const enemyChar = battleState.enemy.character.name;
// 		if (enemyChar === "Thor") {
// 			playerResult.success = false;
// 			playerResult.message = "Thor's divine thunder cannot be dodged!";
// 		}
// 	}

// 	if (enemyAction === "dodge" && playerAction === "special") {
// 		const playerChar = battleState.player.character.name;
// 		if (playerChar === "Thor") {
// 			enemyResult.success = false;
// 			enemyResult.message = "Thor's divine thunder cannot be dodged!";
// 		}
// 	}
// };

// const updateStatusEffects = (battleState) => {
// 	[battleState.player, battleState.enemy].forEach((character) => {
// 		character.statusEffects.forEach((effect) => effect.turnsLeft--);

// 		character.statusEffects = character.statusEffects.filter((effect) => effect.turnsLeft > 0);
// 	});
// };

// const updateBattleUi = ({ success, message, effect, damage }) => {
// 	const battleState = loadFromStorage("battleState");
// 	battleText.innerHTML += `<p>${message}</p>`;
// 	playerHealthBar.style.width = `${battleState.player.currentHp}%`;
// 	enemyHealthBar.style.width = `${battleState.enemy.currentHp}%`;

// 	playerCard.classList.remove("attack-effect", "defence-effect", "dodge-effect", "special-effect");
// 	enemyCard.classList.remove("attack-effect", "defence-effect", "dodge-effect", "special-effect");

// 	if (effect) {
// 		const targetCard =
// 			effect === "defence"
// 				? message.includes(battleState.player.character.name)
// 					? playerCard
// 					: enemyCard
// 				: message.includes(battleState.player.character.name)
// 				? playerCard
// 				: enemyCard;
// 		targetCard.classList.add(`${effect}-effect`);

// 		setTimeout(() => {
// 			targetCard.classList.remove(`${effect}-effect`);
// 		}, 1000);
// 	}
// };
// export const restoreBattleState = (battleState) => {
// 	// Validación más exhaustiva del estado de batalla
// 	if (
// 		!battleState ||
// 		typeof battleState !== "object" ||
// 		!battleState.player ||
// 		!battleState.enemy ||
// 		typeof battleState.player.currentHp !== "number" ||
// 		typeof battleState.enemy.currentHp !== "number"
// 	) {
// 		console.error("Invalid battle state structure:", battleState);

// 		// Crear un estado de batalla por defecto si es inválido
// 		const playerData = loadFromStorage("playerCharacter");
// 		const enemyName = battleState?.enemy?.character?.name || "Default Enemy";

// 		if (playerData) {
// 			const defaultBattleState = {
// 				player: {
// 					character: playerData,
// 					currentHp: 100,
// 					maxHp: 100,
// 					statusEffects: [],
// 					specialUsed: false,
// 				},
// 				enemy: {
// 					character: {
// 						name: enemyName,
// 						powerstats: { strength: 50, durability: 50, speed: 50, combat: 50 },
// 						imageUrl: "default_image.jpg",
// 					},
// 					currentHp: 100,
// 					maxHp: 100,
// 					statusEffects: [],
// 					specialUsed: false,
// 				},
// 				turn: 0,
// 				currentLevel: loadFromStorage("currentLevel") || 1,
// 			};

// 			saveToStorage("battleState", defaultBattleState);
// 			battleState = defaultBattleState;
// 		} else {
// 			console.error("Cannot restore battle - no player data available");
// 			return false;
// 		}
// 	}

// 	// Restaurar barras de salud con valores seguros
// 	const playerHp = Math.max(0, Math.min(100, battleState.player.currentHp));
// 	const enemyHp = Math.max(0, Math.min(100, battleState.enemy.currentHp));

// 	playerHealthBar.style.width = `${playerHp}%`;
// 	enemyHealthBar.style.width = `${enemyHp}%`;

// 	// Restaurar botón de habilidad especial
// 	const specialBtn = document.getElementById("special-skill");
// 	if (specialBtn) {
// 		const specialUsed = !!battleState.player.specialUsed;
// 		specialBtn.disabled = specialUsed;
// 		specialBtn.classList.toggle("disabled", specialUsed);
// 	}

// 	// Limpiar efectos antiguos
// 	document.querySelectorAll(".status-effect").forEach((el) => el.remove());

// 	// Restaurar efectos de estado del jugador
// 	const playerEffects = Array.isArray(battleState.player.statusEffects) ? battleState.player.statusEffects : [];

// 	playerEffects.forEach((effect) => {
// 		if (effect && effect.type) {
// 			const effectElement = document.createElement("div");
// 			effectElement.className = `status-effect ${effect.type}`;
// 			effectElement.textContent = effect.type.toUpperCase();
// 			effectElement.title = getStatusEffectDescription(effect.type);
// 			const contentContainer = playerCard.querySelector(".player-battle-card-content");
// 			if (contentContainer) contentContainer.appendChild(effectElement);
// 		}
// 	});

// 	// Restaurar efectos de estado del enemigo
// 	const enemyEffects = Array.isArray(battleState.enemy.statusEffects) ? battleState.enemy.statusEffects : [];

// 	enemyEffects.forEach((effect) => {
// 		if (effect && effect.type) {
// 			const effectElement = document.createElement("div");
// 			effectElement.className = `status-effect ${effect.type}`;
// 			effectElement.textContent = effect.type.toUpperCase();
// 			effectElement.title = getStatusEffectDescription(effect.type);
// 			const enemyContainer = enemyCard.querySelector(".card-character");
// 			if (enemyContainer) enemyContainer.appendChild(effectElement);
// 		}
// 	});

// 	// Manejar estado de habilidad especial del enemigo
// 	if (enemyCard) {
// 		enemyCard.classList.toggle("special-used", !!battleState.enemy.specialUsed);
// 	}

// 	return true;
// };

// const getStatusEffectDescription = (type) => {
// 	const descriptions = {
// 		webbed: "Cannot act for X turns",
// 		rage: "Damage increased by 50%",
// 		shield: "Blocks all damage",
// 		demoralized: "Attack reduced by 30%",
// 		doubleStrike: "Next attack may hit twice",
// 		illusion: "Dodge chance increased",
// 	};
// 	return descriptions[type] || "Status effect";
// };

// const checkBattleEnd = () => {
// 	const battleState = loadFromStorage("battleState");

// 	if (!battleState) return false;

// 	if (battleState.player.currentHp <= 0) {
// 		endBattle(false);
// 		return true;
// 	}
// 	if (battleState.enemy.currentHp <= 0) {
// 		endBattle(true);
// 		return true;
// 	}
// 	return false;
// };

// const endBattle = (playerWon) => {
// 	if (playerWon) {
// 		battleText.innerHTML += `<p class="victory">You defeated the enemy!</p>`;

// 		const currentLevel = loadFromStorage("currentLevel") || 1;
// 		saveToStorage("currentLevel", currentLevel + 1);
// 	} else {
// 		battleText.innerHTML += `<p class="defeat">You were defeated!</p>`;
// 	}

// 	document.querySelectorAll(".battle-action").forEach((btn) => {
// 		btn.disabled = true;
// 	});

// 	const continueBtn = document.createElement("button");
// 	continueBtn.id = "continue-btn";
// 	continueBtn.textContent = "Continue";
// 	continueBtn.addEventListener("click", () => {
// 		battleScreen.style.display = "none";
// 	});

// 	document.querySelector(".battle-actions").appendChild(continueBtn);

// 	clearStorageKey("battleState");
// };
