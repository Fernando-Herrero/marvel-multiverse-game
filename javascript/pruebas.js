import { battleScreen } from "./map";

const calculateAttack = () => {
	const battleState = loadFromStorage("battleState");
	const { player, enemy } = battleState;

	const attackPower = player.powerstats.strength + Math.random() * 20;

	if (player.statusEffects.find((e) => e.type === "rage")) {
		const extraPower = attackPower * 0.5;
		const finalPower = attackPower + extraPower;

		const rageEffect = player.statusEffects.find((e) => e.type === "rage");
		if (rageEffect) rageEffect.turnsLeft--;

		return finalPower;
	}

	if (player.statusEffects.some((e) => e.type === " doubleStrike")) {
		const finalPower = attackPower * 2;

		const strikeEffect = player.statusEffects.find((e) => e.type === "doubleStrike");
		if (strikeEffect) strikeEffect.turnsLeft--;

		return finalPower;
	}

	if (player.statusEffects.some((e) => e.type === "demoralized")) {
		const lessPower = attackPower * 0.3;
		const finalPower = attackPower - lessPower;

		const demoralizedEffect = player.statusEffects.find((e) => e.type === "demoralized");
		if (demoralizedEffect) demoralizedEffect.turnsLeft--;

		return finalPower;
	}

	if (enemy.statusEffects.some((e) => e.type === "shield")) {
		const finalPower = attackPower * 0;

		const shieldEffect = enemy.statusEffects.find((e) => e.type === "shield");
		if (shieldEffect) shieldEffect.turnsLeft--;

		return finalPower;
	}

	const defencePower = player.powerstats.durability + Math.random() * 15;

	if (attackPower > defencePower) {
		const damage = Math.max(5, Math.floor(attackPower - defencePower));
		enemy.currentHp = Math.max(0, enemy.currentHp - damage);

		saveToStorage("battleState", battleState);

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
