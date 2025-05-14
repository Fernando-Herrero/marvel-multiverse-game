import { createCharacterCard, fetchCharactersByName } from "./character.js";
import { battleScreen } from "./map.js";
import { clearStorageKey, loadFromStorage, saveToStorage } from "./storage.js";
import { disableButtons, showBattleText } from "./utils.js";

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

	if (playerAction === "special") {
		if (battleState.player.specialUsed) {
			disableButtons(false);
			return;
		}

		battleState.player.specialUsed = true;
		document.getElementById("special-skill").disabled = true;
	}

	battleState.turn++;
	battleState.player.defending = false;
	battleState.enemy.defending = false;

	console.log(`\n=== TURNO ${battleState.turn} ===`);
	console.log(`Jugador elige acción: ${playerAction.toUpperCase()}`);

	disableButtons(true);

	const enemyAction = chooseEnemyAction(battleState);
	console.log(`Enemigo elige acción: ${enemyAction.toUpperCase()}`);

	resolveActions(playerAction, enemyAction, battleState);

	if (!checkBattleEnd(battleState)) {
		setTimeout(() => disableButtons(false), 1000);
	}
};

const resolveActions = (playerAction, enemyAction, battleState) => {
	if (enemyAction === "special" && !battleState.enemy.specialUsed) {
		battleState.enemy.specialUsed = true;
		console.log(`[Enemy] ¡${battleState.enemy.character.name} ha gastado su ataque especial!`);
	}

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
			switch (enemyAction) {
				case "attack":
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

	updateHealthBars(battleState);
	saveToStorage("battleState", battleState);
};

const handleBothAttack = (battleState) => {
	if (processStatusEffect(battleState.player, "webbed")) return;
	if (processStatusEffect(battleState.enemy, "webbed")) return;

	const playerRawDamage = calculateDamage(battleState.player, battleState.enemy);
	const enemyRawDamage = calculateDamage(battleState.enemy, battleState.player);

	let playerFinalDamage = playerRawDamage;
	let enemyFinalDamage = enemyRawDamage;

	if (processStatusEffect(battleState.player, "shield")) {
		enemyFinalDamage = 0;
		addBattleEffect("enemy", "miss-effect");
	}
	if (processStatusEffect(battleState.enemy, "shield")) {
		playerFinalDamage = 0;
		addBattleEffect("player", "miss-effect");
	}

	if (processStatusEffect(battleState.player, "rage")) {
		playerFinalDamage += 10;
	}
	if (processStatusEffect(battleState.enemy, "rage")) {
		enemyFinalDamage += 10;
	}

	if (processStatusEffect(battleState.player, "illusion")) {
		const dodgeChance = Math.random();
		if (dodgeChance > 0.9) {
			enemyFinalDamage = 0;
			addBattleEffect("enemy", "miss-effect");
		}
	}
	if (processStatusEffect(battleState.enemy, "illusion")) {
		const dodgeChance = Math.random();
		if (dodgeChance > 0.9) {
			playerFinalDamage = 0;
			addBattleEffect("player", "miss-effect");
		}
	}

	if (processStatusEffect(battleState.player, "demoralized")) {
		enemyFinalDamage -= 10;
	}
	if (processStatusEffect(battleState.enemy, "demoralized")) {
		playerFinalDamage -= 10;
	}

	if (processStatusEffect(battleState.player, "doubleStrike")) {
		playerFinalDamage += 20;
	}
	if (processStatusEffect(battleState.enemy, "doubleStrike")) {
		enemyFinalDamage += 20;
	}

	battleState.enemy.currentHp = Math.max(0, battleState.enemy.currentHp - playerFinalDamage);
	battleState.player.currentHp = Math.max(0, battleState.player.currentHp - enemyFinalDamage);

	addBattleEffect("player", "attack");
	addBattleEffect("enemy", "attack");

	showBattleText("player", `You attack dealing ${playerFinalDamage} HP to the enemy!`);
	showBattleText("enemy", `Enemy attacks and deals ${enemyFinalDamage} HP to you!`);
};

const handleAttackVsDefence = (battleState, attacker, defender) => {
	const damage = calculateDamage(battleState[attacker], battleState[defender]);

	const defenceEffectiveness = 0.3 + Math.random() * 0.4;
	const reducedDamage = Math.max(1, Math.floor(damage * defenceEffectiveness));

	let defenceQuality;
	if (defenceEffectiveness > 0.6) {
		defenceQuality = "poor";
	} else if (defenceEffectiveness > 0.45) {
		defenceQuality = "good";
	} else {
		defenceQuality = "excellent";
	}

	battleState[defender].currentHp = Math.max(0, battleState[defender].currentHp - reducedDamage);
	battleState[defender].defending = true;

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
		addBattleEffect(dodger, "dodge");
		addBattleEffect(attacker, "miss-effect");

		showBattleText(dodger, "Dodged the attack!");
		showBattleText(attacker, "Your attack missed!");
	} else {
		const damage = calculateDamage(battleState[attacker], battleState[dodger]);

		battleState[dodger].currentHp = Math.max(0, battleState[dodger].currentHp - damage);

		addBattleEffect(attacker, "attack");
		addBattleEffect(dodger, "miss-effect");

		showBattleText(attacker, `You hit for ${damage} damage!`);
		showBattleText(dodger, `You tried to dodge but missed and got hit for ${damage} damage!`);
	}
};

const handleAttackAndSpecial = (battleState, specialUser, attacker) => {
	if (processStatusEffect(battleState[specialUser], "webbed")) {
		return;
	}
	if (processStatusEffect(battleState[attacker], "webbed")) {
		return;
	}

	if (specialResult.message) {
		showBattleText(specialUser, specialResult.message);
	} else {
		showBattleText(specialUser, `You used a special move!`);
	}

	if (processStatusEffect(battleState[attacker], "illusion")) {
		const dodgeChance = Math.random();
		if (dodgeChance > 0.9) {
			return;
		} else {
			showBattleText(attacker, `${attacker.character.name} failed to dodge the attack!`);
		}
	}

	let attackDamage = calculateDamage(battleState[attacker], battleState[specialUser]);

	if (processStatusEffect(battleState[attacker], "demoralized")) {
		showBattleText(attacker, `${attacker.character.name} is demoralized and their attack is weakened!`);
		attackDamage -= 10;
	}

	if (processStatusEffect(battleState[attacker], "doubleStrike")) {
		showBattleText(attacker, `${attacker.character.name} is ready for a double strike!`);
		attackDamage += 20;
	}

	if (processStatusEffect(battleState[attacker], "rage")) {
		attackDamage += 10;
	}

	if (!processStatusEffect(battleState[specialUser], "shield")) {
		battleState[specialUser].currentHp = Math.max(0, battleState[specialUser].currentHp - attackDamage);
	} else {
		attackDamage = 0;
	}

	if (attackDamage > 0) {
		showBattleText(attacker, `You strike back! (-${attackDamage} HP to enemy)`);
	} else {
		showBattleText(attacker, `Your counterattack missed!`);
	}
};

const handleSpecialVsDefence = (battleState, specialUser, defender) => {
	const failChance = Math.random() < 0.05;

	if (failChance) {
		addBattleEffect(specialUser, "miss-effect");
		addBattleEffect(defender, "defence");
		showBattleText(specialUser, `${specialUser} tried to use a special move... but incredible missed!`);
		showBattleText(defender, `${defender} avoided the special attack! Incredible luck!`);

		battleState[specialUser].specialUsed = true;
		return;
	}

	const damage = calculateSpecialSkill(battleState[specialUser], battleState[defender]);
	battleState[defender].currentHp = Math.max(0, battleState[defender].currentHp - damage);

	addBattleEffect(specialUser, "special");
	addBattleEffect(defender, "miss-effect");

	showBattleText(specialUser, `${specialUser} used a special attack! Double damage!`);
	showBattleText(defender, `${defender} took ${damage} special damage.`);

	battleState[specialUser].specialUsed = true;
};

const handleSpecialVsDodge = (battleState, specialUser, dodger) => {
	const failChance = Math.random() < 0.05;

	if (failChance) {
		addBattleEffect(specialUser, "miss-effect");
		addBattleEffect(dodger, "dodge");
		showBattleText(specialUser, `${specialUser} tried to use a special move... but incredibly missed!`);
		showBattleText(dodger, `${dodger} dodged the special attack! Incredible reflexes!`);

		battleState[specialUser].specialUsed = true;
		return;
	}

	const damage = calculateSpecialSkill(battleState[specialUser], battleState[dodger]);
	battleState[dodger].currentHp = Math.max(0, battleState[dodger].currentHp - damage);

	addBattleEffect(specialUser, "special");
	addBattleEffect(dodger, "miss-effect");

	showBattleText(specialUser, `${specialUser} used a special attack! Cannot be dodged!`);
	showBattleText(dodger, `${dodger} took ${damage} special damage.`);

	battleState[specialUser].specialUsed = true;
};

const handleSpecialVsSpecial = (battleState) => {
	const playerDamage = calculateSpecialSkill(battleState.player, battleState.enemy);
	const enemyDamage = calculateSpecialSkill(battleState.enemy, battleState.player);

	battleState.enemy.currentHp = Math.max(0, battleState.enemy.currentHp - playerDamage);
	battleState.player.currentHp = Math.max(0, battleState.player.currentHp - enemyDamage);

	addBattleEffect("player", "special");
	addBattleEffect("enemy", "special");

	showBattleText("player", `You used a special attack! Enemy took ${playerDamage} special damage.`);
	showBattleText("enemy", `Enemy used a special attack! You took ${enemyDamage} special damage.`);

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

	damage = Math.max(1, Math.min(50, Math.round(damage)));

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
	if (attacker.specialUsed) {
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

	switch (attacker.character.name) {
		case "Black Widow":
			result.damage = 40 + attacker.character.powerstats.combat;
			result.message = `Black Widow executes a Tactical Ambush! Deals ${result.damage} damage!`;
			break;

		case "Spider-Man":
			statusEffect = { type: "webbed", turnsLeft: 1 };
			defender.statusEffects.push(statusEffect);
			result.message = "Spider-Man launches a Paralyzing Web! The enemy cannot attack next turn.";
			break;

		case "Iron Man":
			result.damage = 30 + attacker.character.powerstats.intelligence;
			result.message = `Iron Man fires a Pulse Blast! Deals ${result.damage} damage ignoring defense.`;
			break;

		case "Captain America":
			statusEffect = { type: "shield", turnsLeft: 2 };
			attacker.statusEffects.push(statusEffect);
			result.message = "Captain America executes a Perfect Block! Blocks all damage for two turns.";
			break;

		case "Thor":
			damage = 40 + attacker.character.powerstats.power;
			result.message = `Thor calls down Divine Thunder! Unavoidable attack deals ${result.damage} damage.`;
			break;

		case "Hulk":
			statusEffect = { type: "rage", turnsLeft: 2 };
			attacker.statusEffects.push(statusEffect);
			result.message = "Hulk enters Uncontrollable Rage! Increased damage for the next two turns.";
			break;

		case "Thanos":
			damage = 40 + attacker.character.powerstats.power;
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
			statusEffect = { type: "demoralized", turnsLeft: 2 };
			defender.statusEffects.push(statusEffect);
			result.message = "Red Skull invokes Terror Domination! Enemy's attack is reduced for 2 turns.";
			break;

		case "Hela":
			result.damage = 30;
			result.heal = 20;
			result.message = `Hela uses Life Drain! Deals ${result.damage} damage and heals ${result.heal} HP.`;
			break;

		case "Killmonger":
			statusEffect = { type: "doubleStrike", turnsLeft: 1 };
			attacker.statusEffects.push(statusEffect);
			result.message = "Killmonger unleashes Killer Instinct! May strike twice next turn if the first hits.";
			break;
	}

	attacker.specialUsed = true;
	saveToStorage("battleState", battleState);

	return {
		success: true,
		...result,
	};
};

const processStatusEffect = (character, effectType) => {
	const effect = character.statusEffects.find((effect) => effect.type === effectType);
	if (!effect) return false;

	switch (effectType) {
		case "webbed":
			showBattleText(character, `${character.character.name} is webbed and can't act this turn!`);
			break;
		case "shield":
			showBattleText(character, `${character.character.name} blocked the damage with their shield!`);
			break;
		case "rage":
			showBattleText(character, `${character.character.name} is enraged and deals more damage this turn!`);
			break;
		case "illusion":
			showBattleText(
				character,
				`${character.character.name} is making an illusion and their actions may be unpredictable!`
			);
			break;
		case "demoralized":
			showBattleText(character, `${character.character.name} is demoralized and weakened!`);
			break;
		case "doubleStrike":
			showBattleText(character, `${character.character.name} is ready for a double strike!`);
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
		}, 500);
	}
};

const chooseEnemyAction = (battleState) => {
	const baseActions = ["attack", "defence", "dodge"];

	if (!battleState.enemy.specialUsed) {
		const actionsWithSpecial = [...baseActions, "special", "special"];
		const randomIndex = Math.floor(Math.random() * actionsWithSpecial.length);
		return actionsWithSpecial[randomIndex];
	}

	const randomIndex = Math.floor(Math.random() * baseActions.length);
	return baseActions[randomIndex];
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

	const playerHp = Math.max(0, Math.min(100, battleState.player.currentHp));
	const enemyHp = Math.max(0, Math.min(100, battleState.enemy.currentHp));

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
	if (battleState.winner !== null && battleState.winner !== undefined) {
		return true;
	}

	let battleEnded = false;

	if (battleState.enemy.currentHp <= 0 && battleState.player.currentHp > 0) {
		battleState.winner = "player";
		showBattleText("player", "¡Has ganado la batalla!");
		battleEnded = true;
	} else if (battleState.player.currentHp <= 0 && battleState.enemy.currentHp > 0) {
		battleState.winner = "enemy";
		showBattleText("enemy", "¡Has sido derrotado!");
		battleEnded = true;
	} else if (battleState.player.currentHp <= 0 && battleState.enemy.currentHp <= 0) {
		battleState.winner = "draw";
		showBattleText("player", "¡Empate! Ambos han caído.");
		showBattleText("enemy", "¡Empate! Ambos han caído.");
		battleEnded = true;
	}

	if (battleEnded) {
		saveToStorage("battleState", battleState);
		setTimeout(() => endBattle(battleState.winner), 1500);
		return true;
	}

	return false;
};

const endBattle = (playerWon) => {
	console.log(playerWon ? "Ganaste" : "Perdiste");

	playerCard.classList.remove("attack-effect", "defence-effect", "dodge-effect", "special-effect", "miss-effect");
	enemyCard.classList.remove("attack-effect", "defence-effect", "dodge-effect", "special-effect", "miss-effect");

	clearStorageKey("battleState");

	disableButtons(true);

	setTimeout(() => {
		saveToStorage("currentScreen", "map");
		battleScreen.style.display = "none";
		mapScreen.style.display = "flex";
	}, 1500);
};
