
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
