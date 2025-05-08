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