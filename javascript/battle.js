import { createCharacterCard, fetchCharactersByName } from "./character.js";
import { loadFromStorage, saveToStorage } from "./storage.js";
import { disableButtons, showBattleText } from "./utils.js";

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
				defending: false,
				statusEffects: [],
				specialUsed: false,
			},
			enemy: {
				character: enemyData,
				currentHp: 100,
				maxHp: 100,
				defending: false,
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
	const battleState = loadFromStorage("battleState");
	battleState.turn++;

	console.log(`\n=== TURNO ${battleState.turn} ===`);
	console.log(`Jugador elige acción: ${playerAction.toUpperCase()}`);

	disableButtons(true);
	processAction("player", playerAction, battleState);

	if (battleState.enemy.currentHp > 0) {
		setTimeout(() => {
			const enemyAction = chooseEnemyAction(battleState);
			console.log(`Enemigo elige acción: ${enemyAction.toUpperCase()}`);
			processAction("enemy", enemyAction, battleState);

			if (battleState.player.currentHp > 0) {
				disableButtons(false);
			}
		}, 1000);
	}

	checkBattleEnd(battleState);
};

const addBattleEffect = (target, action, success = true) => {
	const card = target === "player" ? playerCard : enemyCard;

	card.classList.remove("attack-effect", "defence-effect", "dodge-effect", "special-effect", "miss-effect");

	let effectClass = "";

	if (success) {
		switch (action) {
			case "attack":
				effectClass = "attack-effect";
				break;
			case "defence":
				effectClass = "defence-effect";
				break;
			case "dodge":
				effectClass = "dodge-effect";
				break;
			case "special":
				effectClass = "special-effect";
				break;
		}
	} else {
		card.classList.add("miss-effect");
	}

	if (effectClass) {
		card.classList.add(effectClass);

		setTimeout(() => {
			card.classList.remove(effectClass);
		}, 500);
	}
};

const processAction = (actor, action, battleState) => {
	console.log(`\n[${actor.toUpperCase()}] Procesando acción: ${action}`);
	const target = actor === "player" ? battleState.enemy : battleState.player;

	let damage = 0;
	let message = "";
	let success = true;

	switch (action) {
		case "attack":
			console.log(`Calculando ataque...`);
			const attackResult = calculateAttack(actor, battleState);
			console.log(`Ataque ${attackResult.success ? "ÉXITO" : "FALLO"}`);
			addBattleEffect(actor, action, attackResult.success);

			if (attackResult.success) {
				damage = Math.floor(battleState[actor].character.powerstats.strength * 0.7 + Math.random() * 15);
				console.log(`Daño base calculado: ${damage}HP`);

				if (target.defending) {
					console.log(`El objetivo se está defendiendo...`);
					const defenceResult = calculateDefence(target, damage);
					damage = defenceResult.damage;
					message = defenceResult.message;
					console.log(`Resultado defensa: ${message} (Daño final: ${damage}HP)`);
				} else {
					message = `${actor === "player" ? "Golpeas" : "Enemigo golpea"} por ${damage}HP!`;
					console.log(`Sin defensa - Daño completo: ${damage}HP`);
				}

				target.currentHp = Math.max(0, target.currentHp - damage);
				console.log(`HP objetivo actualizado: ${target.currentHp}/${target.maxHp}`);
			} else {
				message = `${actor === "player" ? "Tu" : "El enemigo"} ataque falla!`;
			}
			break;
		case "dodge":
			console.log(`Calculando esquive...`);
			success = calculateDodge(actor, battleState);
			console.log(`Esquive ${success ? "ÉXITO" : "FALLO"}`);
			addBattleEffect(actor, action, success);
			message = success
				? `${actor === "player" ? "Esquivas" : "Enemigo esquiva"} el ataque!`
				: `${actor === "player" ? "No logras" : "Enemigo no logra"} esquivar!`;
			break;
		case "defence":
			battleState[actor].defending = true;
			console.log(`${actor} activa modo DEFENSA`);
			addBattleEffect(actor, action, true);
			message = `${actor === "player" ? "Te" : "Enemigo se"} prepara para defender!`;
			break;
		case "special":
			damage = actor === "player" ? 35 : 30;
			console.log(`Ataque ESPECIAL - Daño fijo: ${damage}HP`);
			target.currentHp = Math.max(0, target.currentHp - damage);
			addBattleEffect(actor, action, true);
			message = `${actor === "player" ? "Usas" : "Enemigo usa"} habilidad especial! -${damage}HP`;
			console.log(`HP objetivo actualizado: ${target.currentHp}/${target.maxHp}`);
			break;
	}

	updateHealthBars(battleState);
	showBattleText(actor === "player" ? "player" : "enemy", message);
	saveToStorage("battleState", battleState);
	checkBattleEnd(battleState);
};

const calculateAttack = (actor, battleState) => {
	const attacker = actor === "player" ? battleState.player : battleState.enemy;
	const defender = actor === "player" ? battleState.enemy : battleState.player;

	const attackerStats = attacker.character.powerstats;
	const defenderStats = defender.character.powerstats;

	const strength = parseInt(attackerStats.strength ?? attackerStats.Strength) || 0;
	const durability = parseInt(defenderStats.durability ?? defenderStats.Durability) || 0;

	let attackPower = strength + Math.random() * 20;
	let defencePower = durability + Math.random() * 15;

	console.log(
		`[CALCULO ATAQUE] ${actor} (Fuerza: ${attackPower.toFixed(1)}) vs ${
			actor === "player" ? "Enemigo" : "Jugador"
		} (Defensa: ${defencePower.toFixed(1)})`
	);

	return attackPower > defencePower;
};

const calculateDodge = (actor, battleState) => {
	const dodger = battleState[actor];
	const attacker = battleState[actor === "player" ? "enemy" : "player"];

	const dodgeChance = (dodger.character.powerstats.speed * 0.7 + Math.random() * 30) / 100;
	console.log(
		`[CALCULO ESQUIVE] ${actor} (Velocidad: ${dodger.character.powerstats.speed}) - Probabilidad: ${(
			dodgeChance * 100
		).toFixed(1)}%`
	);

	return Math.random() < dodgeChance;
};

const calculateDefence = (defender, incomingDamage) => {
	const defencePower = defender.character.powerstats.durability;
	const blockChance = Math.min(90, defencePower * 0.5);

	console.log(`[CALCULO DEFENSA] Poder defensa: ${defencePower} - Daño entrante: ${incomingDamage}HP`);

	let result = {
		damage: incomingDamage,
		message: "",
	};

	if (Math.random() * 100 < defencePower * 0.25) {
		result.damage = 0;
		result.message = "¡Bloqueo perfecto! No recibe daño";
		console.log("¡BLOQUEO PERFECTO!");
	} else if (Math.random() * 100 < blockChance) {
		const reduction = 0.3 + defencePower / 200;
		result.damage = Math.floor(incomingDamage * (1 - reduction));
		result.message = `¡Defiende! Daño reducido a ${result.damage}HP`;
		console.log(`Defensa exitosa (Reducción: ${(reduction * 100).toFixed(1)}%)`);
	} else {
		result.message = "¡Defensa fallida! Recibe daño completo";
		console.log("DEFENSA FALLIDA");
	}

	defender.defending = false;
	return result;
};

const chooseEnemyAction = (battleState) => {
	const actions = ["attack", "defence", "dodge", "special"];
	const randomIndex = Math.floor(Math.random() * actions.length);
	return actions[randomIndex];
};

export let playerHealthBar, enemyHealthBar;

export const initialBattleUi = () => {
	playerHealthBar = document.querySelector(".bar-ps-player");
	enemyHealthBar = document.querySelector(".bar-ps-enemy");
};

export const resetHealthBars = () => {
	if (playerHealthBar && enemyHealthBar) {
		playerHealthBar.style.width = "100%";
		enemyHealthBar.style.width = "100%";
		playerHealthBar.style.backgroundColor = "green";
		enemyHealthBar.style.backgroundColor = "green";
	}
};

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
