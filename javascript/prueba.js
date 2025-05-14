

		case "Red Skull":
			statusEffect = { type: "demoralized", turnsLeft: 2 };
			defender.statusEffects.push(statusEffect);
			result.message = "Red Skull invokes Terror Domination! Enemy's attack is reduced for 2 turns.";
			break;


		case "Killmonger":
			statusEffect = { type: "doubleStrike", turnsLeft: 1 };
			attacker.statusEffects.push(statusEffect);
			result.message = "Killmonger unleashes Killer Instinct! May strike twice next turn if the first hits.";
			break;