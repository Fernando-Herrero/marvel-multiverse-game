import { createCharacterCard, fetchCharactersByName } from "./character.js";
import { loadMapState, mapScreen } from "./index.js";
import { charactersSelect, inputUserName } from "./login.js";
import { battleScreen, enemiesInLevel, levelEnemies, movePlayerToLevel, showLeveleInfo } from "./map.js";
import { clearStorageKey, loadFromStorage, saveToStorage } from "./storage.js";
import { disableButtons, hideModal, showBattleText, showBriefing } from "./utils.js";

const playerCard = document.getElementById("player-battle-card");
const enemyCard = document.getElementById("enemy-battle-card");

export const renderBattleCards = async (enemyName) => {
	console.clear();

	console.log("[1] Nombre del enemigo recibido:", enemyName);
	console.log("1. Iniciando renderBattleCards...");

	let existingBattle = loadFromStorage("battleState");
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
			winner: null,
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

	resetHealthBars();
	console.log("10. Configurando botones de batalla...");
	setupBattleActions();

	const specialBtn = document.getElementById("special-skill");
	if (specialBtn) {
		specialBtn.disabled = false;
	}

	console.log("--- BATALLA LISTA PARA COMENZAR ---");
	console.log("Estado completo:", loadFromStorage("battleState"));
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

const buttonsName = ["attack", "defence", "special-skill", "dodge"];

const createButtonAction = () => {
	const buttonBattleContainer = document.getElementById("buttons-battle");
	buttonBattleContainer.innerHTML = "";

	buttonsName.forEach((name) => {
		const button = document.createElement("button");
		button.id = name;
		button.textContent = name.slice(0, 3).charAt(0).toUpperCase() + name.slice(1, 3).toLowerCase();

		buttonBattleContainer.appendChild(button);
	});
};

const setupBattleActions = () => {
	createButtonAction();
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

	const enemyAction = chooseEnemyAction(battleState);
	console.log(`Enemigo elige acción: ${enemyAction.toUpperCase()}`);

	resolveActions(playerAction, enemyAction, battleState);

	checkBattleEnd(battleState);
};

const logBattleState = (battleState, playerAction, enemyAction) => {
	console.log(`\n=== POST-ACTION STATE (Turn ${battleState.turn}) ===`);
	console.log(`Actions: Player=${playerAction} | Enemy=${enemyAction}`);

	// Log del jugador
	console.log("\n[PLAYER]");
	console.log(`- HP: ${battleState.player.currentHp}/${battleState.player.maxHp}`);
	console.log(`- Special Used: ${battleState.player.specialUsed}`);
	console.log(
		"- Status Effects:",
		battleState.player.statusEffects.map((e) => `${e.type} (${e.turnsLeft}t)`).join(", ") || "None"
	);

	// Log del enemigo
	console.log("\n[ENEMY]");
	console.log(`- HP: ${battleState.enemy.currentHp}/${battleState.enemy.maxHp}`);
	console.log(`- Special Used: ${battleState.enemy.specialUsed}`);
	console.log(
		"- Status Effects:",
		battleState.enemy.statusEffects.map((e) => `${e.type} (${e.turnsLeft}t)`).join(", ") || "None"
	);

	console.log("====================================\n");
};

const resolveActions = (playerAction, enemyAction, battleState) => {
	console.log(`[DEBUG] Resolviendo acciones: Jugador=${playerAction}, Enemigo=${enemyAction}`);

	switch (playerAction) {
		case "attack":
			switch (enemyAction) {
				case "attack":
					handleBothAttack(battleState);
					break;
				case "defence":
					handleAttackVsDefence(battleState, "player", "enemy");
					break;
				case "dodge":
					handleAttackVsDodge(battleState, "player", "enemy");
					break;
				case "special":
					handleAttackAndSpecial(battleState, "enemy", "player");
					break;
			}
			break;

		case "defence":
			switch (enemyAction) {
				case "attack":
					handleAttackVsDefence(battleState, "enemy", "player");
					break;
				case "defence":
					addBattleEffect("player", "defence");
					addBattleEffect("enemy", "defence");
					showBattleText("player", "You block... but so does the enemy!");
					showBattleText("enemy", "The enemy blocks... but you do too!");
					break;
				case "dodge":
					addBattleEffect("player", "defence");
					addBattleEffect("enemy", "dodge");
					showBattleText("player", "You defend... but the enemy dodges!");
					showBattleText("enemy", "You dodge... but the player just defends!");
					break;
				case "special":
					handleSpecialVsDefence(battleState, "enemy", "player");
					break;
			}
			break;

		case "dodge":
			switch (enemyAction) {
				case "attack":
					handleAttackVsDodge(battleState, "enemy", "player");
					break;
				case "defence":
					showBattleText("player", "You dodge, but the enemy only defends — nothing happens.");
					showBattleText("enemy", "You defend, but the player just dodges — nothing happens.");
					break;
				case "dodge":
					addBattleEffect("player", "dodge");
					addBattleEffect("enemy", "dodge");
					showBattleText("player", "You both dodge cautiously, waiting for an attack that never comes.");
					showBattleText("enemy", "You both dodge cautiously, waiting for an attack that never comes.");
					break;
				case "special":
					handleSpecialVsDodge(battleState, "enemy", "player");
					break;
			}
			break;

		case "special":
			console.log("[DEBUG] Jugador usa SPECIAL SKILL");
			switch (enemyAction) {
				case "attack":
					console.log("[DEBUG] Caso: SPECIAL vs ATTACK");
					handleAttackAndSpecial(battleState, "player", "enemy");
					break;
				case "defence":
					handleSpecialVsDefence(battleState, "player", "enemy");
					break;
				case "dodge":
					handleSpecialVsDodge(battleState, "player", "enemy");
					break;
				case "special":
					handleSpecialVsSpecial(battleState);
					break;
			}
			break;
	}

	logBattleState(battleState, playerAction, enemyAction);
	updateHealthBars(battleState);
	saveToStorage("battleState", battleState);
};

const handleBothAttack = (battleState) => {
	const playerRawDamage = calculateDamage(battleState.player, battleState.enemy);
	const enemyRawDamage = calculateDamage(battleState.enemy, battleState.player);

	let playerFinalDamage = playerRawDamage;
	let enemyFinalDamage = enemyRawDamage;

	if (processStatusEffect("player", battleState.player, "webbed")) {
		playerFinalDamage = 0;
	}
	if (processStatusEffect("enemy", battleState.enemy, "webbed")) {
		enemyFinalDamage = 0;
	}

	if (processStatusEffect("player", battleState.player, "shield")) {
		enemyFinalDamage = 0;
		setTimeout(() => {
			addBattleEffect("enemy", "miss-effect");
		}, 2000);
	}
	if (processStatusEffect("enemy", battleState.enemy, "shield")) {
		playerFinalDamage = 0;
		setTimeout(() => {
			addBattleEffect("player", "miss-effect");
		}, 2000);
	}

	if (processStatusEffect("player", battleState.player, "rage")) {
		playerFinalDamage += 10;
	}
	if (processStatusEffect("enemy", battleState.enemy, "rage")) {
		enemyFinalDamage += 10;
	}

	if (processStatusEffect("player", battleState.player, "illusion")) {
		if (Math.random() < 0.9) {
			enemyFinalDamage = 0;
			setTimeout(() => {
				addBattleEffect("enemy", "miss-effect");
			}, 2000);
		}
	}
	if (processStatusEffect("enemy", battleState.enemy, "illusion")) {
		if (Math.random() < 0.9) {
			playerFinalDamage = 0;
			setTimeout(() => {
				addBattleEffect("player", "miss-effect");
			}, 2000);
		}
	}

	if (processStatusEffect("player", battleState.player, "demoralized")) {
		enemyFinalDamage -= 10;
	}
	if (processStatusEffect("enemy", battleState.enemy, "demoralized")) {
		playerFinalDamage -= 10;
	}

	if (processStatusEffect("player", battleState.player, "doubleStrike")) {
		playerFinalDamage += 20;
	}
	if (processStatusEffect("enemy", battleState.enemy, "doubleStrike")) {
		enemyFinalDamage += 20;
	}

	if (playerFinalDamage > 0) {
		battleState.enemy.currentHp = Math.max(0, battleState.enemy.currentHp - playerFinalDamage);
		addBattleEffect("player", "attack");
		showBattleText("player", `You attack dealing ${playerFinalDamage} HP to the enemy!`);
	} else {
		addBattleEffect("enemy", "miss-effect");
		showBattleText("player", "Your attack missed or was blocked!");
	}

	if (enemyFinalDamage > 0) {
		battleState.player.currentHp = Math.max(0, battleState.player.currentHp - enemyFinalDamage);
		addBattleEffect("enemy", "attack");
		showBattleText("enemy", `Attacks and deals ${enemyFinalDamage} HP to the player!`);
	} else {
		addBattleEffect("player", "miss-effect");
		showBattleText("enemy", "The enemy's attack missed or was blocked!");
	}
};

const handleAttackVsDefence = (battleState, attacker, defender) => {
	if (processStatusEffect(attacker, battleState[attacker], "webbed")) {
		setTimeout(() => {
			addBattleEffect(attacker, "miss-effect");
		}, 2000);
		return;
	}

	let damage = calculateDamage(battleState[attacker], battleState[defender]);

	if (processStatusEffect(attacker, battleState[attacker], "rage")) damage += 10;
	if (processStatusEffect(attacker, battleState[attacker], "demoralized")) damage -= 10;
	if (processStatusEffect(attacker, battleState[attacker], "doubleStrike")) damage += 20;

	if (processStatusEffect(defender, battleState[defender], "illusion")) {
		const dodgeChance = Math.random();
		if (dodgeChance > 0.9) {
			damage = 0;
			setTimeout(() => {
				addBattleEffect(attacker, "miss-effect");
			}, 2000);
		}
	}

	if (processStatusEffect(defender, battleState[defender], "webbed")) {
		battleState[defender].currentHp = Math.max(0, battleState[defender].currentHp - damage);
		setTimeout(() => {
			addBattleEffect(defender, "miss-effect");
		}, 2000);
		return;
	}

	if (processStatusEffect(defender, battleState[defender], "shield")) {
		setTimeout(() => {
			addBattleEffect(attacker, "miss-effect");
		}, 2000);
		return;
	}

	const defenceEffectiveness = 0.3 + Math.random() * 0.4;
	const reducedDamage = Math.max(1, Math.floor(damage * defenceEffectiveness));
	battleState[defender].currentHp = Math.max(0, battleState[defender].currentHp - reducedDamage);

	const damageRatio = reducedDamage / damage;
	let defenceQuality;
	if (damageRatio >= 0.7) defenceQuality = "poor";
	else if (damageRatio >= 0.4) defenceQuality = "good";
	else defenceQuality = "excellent";

	const attackerMessages = {
		excellent: "Your attack was almost completely blocked!",
		good: "Your attack was partially blocked!",
		poor: "Your attack penetrated their defense!",
	};

	const defenderMessages = {
		excellent: `Perfect defense! Only ${reducedDamage} damage taken.`,
		good: `Good defense! You took ${reducedDamage} damage.`,
		poor: `Weak defense! You took ${reducedDamage} damage.`,
	};

	addBattleEffect(attacker, "attack");
	addBattleEffect(defender, "defence");

	showBattleText(attacker, attackerMessages[defenceQuality]);
	showBattleText(defender, defenderMessages[defenceQuality]);

	setTimeout(() => {
		if (defenceQuality === "poor") {
			addBattleEffect(defender, "miss-effect");
			showBattleText(defender, "Defense failed completely!", "critical");
		} else if (defenceQuality === "excellent") {
			addBattleEffect(attacker, "miss-effect");
			showBattleText(attacker, "Attack completely neutralized!", "blocked");
		}
	}, 600);
};

const handleAttackVsDodge = (battleState, attacker, dodger) => {
	const attackerStats = battleState[attacker].character.powerstats;
	const dodgerStats = battleState[dodger].character.powerstats;

	const getStat = (stats, name) => {
		const lowerName = name.toLowerCase();
		for (const key in stats) {
			if (key.toLowerCase() === lowerName) {
				return parseInt(stats[key]) || 0;
			}
		}
		return 0;
	};

	const dodgeSpeed = getStat(dodgerStats, "speed");
	const dodgeCombat = getStat(dodgerStats, "combat");
	const attackerSpeed = getStat(attackerStats, "speed");
	const attackerIntelligence = getStat(attackerStats, "intelligence");

	const dodgeChance = Math.max(
		5,
		Math.min(95, dodgeSpeed * 0.6 + dodgeCombat * 0.4 - (attackerSpeed * 0.4 + attackerIntelligence * 0.6))
	);

	const randomRoll = Math.random() * 100;

	if (randomRoll < dodgeChance) {
		let damage = calculateDamage(battleState[attacker], battleState[dodger]);

		if (processStatusEffect(dodger, battleState[dodger], "webbed")) {
			battleState[dodger].currentHp = Math.max(0, battleState[dodger].currentHp - damage);
			setTimeout(() => {
				addBattleEffect(dodger, "miss-effect");
			}, 2000);
			return;
		}

		if (processStatusEffect(dodger, battleState[dodger], "shield")) {
			damage = 0;
			setTimeout(() => {
				addBattleEffect(attacker, "miss-effect");
			}, 2000);
			return;
		}

		if (processStatusEffect(dodger, battleState[dodger], "illusion")) {
			if (Math.random() < 0.9) {
				damage = 0;
				setTimeout(() => {
					addBattleEffect(attacker, "miss-effect");
				}, 2000);
			}
			return;
		}

		addBattleEffect(dodger, "dodge");
		addBattleEffect(attacker, "miss-effect");
		showBattleText(dodger, "Dodged the attack!");
		showBattleText(attacker, "Your attack missed!");
		return;
	}

	if (processStatusEffect(attacker, battleState[attacker], "webbed")) {
		setTimeout(() => {
			addBattleEffect(attacker, "miss-effect");
		}, 2000);
		return;
	}

	let damage = calculateDamage(battleState[attacker], battleState[dodger]);

	if (processStatusEffect(attacker, battleState[attacker], "rage")) damage += 10;
	if (processStatusEffect(attacker, battleState[attacker], "doubleStrike")) damage += 20;
	if (processStatusEffect(attacker, battleState[attacker], "demoralized")) damage -= 10;

	if (damage > 0) {
		battleState[dodger].currentHp = Math.max(0, battleState[dodger].currentHp - damage);
		addBattleEffect(attacker, "attack");
		addBattleEffect(dodger, "miss-effect");
		showBattleText(attacker, `You hit for ${damage} damage!`);
		showBattleText(dodger, `You tried to dodge but missed and got hit for ${damage} damage!`);
	}
};

const handleAttackAndSpecial = (battleState, specialUser, attacker) => {
	console.log(`[DEBUG] handleAttackAndSpecial: specialUser=${specialUser}, attacker=${attacker}`);

	if (processStatusEffect(specialUser, battleState[specialUser], "webbed")) {
		console.log(`[DEBUG] ${specialUser} está webbed y no puede actuar`);

		setTimeout(() => {
			addBattleEffect(specialUser, "miss-effect");
		}, 2000);
		battleState[specialUser].specialUsed = true;
		return;
	}
	if (processStatusEffect(specialUser, battleState[attacker], "webbed")) {
		setTimeout(() => {
			addBattleEffect(attacker, "miss-effect");
		}, 2000);
		return;
	}

	const specialResult = calculateSpecialSkill(battleState[specialUser], battleState[attacker]);
	console.log("[DEBUG] Resultado del especial:", specialResult);

	if (specialResult.statusEffect) {
		battleState[attacker].statusEffects.push(specialResult.statusEffect);
	}

	if (specialResult.message) {
		console.log(`[DEBUG] Mensaje especial: ${specialResult.message}`);

		showBattleText(specialUser, specialResult.message);
	} else {
		showBattleText(specialUser, `You used a special move!`);
	}

	if (specialResult.heal > 0) {
		console.log(`[DEBUG] ${specialUser} se cura ${specialResult.heal} HP`);

		battleState[specialUser].currentHp = Math.min(
			battleState[specialUser].maxHp,
			battleState[specialUser].currentHp + specialResult.heal
		);
	}

	if (processStatusEffect(attacker, battleState[attacker], "illusion")) {
		if (Math.random() < 0.9) {
			setTimeout(() => {
				addBattleEffect(specialUser, "miss-effect");
			}, 2000);
			return;
		} else {
			battleState[attacker].currentHp = Math.max(0, battleState[attacker].currentHp - specialResult.damage);
			battleState[specialUser].specialUsed = true;
		}
	}

	if (specialResult.damage && specialResult.damage > 0) {
		console.log(`[DEBUG] ${specialUser} inflige ${specialResult.damage} de daño a ${attacker}`);

		if (!processStatusEffect(attacker, battleState[attacker], "shield")) {
			battleState[attacker].currentHp = Math.max(0, battleState[attacker].currentHp - specialResult.damage);
			battleState[specialUser].specialUsed = true;
		} else {
			specialResult.damage = 0;
			setTimeout(() => {
				addBattleEffect(attacker, "miss-effect");
			}, 2000);
		}
	}

	if (battleState[attacker].currentHp <= 0) {
		showBattleText(attacker, "has been defeated!");
		return;
	}

	let attackDamage = calculateDamage(battleState[attacker], battleState[specialUser]);

	if (processStatusEffect(attacker, battleState[attacker], "demoralized")) attackDamage -= 10;
	if (processStatusEffect(attacker, battleState[attacker], "doubleStrike")) attackDamage += 20;
	if (processStatusEffect(attacker, battleState[attacker], "rage")) attackDamage += 10;

	if (!processStatusEffect(specialUser, battleState[specialUser], "shield")) {
		battleState[specialUser].currentHp = Math.max(0, battleState[specialUser].currentHp - attackDamage);
	} else {
		attackDamage = 0;
		setTimeout(() => {
			addBattleEffect(attacker, "miss-effect");
		}, 2000);
	}

	if (attackDamage > 0) {
		showBattleText(attacker, `${battleState[attacker].character.name} strikes for ${attackDamage} damage!`);
	} else {
		showBattleText(attacker, `${battleState[attacker].character.name} attacks, but it has no effect...`);
		setTimeout(() => {
			addBattleEffect(attacker, "miss-effect");
		}, 2000);
	}
};

const handleSpecialVsDefence = (battleState, specialUser, defender) => {
	if (Math.random() < 0.05) {
		setTimeout(() => {
			addBattleEffect(specialUser, "miss-effect");
		}, 2000);
		addBattleEffect(defender, "defence");
		showBattleText(
			specialUser,
			`${battleState[specialUser].character.name} tried to use a special move... but incredible missed!`
		);
		showBattleText(
			defender,
			`${battleState[defender].character.name} avoided the special attack! Incredible luck!`
		);
		battleState[specialUser].specialUsed = true;
		return;
	}

	if (processStatusEffect(specialUser, battleState[specialUser], "webbed")) {
		setTimeout(() => {
			addBattleEffect(specialUser, "miss-effect");
		}, 2000);
		battleState[specialUser].specialUsed = true;
		return;
	}
	const specialResult = calculateSpecialSkill(battleState[specialUser], battleState[defender]);

	if (specialResult.statusEffect) {
		battleState[defender].statusEffects.push(specialResult.statusEffect);
		console.log(`[DEBUG] Efecto aplicado a ${defender}:`, specialResult.statusEffect);
	}

	if (processStatusEffect(specialUser, battleState[specialUser], "webbed")) {
		setTimeout(() => {
			addBattleEffect(specialUser, "miss-effect");
		}, 2000);
		battleState[specialUser].specialUsed = true;
		return;
	}

	if (specialResult.message) {
		showBattleText(specialUser, specialResult.message);
	} else {
		showBattleText(specialUser, `${battleState[specialUser].character.name} used a special attack!`);
	}

	if (specialResult.heal && specialResult.heal > 0) {
		battleState[specialUser].currentHp = Math.min(
			battleState[specialUser].maxHp,
			battleState[specialUser].currentHp + specialResult.heal
		);
	}

	if (processStatusEffect(defender, battleState[defender], "webbed")) {
		battleState[defender].currentHp = Math.max(0, battleState[defender].currentHp - specialResult.damage);
		setTimeout(() => {
			addBattleEffect(defender, "miss-effect");
		}, 2000);
		battleState[specialUser].specialUsed = true;
		return;
	}

	if (processStatusEffect(specialUser, battleState[specialUser], "demoralized"))
		specialResult.damage = Math.max(0, specialResult.damage - 10);

	if (processStatusEffect(defender, battleState[defender], "shield")) {
		specialResult.damage = 0;
		setTimeout(() => {
			addBattleEffect(specialUser, "miss-effect");
		}, 2000);
		battleState[specialUser].specialUsed = true;
		return;
	}
	if (processStatusEffect(defender, battleState[defender], "illusion")) {
		if (Math.random() < 0.9) {
			specialResult.damage = 0;
			setTimeout(() => {
				addBattleEffect(specialUser, "miss-effect");
			}, 2000);
		}
		showBattleText(defender, `${battleState[defender].character.name} dodged the special attack!`);
		battleState[specialUser].specialUsed = true;
		return;
	}

	if (specialResult.damage > 0) {
		battleState[defender].currentHp = Math.max(0, battleState[defender].currentHp - specialResult.damage);
		addBattleEffect(specialUser, "special");
		showBattleText(
			defender,
			`${battleState[defender].character.name} took ${specialResult.damage} special damage.`
		);
	} else {
		showBattleText(defender, `${battleState[defender].character.name} ignores the attack.`);
		battleState[defender].statusEffects.push(specialResult.statusEffect);
	}

	battleState[specialUser].specialUsed = true;
};

const handleSpecialVsDodge = (battleState, specialUser, dodger) => {
	if (Math.random() < 0.05) {
		setTimeout(() => addBattleEffect(specialUser, "miss-effect"), 2000);
		addBattleEffect(dodger, "dodge");
		showBattleText(
			specialUser,
			`${battleState[specialUser].character.name} tried to use a special move... but missed!`
		);
		showBattleText(dodger, `${battleState[dodger].character.name} dodged the special attack! Incredible reflexes!`);
		battleState[specialUser].specialUsed = true;
		return;
	}

	if (processStatusEffect(specialUser, battleState[specialUser], "webbed")) {
		setTimeout(() => addBattleEffect(specialUser, "miss-effect"), 2000);
		battleState[specialUser].specialUsed = true;
		return;
	}

	const specialResult = calculateSpecialSkill(battleState[specialUser], battleState[dodger]);

	if (specialResult.statusEffect) {
		battleState[dodger].statusEffects.push(specialResult.statusEffect);
		console.log(`[DEBUG] Efecto aplicado a ${dodger}:`, specialResult.statusEffect);
	}

	if (specialResult.message) {
		showBattleText(specialUser, specialResult.message);
	} else {
		showBattleText(specialUser, `${battleState[specialUser].character.name} used a special attack!`);
	}

	if (specialResult.heal && specialResult.heal > 0) {
		battleState[specialUser].currentHp = Math.min(
			battleState[specialUser].maxHp,
			battleState[specialUser].currentHp + specialResult.heal
		);
	}

	if (processStatusEffect(dodger, battleState[dodger], "webbed")) {
		battleState[dodger].currentHp = Math.max(0, battleState[dodger].currentHp - specialResult.damage);
		setTimeout(() => addBattleEffect(dodger, "miss-effect"), 2000);
		battleState[specialUser].specialUsed = true;
		return;
	}

	if (processStatusEffect(specialUser, battleState[specialUser], "demoralized"))
		specialResult.damage = Math.max(0, specialResult.damage - 10);

	if (processStatusEffect(dodger, battleState[dodger], "shield")) {
		specialResult.damage = 0;
		setTimeout(() => addBattleEffect(specialUser, "miss-effect"), 2000);
		battleState[specialUser].specialUsed = true;
		return;
	}

	if (processStatusEffect(dodger, battleState[dodger], "illusion")) {
		if (Math.random() < 0.9) {
			specialResult.damage = 0;
			setTimeout(() => addBattleEffect(specialUser, "miss-effect"), 2000);
			showBattleText(dodger, `${battleState[dodger].character.name} dodged the special attack by illusion!`);
			battleState[specialUser].specialUsed = true;
			return;
		}
	}

	battleState[dodger].currentHp = Math.max(0, battleState[dodger].currentHp - specialResult.damage);
	addBattleEffect(specialUser, "special");
	setTimeout(() => addBattleEffect(dodger, "miss-effect"), 2000);

	if (specialResult.damage > 0) {
		showBattleText(dodger, `${battleState[dodger].character.name} took ${specialResult.damage} special damage.`);
	} else {
		showBattleText(dodger, `${battleState[dodger].character.name} made a dodge!.`);
	}

	battleState[specialUser].specialUsed = true;
};

const handleSpecialVsSpecial = (battleState) => {
	const player = battleState.player;
	const enemy = battleState.enemy;

	const playerSpecial = calculateSpecialSkill(player, enemy);
	const enemySpecial = calculateSpecialSkill(enemy, player);

	if (playerSpecial.statusEffect) {
		enemy.statusEffects.push(playerSpecial.statusEffect);
	}

	if (enemySpecial.statusEffect) {
		player.statusEffects.push(enemySpecial.statusEffect);
	}

	if (playerSpecial.message) {
		showBattleText("player", playerSpecial.message);
	} else {
		showBattleText("player", `${player.character.name} used a special attack!`);
	}
	if (enemySpecial.message) {
		showBattleText("enemy", enemySpecial.message);
	} else {
		showBattleText("enemy", `${enemy.character.name} used a special attack!`);
	}

	if (playerSpecial.heal && playerSpecial.heal > 0) {
		player.currentHp = Math.min(player.maxHp, player.currentHp + playerSpecial.heal);
	}
	if (enemySpecial.heal && enemySpecial.heal > 0) {
		enemy.currentHp = Math.min(enemy.maxHp, enemy.currentHp + enemySpecial.heal);
	}

	enemy.currentHp = Math.max(0, enemy.currentHp - playerSpecial.damage);
	player.currentHp = Math.max(0, player.currentHp - enemySpecial.damage);

	addBattleEffect("player", "special");
	addBattleEffect("enemy", "special");

	battleState.player.specialUsed = true;
	battleState.enemy.specialUsed = true;
};

const calculateDamage = (attacker, defender) => {
	const attackerStats = attacker.character.powerstats;
	const defenderStats = defender.character.powerstats;

	const getStat = (stats, name) => {
		const lowerName = name.toLowerCase();
		for (const key in stats) {
			if (key.toLowerCase() === lowerName) {
				return parseInt(stats[key]) || 0;
			}
		}
		return 0;
	};

	const strength = getStat(attackerStats, "strength");
	const speed = getStat(attackerStats, "speed");
	const intelligence = getStat(attackerStats, "intelligence");
	const durability = getStat(defenderStats, "durability");
	const combat = getStat(defenderStats, "combat");

	const attackPower = strength * 0.6 + speed * 0.25 + intelligence * 0.15;
	const defensePower = durability * 0.7 + combat * 0.3;

	const randomFactor = 0.8 + Math.random() * 0.4;
	let damage = (attackPower - defensePower / 2) * randomFactor;

	if (attacker.character.name === "Captain America") {
		damage += 30;
	}

	damage = Math.max(1, Math.min(30, Math.round(damage)));

	console.log("=== CÁLCULO DE DAÑO ===");
	console.log(`Atacante: ${attacker.character.name}`);
	console.log(`- Fuerza: ${strength}, Velocidad: ${speed}, Inteligencia: ${intelligence}`);
	console.log(`Defensor: ${defender.character.name}`);
	console.log(`- Durabilidad: ${durability}, Combate: ${combat}`);
	console.log(`Daño calculado: ${damage}`);
	console.log("=======================");

	return damage;
};

const calculateSpecialSkill = (attacker, defender) => {
	console.log(`[DEBUG] calculateSpecialSkill: ${attacker.character.name} vs ${defender.character.name}`);

	if (attacker.specialUsed) {
		console.log("[DEBUG] Special ya usado, no se puede usar de nuevo");

		return {
			success: false,
			message: `${attacker.character.name} has already used their special ability!`,
			damage: 0,
			effects: [],
		};
	}

	let result = {
		damage: 0,
		statusEffect: null,
		heal: 0,
		message: "",
	};

	let statusEffect;
	let damage;

	switch (attacker.character.name) {
		case "Black Widow":
			result.damage = 40;
			console.log(`[DEBUG] Black Widow - Daño calculado: ${result.damage}`);

			result.message = `Black Widow executes a Tactical Ambush! Deals ${result.damage} damage!`;
			break;

		case "Spider-Man":
			result.statusEffect = { type: "webbed", turnsLeft: 1 };
			result.message = "Spider-Man launches a Paralyzing Web! The enemy cannot attack next turn.";
			break;

		case "Iron Man":
			result.damage = 40;
			result.message = `Iron Man fires a Pulse Blast! Deals ${result.damage} damage ignoring defense.`;
			break;

		case "Captain America":
			statusEffect = { type: "shield", turnsLeft: 2 };
			attacker.statusEffects.push(statusEffect);
			result.message = "Captain America executes a Perfect Block! Blocks all damage for two turns.";
			break;

		case "Thor":
			result.damage = 40;
			result.message = `Thor calls down Divine Thunder! Unavoidable attack deals ${result.damage} damage.`;
			break;

		case "Hulk":
			statusEffect = { type: "rage", turnsLeft: 2 };
			attacker.statusEffects.push(statusEffect);
			result.message = "Hulk enters Uncontrollable Rage! Increased damage for the next two turns.";
			break;

		case "Thanos":
			result.damage = 40;
			result.message = "Thanos charges up the Infinity Fist! Strikes with devastating force.";
			break;

		case "Loki":
			statusEffect = { type: "illusion", turnsLeft: 1 };
			attacker.statusEffects.push(statusEffect);
			result.message = "Loki uses Multiform Illusion! 90% chance to dodge all attacks next turn.";
			break;

		case "Ultron":
			result.heal = 30;
			result.message = `Ultron uses Regen Upgrade! Regenerate 30% HP.`;
			break;

		case "Red Skull":
			result.statusEffect = { type: "demoralized", turnsLeft: 2 };
			result.message = "Red Skull invokes Terror Domination! Enemy's attack is reduced for 2 turns.";
			break;

		case "Hela":
			result.damage = 30;
			result.heal = 20;
			result.message = `Hela uses Life Drain! Deals ${result.damage} damage and heals ${result.heal} HP.`;
			break;

		case "Killmonger":
			result.statusEffect = { type: "doubleStrike", turnsLeft: 1 };
			result.message = "Killmonger unleashes Killer Instinct! May strike twice next turn if the first hits.";
			break;
	}

	attacker.specialUsed = true;
	console.log("[DEBUG] Resultado final del especial:", result);

	return {
		success: true,
		...result,
	};
};

const processStatusEffect = (role, character, effectType) => {
	const effect = character.statusEffects.find((effect) => effect.type === effectType);
	if (!effect) return false;

	switch (effectType) {
		case "webbed":
			showBattleText(role, `${character.character.name} is webbed and can't act this turn!`);
			break;
		case "shield":
			showBattleText(role, `${character.character.name} blocked the damage with their shield!`);
			break;
		case "rage":
			showBattleText(role, `${character.character.name} is enraged and deals more damage this turn!`);
			break;
		case "illusion":
			showBattleText(
				role,
				`${character.character.name} is making an illusion and their actions may be unpredictable!`
			);
			break;
		case "demoralized":
			showBattleText(role, `${character.character.name} is demoralized and weakened!`);
			break;
		case "doubleStrike":
			showBattleText(role, `${character.character.name} is ready for a double strike!`);
			break;
	}

	effect.turnsLeft--;
	if (effect.turnsLeft <= 0) {
		character.statusEffects = character.statusEffects.filter((effect) => effect.type !== effectType);
	}

	return true;
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
		}, 1000);
	}
};

const chooseEnemyAction = (battleState) => {
	const difficulty = loadFromStorage("difficulty") || 1;

	let attackProb = 0.4;
	let defenceProb = 0.3;
	let dodgeProb = 0.3;

	if (difficulty === 2 || difficulty === 3) {
		attackProb = 0.7;
		defenceProb = 0.2;
		dodgeProb = 0.1;
	}

	if (battleState.turn > 1 && !battleState.enemy.specialUsed) {
		const specialProb = 0.85;
		attackProb *= 1 - specialProb;
		defenceProb *= 1 - specialProb;
		dodgeProb *= 1 - specialProb;

		const random = Math.random();
		if (random < specialProb) return "special";
	}

	const random = Math.random();
	if (random < attackProb) return "attack";
	if (random < attackProb + defenceProb) return "defence";
	return "dodge";
};

export let playerHealthBar, enemyHealthBar;

export const initialBattleUi = () => {
	playerHealthBar = document.querySelector(".bar-ps-player");
	enemyHealthBar = document.querySelector(".bar-ps-enemy");
};

export const resetHealthBars = () => {
	if (!playerHealthBar || !enemyHealthBar) initialBattleUi();

	playerHealthBar.style.width = "100%";
	enemyHealthBar.style.width = "100%";
	playerHealthBar.style.backgroundColor = "green";
	enemyHealthBar.style.backgroundColor = "green";
};

export const updateHealthBars = (battleState) => {
	if (!playerHealthBar || !enemyHealthBar) initialBattleUi();

	const playerHp = Math.max(0, Math.min(100, battleState.player.currentHp));
	const enemyHp = Math.max(0, Math.min(100, battleState.enemy.currentHp));

	console.log(`[DEBUG] updateHealthBars: Jugador HP=${playerHp}%, Enemigo HP=${enemyHp}%`);

	playerHealthBar.style.width = `${playerHp}%`;
	enemyHealthBar.style.width = `${enemyHp}%`;

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
	console.log(
		`[DEBUG] checkBattleEnd: Jugador HP=${battleState.player.currentHp}, Enemigo HP=${battleState.enemy.currentHp}`
	);

	if (battleState.winner !== null && battleState.winner !== undefined) {
		console.log("[DEBUG] La batalla ya terminó");

		return true;
	}

	let battleEnded = false;

	if (battleState.enemy.currentHp <= 0 && battleState.player.currentHp > 0) {
		battleState.winner = "player";
		setTimeout(() => {
			showBattleText("player", "You won the battle!");
		}, 2000);
		battleEnded = true;
	} else if (battleState.player.currentHp <= 0 && battleState.enemy.currentHp > 0) {
		battleState.winner = "enemy";
		setTimeout(() => {
			showBattleText("enemy", "¡Enmey won the battle!");
		}, 2000);
		battleEnded = false;
		showBriefing("You lost!", "Your enemy defeated you.", {
			before: {
				text: "Back to map",
				action: () => {
					mapScreen.style.display = "flex";
					battleScreen.style.display = "none";
					loadMapState();
					hideModal();
				},
			},
			after: {
				text: "Retry",
				action: () => {
					battleState.player.currentHp = battleState.player.character.powerstats.durability;
					battleState.enemy.currentHp = battleState.enemy.character.powerstats.durability;

					battleState.player.statusEffects = [];
					battleState.enemy.statusEffects = [];

					battleState.player.specialUsed = false;
					battleState.enemy.specialUsed = false;

					updateBattleUI(battleState);
					showBattleText("player", "The battle restarts!");
					hideModal();
				},
			},
		});
	} else if (battleState.player.currentHp <= 0 && battleState.enemy.currentHp <= 0) {
		battleState.winner = "draw";
		setTimeout(() => {
			showBattleText("player", "Draw!");
			showBattleText("enemy", "Draw!");
		}, 2000);
		battleEnded = false;
		showBriefing("You draw!", "You were both defeated at the same time!", {
			before: {
				text: "Back to map",
				action: () => {
					mapScreen.style.display = "flex";
					battleScreen.style.display = "none";
					loadMapState();
					hideModal();
				},
			},
			after: {
				text: "Retry",
				action: () => {
					battleState.player.currentHp = battleState.player.character.powerstats.durability;
					battleState.enemy.currentHp = battleState.enemy.character.powerstats.durability;

					battleState.player.statusEffects = [];
					battleState.enemy.statusEffects = [];

					battleState.player.specialUsed = false;
					battleState.enemy.specialUsed = false;

					updateBattleUI(battleState);
					showBattleText("player", "The battle restarts!");
					hideModal();
				},
			},
		});
	}

	if (battleEnded) {
		saveToStorage("battleState", battleState);
		setTimeout(() => endBattle(battleState.winner), 4000);
		return true;
	}

	return false;
};

const endBattle = (playerWon) => {
	if (!playerWon) return;

	playerCard.classList.remove("attack-effect", "defence-effect", "dodge-effect", "special-effect", "miss-effect");
	enemyCard.classList.remove("attack-effect", "defence-effect", "dodge-effect", "special-effect", "miss-effect");

	clearStorageKey("battleState");
	disableButtons(true);

	const currentLevel = loadFromStorage("currentLevel") || 1;
	const currentSelection = loadFromStorage("characterType") || "heroes";
	const enemies = currentSelection === "heroes" ? levelEnemies.heroes : levelEnemies.villains;
	const currentEnemy = enemies.find((enemy) => enemy.level === currentLevel);

	setTimeout(() => {
		showBriefing(
			`${inputUserName.value} ${currentSelection === "heroes" ? "triumphs" : "dominates"} against ${
				currentEnemy.name
			}`,
			`The ${
				currentSelection === "heroes" ? "forces of justice cheer" : "shadows of evil whisper"
			} as you claim victory in level ${currentEnemy.level}.\n\n` +
				`Your ${
					currentSelection === "heroes" ? "heroic resolve" : "ruthless ambition"
				} has rewritten the fate of this reality.\n` +
				`The Nexus grows ${currentSelection === "heroes" ? "brighter" : "darker"} with each conquered world...`,
			{
				after: {
					text: "Continue Your Journey",
					action: () => {
						const currentLevel = loadFromStorage("currentLevel") || 1;
						const nextLevel = currentLevel + 1;

						if (currentLevel < 6) {
							const nextLevelElement = document.querySelector(`.level[data-level="${nextLevel}"]`);

							if (nextLevelElement) {
								nextLevelElement.classList.remove("locked");
								nextLevelElement.classList.add("unlocked");

								const rect = nextLevelElement.getBoundingClientRect();
								const mapRect = map.getBoundingClientRect();
								const x = rect.left - mapRect.left + rect.width / 2;
								const y = rect.top - mapRect.top + rect.height / 2;

								saveToStorage("playerPosition", {
									x: x,
									y: y,
									level: nextLevel,
								});
								saveToStorage(`level${nextLevel}Unlocked`, true);
								saveToStorage("currentLevel", nextLevel);

								// showLeveleInfo();
								// enemiesInLevel();
								// getRewards();

								if (nextLevelElement && nextLevelElement.getBoundingClientRect) {
									movePlayerToLevel(nextLevelElement);
								} else {
									console.error("Elemento de nivel no encontrado o inválido:", nextLevelElement);
								}
							}
						}
						if (currentLevel === 6) {
							saveToStorage(`level${nextLevel}Unlocked`, true);
							saveToStorage("currentLevel", nextLevel);

							setTimeout(() => {
								showBriefing(
									`${inputUserName.value} ${
										currentSelection === "heroes"
											? "has brought peace to the multiverse"
											: "has plunged the multiverse into darkness"
									}!`,
									`All six realms have fallen before your might.\n\n` +
										`The ${
											currentSelection === "heroes"
												? "light of justice shines across realities"
												: "shadows of tyranny now rule all dimensions"
										}.\n` +
										`Your ${
											currentSelection === "heroes" ? "heroic journey" : "dark crusade"
										} has reshaped the Nexus forever.\n\n` +
										`${
											currentSelection === "heroes"
												? "Hope echoes through every world you saved."
												: "Fear and chaos spread in your unstoppable wake."
										}`
								);
							}, 2000);
						}

						mapScreen.style.display = "flex";
						battleScreen.style.display = "none";
						hideModal();
						showLeveleInfo();
						enemiesInLevel();
						getRewards();
					},
				},
			}
		);
	}, 2000);
};

const getRewards = () => {
	const containerRewards = document.getElementById("rewards");
	const currentLevel = loadFromStorage("currentLevel") || 1;
	const currentSelection = loadFromStorage("characterType") || "heroes";
	const enemies = currentSelection === "heroes" ? levelEnemies.heroes : levelEnemies.villains;
	const currentEnemy = enemies.find((enemy) => enemy.level === currentLevel);

	// containerRewards.innerHTML = "";

	if (currentEnemy && currentEnemy.reward) {
		const img = document.createElement("img");
		img.classList.add("reward-img");
		img.src = currentEnemy.reward;
		img.alt = "Infinity Stone";

		containerRewards.appendChild(img);
	}
};
