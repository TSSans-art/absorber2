import {
    log,
    dmgind,
} from "./gloabals.js"

function RoundToInt(e) {
    return Math.round(100 * (e + Number.EPSILON)) / 100;
}

function changeLife(a, b, c, d) {
    b = RoundToInt(b);

    if (isNaN(b)) return;

    if ("damage" == d && b < 0) return;

    "damage" == d
        ? a.clife -= b
        : a.clife += b;

    0 < b && showIndicator(b, c, a, d);
}

function showIndicator(c, d, e, f) {
    let g = { fire: "orange", regeneration: "lightgreen", poison: "green", crit1: "red", crit2: "yellow", crit4: "blue", crit8: "magenta", lifesteal: "darkred", bleed: "crimson", reflect: "gold" }[d];

    switch (d) {
        case "crit1": d = "physical"; break;
        case "crit2": d = "crit"; break;
        case "crit4": d = "supercrit"; break;
        case "crit8": d = "megacrit"; break;
        default:
    }

    log.push(`<div>${e.name} takes <span style="color:${g}">${c}</span> ${f} through ${d}</div>`);

    if (null == e.version) {
        dmgind.push({ text: c, color: g });
        setTimeout(() => { try { dmgind.shift() } catch{ } }, 500)
    }

}

function checkDot(a, b, c) {
    if (0 < a.status.poison) {
        let damage = b.magic / 4;
        if (a.resistance != undefined && a.resistance.poisonresistance != undefined) {
            log.push(`<div>${a.name} resisted<span style="green"> ${RoundToInt(damage * (a.resistance.poisonresistance / 100))} poison</span> damage</div>`);
            damage = damage - damage * (a.resistance.poisonresistance / 100)
        }
        changeLife(a, damage, "poison", "damage", c);
        a.status.poison--
    }
    if (0 < a.status.fire) {
        let damage = b.magic / 3;

        if (a.resistance != undefined && a.resistance.fireresistance != undefined) {
            log.push(`<div>${a.name} resisted<span style="orange"> ${RoundToInt(damage * (a.resistance.fireresistance / 100))} fire</span> damage</div>`);
            damage = damage - damage * (a.resistance.fireresistance / 100)
        }

        changeLife(a, damage, "fire", "damage", c);
        a.status.fire--
    }
    if (0 < a.status.bleed) {
        let damage = b.dmg / 10;
        if (a.resistance != undefined && a.resistance.bleedresistance != undefined) {
            log.push(`<div>${a.name} resisted<span style="crimson"> ${RoundToInt(damage * (a.resistance.bleedresistance / 100))} bleeding</span>  damage</div>`);
            damage = damage - damage * (a.resistance.bleedresistance / 100)
        }
        changeLife(a, damage, "bleed", "damage", c);
        a.status.bleed--
    }

    0 < a.status.slow && a.status.slow--;
    0 < a.status.stim && a.status.stim--;
}

function checkRegeneration(a, b, c) {
    if (a.status.invert > 0) {
        changeLife(a, a.regeneration, "invert", "damage", b, c)
        a.status.invert--;
    }
    else if (a.status.bury > 0) {
        (a.regeneration * 4) + a.clife <= a.life
            ? changeLife(a, (a.regeneration * 4), "regeneration", "heal", b, c)
            : changeLife(a, a.life - a.clife, "regeneration", "heal", b, c)
    } else {
        a.regeneration + a.clife <= a.life
            ? changeLife(a, a.regeneration, "regeneration", "heal", b, c)
            : changeLife(a, a.life - a.clife, "regeneration", "heal", b, c)
    }
}

function checkChance(a, n) {
    if (a != null) {
        let p = Math.floor(10001 * Math.random());
        if (p <= 100 * a) {
            return true;
        }
    }
    return false;
}

function checkDodge(target, attacker) {
    if (null != attacker.chance) {
        if (null != target.effects)
            if (target.effects.precision != null)
                if (checkChance(attacker.chance.dodge - target.effects.precision, "dodge")) {
                    return true;
                } else {
                    return false;
                }


        if (checkChance(attacker.chance.dodge, "dodge"))
            return true;
    }
    return false;
}

function checkDouble(a) {
    return !!checkChance(a.chance.double, "double")
}



function CheckDotChance(name, a, b) {
    let chance = a.chance[name];
    if (chance != undefined) {
        let table = [
            { id: "fire", color: "orange", verb: "burned" },
            { id: "bleed", color: "crimson", verb: "sliced" },
            { id: "poison", color: "green", verb: "poisoned" },
            { id: "disarm", color: "yellow", verb: "disarmed" }];

        let obj = table.find(x => name == x.id);

        if (chance >= 100) {
            let times = (chance - chance % 100) / 100;
            checkChance(chance % 100, name) && times++;
            b.status[name] += times;
            log.push(`<div>${a.name} <span style="color:${obj.color}">${obj.verb}</span> ${b.name} ${times} times</div>`)
        } else if (checkChance(chance, name)) {
            b.status[name]++;
            log.push(`<div>${a.name} <span style="color:${obj.color}">${obj.verb}</span> ${b.name}</div>`)
        }
    }
}

function checkPoison(a, b) {
    CheckDotChance("poison", a, b)
}

function checkBleed(a, b) {
    CheckDotChance("bleed", a, b)
}

function checkFire(a, b) {
    CheckDotChance("fire", a, b)
}

function checkDisarm(a, b) {
    CheckDotChance("disarm", a, b)
}

function checkInstakill(a, b) {
    if (checkChance(a.chance.instakill, "instakill")) {
        if (b.boss) {
            log.push(`<div>${a.name} tryed to <span style="color:purple">instakill</span> ${b.name} doing ${b.life / 4} Damage</div>`)
            b.clife -= b.life / 4;
        } else {
            log.push(`<div>${a.name} <span style="color:purple">instakilled</span> ${b.name}</div>`)
            b.clife = -1;
        }
        return true;
    }
    return false;
}

function checkSlow(a, b) {
    if (checkChance(a.chance.slow, "slow")) {
        b.status.slow++;
        log.push(`<div>${a.name} <span style="color:lightGrey">slowed</span> ${b.name}</div>`)
    }
}

function checkInvert(a, b) {
    if (checkChance(a.chance.invert, "invert")) {
        b.status.invert++;
        log.push(`<div>${a.name} <span style="color:white">invert</span> ${b.name}</div>`)
    }
}

function checkStim(a) {
    if (checkChance(a.chance.stim, "stim")) {
        a.status.stim++;
        log.push(`<div>${a.name} <span style="color:green">used Stimmpack</span></div>`)
    }
}

function checkStun(a, b) {
    if (checkChance(a.chance.stun, "stun")) {
        b.status.stun++;
        log.push(`<div>${a.name} <span style="color:lightYellow">stunned</span> ${b.name}</div>`)
    }
}

function checkSilence(a, b) {
    if (checkChance(a.chance.silence, "silence")) {
        b.status.silence++;
        log.push(`<div>${a.name} <span style="color:white">silenced</span> ${b.name}</div>`)
    }
}

function checkBury(a) {
    if (checkChance(a.chance.bury, "bury")) {
        a.status.bury++;
        log.push(`<div>${a.name} <span style="color:white">buried</span> himself</div>`)
        return true;
    }
    return false;
}

function checkRot(a, b) {
    if (checkChance(a.chance.rot, "rot")) {
        b.status.rot++;
        log.push(`<div>${a.name} <span style="color:darkred">casted rot on</span> ${b.name}</div>`)
    }
}

function checkBlock(a) {
    if (null != a.effects)
        if (null != a.effects.block)
            return a.effects.block
    return 0
}

function checkRotTurn(a) {
    if (a.status.rot > 0) {
        a.status.rot--;
        return true;
    }
    return false;
}

export function checkTurn(target, attacker, disfi, exit, kong) {

    if (checkSpeed(target)) {
        return;
    }

    checkDot(target, attacker);

    if (!checkDeath(target, attacker, disfi, exit, kong)) {
        return;
    }

    if (checkStunTurn(target)) {
        checkDeath(target, attacker, disfi, exit, kong)
        return;
    }

    if (!checkRotTurn(target)) {
        checkRegeneration(target)
    }

    checkBuryTurn(target)

    let att = false, crit = 1;

    if (checkDodge(target, attacker)) {
        log.push(`<div>${attacker.name} <span style="color:brown">dodged</span></div>`);
        checkDeath(target, attacker, disfi, exit, kong);
        return;
    }

    if (target.status.silence <= 0) {
        if (null != target.chance) {

            if (checkInstakill(target, attacker)) {
                checkDeath(target, attacker, disfi, exit, kong)
                return;
            }

            att = checkDouble(target);

            if (checkBury(target)) {
                return;
            }

            checkInvert(target, attacker)
            checkStim(target, attacker)
            checkRot(target, attacker)
            checkPoison(target, attacker)
            checkBleed(target, attacker)
            checkFire(target, attacker)
            checkDisarm(target, attacker)
            checkSlow(target, attacker)
            checkStun(target, attacker)
            checkSilence(target, attacker)
            checkChance(target.chance.crit, "crit")
                && (crit = 2,
                    checkChance(target.chance.supercrit, "supercrit")
                    && (crit = 4,
                        checkChance(target.chance.megacrit, "megacrit")
                        && (crit = 8)));
        }
    } else {
        target.status.silence--;
    }

    let block = checkBlock(attacker)

    if (checkDisarmTurn(target)) {
        log.push(`<div>${target.name} is <span style="color:yellow">disarmed</span> and does not attack<div>`);
        return;
    }

    checkCrit(crit, attacker, target, block)

    att && setTimeout(() => {
        try {
            dmgind.shift();
            log.push(`<div>${target.name} attacks second time<div>`);
            checkCrit(crit, scrit, mcrit, attacker, target, block);
        } catch{ }
    }, 500);

    checkCounter(target, attacker)

    target.version != null && animateObject("animated");

    checkDeath(target, attacker, disfi, exit, kong)
}

function checkCounter(target, attacker) {
    if (attacker.chance != null) {
        if (checkChance(attacker.chance.counter, "counter")) {
            checkCrit(1, target, attacker, 0)
            log.push(`<div>${attacker.name} countered the attack</div>`)
        }
    }
}

function checkCrit(crit, attacker, target, block) {
    let dmg = target.dmg * crit - block;
    if (0 < dmg) {
        changeLife(attacker, dmg, "crit" + crit, "damage");
        checkReflect(target, attacker, target.dmg * crit);
        checkLifesteal(target, dmg);
    } else {
        log.push(`<div>${target.name} can't do any damage to ${attacker.name}</div>`)
    }
}

function checkReflect(a, b, c, d, e) {
    if (b.effects != null) {
        if (b.effects.reflect != null) {
            changeLife(a, c * (b.effects.reflect / 100), "reflect", "damage", d, e)
        }
    }

}

function checkLifesteal(a, b, c, d) {
    if (null != a.effects)
        if (null != a.effects.lifesteal) {
            a.clife + b * (a.effects.lifesteal / 100) <= a.life
                ? changeLife(a, b * (a.effects.lifesteal / 100), "lifesteal", "heal", c, d)
                : changeLife(a, a.life - a.clife, "lifesteal", "heal", c, d)
        }
}

function checkSpeed(a) {
    let sp = 100;

    0 < a.status.slow && (sp -= 20);
    0 < a.status.stim && (sp += 20);

    a.cspeed += sp;

    if (a.cspeed >= a.speed) {
        a.cspeed = 0
        return false;
    }
    return true;
}

function animateObject(b) {
    $("#enemy").addClass(b)
    setTimeout(() => { try { $("#enemy").removeClass(b) } catch{ } }, 500)
}

function checkEnemyDeath(target, attacker, func, res, kong) {

    if (attacker.chance != null) {
        if (checkChance(attacker.chance.resurrect, "resurrect")) {
            respawn(attacker);
            return;
        }
    }

    if (target.version != null) {
        animateObject("die");
    }

    for (let a in attacker.gain)
        if ("effects" != a && "chance" != a && "speed" != a && "resistance" != a && "life" !=a && "regeneration" !=a && "recovery" !=a){
            target[a] += attacker.gain[a];
        }
        else if ("life" == a) {
            if((target[a] + attacker.gain[a]) <= 0){
                target[a] = 1
            }
            else{
                target[a] += attacker.gain[a];
            }
        }
        else if ("regeneration" == a) {
            if((target[a] + attacker.gain[a]) <= 0){
                target[a] = 1
            }
            else{
                target[a] += attacker.gain[a];
            }
        }
        else if ("recovery" == a) {
            if((target[a] + attacker.gain[a]) <= 0){
                target[a] = 1
            }
            else{
                target[a] += attacker.gain[a];
            }
        }
        else if ("speed" == a) {
            if (attacker.gain[a] > 0) {
                if (target[a] > 110) {
                    target[a] -= attacker.gain[a];
                } else {
                    target.sspeed += attacker.gain[a];
                }
            } else {
                if (target.sspeed > 0) {
                    target.sspeed += attacker.gain[a];
                } else {
                    target[a] -= attacker.gain[a];
                }
            }
        }
        else if ("effects" == a)
            for (let b in attacker.gain.effects)
                target.effects[b] == null
                    ? target.effects[b] = attacker.gain.effects[b]
                    : target.effects[b] += attacker.gain.effects[b]

        else if ("chance" == a)
            for (let b in attacker.gain.chance)
                target.chance[b] == null
                    ? target.chance[b] = attacker.gain.chance[b]
                    : target.chance[b] += attacker.gain.chance[b];

        else if ("resistance" == a)
            for (let b in attacker.gain.resistance)
                target.resistance[b] == null
                    ? target.resistance[b] = attacker.gain.resistance[b]
                    : target.resistance[b] += attacker.gain.resistance[b];

    target.counter[attacker.id]++;

    if (attacker.boss) {
        target.time < target.highscore[attacker.id] && (target.highscore[attacker.id] = target.time);

        log.push(`<div>${attacker.name} was killed in ${target.time}</div>`)

        if (kong != null && kong != undefined) {
            try {
                kong.stats.submit(attacker.id, target.time);
            }
            catch{ }
        }

        attacker.id == getLastBoss(target) && func();

    } else {
        log.push(`<div>${target.name} killed  ${attacker.name}</div>`);
    }
    respawn(attacker);
    checkCleared(target, attacker, res)
}

export function getLastBoss(t) {
    let lastBoss = "chulthuluseye"

    switch (t.prestige) {
        case 0:
            lastBoss = "chulthuluseye"
            break;
        case 1:
            lastBoss = "necromant"
            break;
        case 2:
            lastBoss = "darlek"
            break;
        case 3:
            lastBoss = "chromeman"
            break;
        case 4:
            lastBoss = "turret"
            break;

        default:
            lastBoss = "turret"
            break;
    }
    return lastBoss
}

function checkDeath(target, attacker, func, res, kong) {
    if (target.version != null) {
        if (attacker.clife <= 0) {
            checkEnemyDeath(target, attacker, func, res, kong);
            return false;
        }
        if (target.clife <= 0) {
            checkPlayerDeath(target, attacker, res)
            return false;
        }
    } else {
        if (attacker.clife <= 0) {
            checkPlayerDeath(attacker, target, res)
            return false;
        }
        if (target.clife <= 0) {
            checkEnemyDeath(attacker, target, func, res, kong);
            return false;
        }
    }
    return true;
}

export function respawn(t) {
    t.clife = t.life;
    t.cspeed = 0;
    t.status = {
        "slow": 0, "poison": 0, "fire": 0, "stun": 0, "silence": 0, "rot": 0, "bleed": 0, "bury": 0, "stim": 0, "invert": 0, "disarm": 0
    }
    return t;
}

function checkPlayerDeath(a, b, d) {
    if (a.chance != null) {
        if (checkChance(a.chance.resurrect, "resurrect")) {
            log.push(`<div>${a.name} resurrected</div>`)
            respawn(a);
            return;
        }
    }

    log.push(`<div>${b.name} killed  ${a.name}</div>`)
    respawn(b)
    d();
}

function checkBuryTurn(a) {
    if (a.status.bury > 0) {
        a.status.bury--;
    }
}

function checkStunTurn(a) {
    if (a.status.stun > 0) {
        a.status.stun--;
        return true;
    }
    return false;
}

function checkDisarmTurn(a) {
    if (a.status.disarm > 0) {
        a.status.disarm--;
        return true;
    }
    return false;
}

function checkCleared(a, b, d) {
    a.counter[b.id] >= getLast(b.max, a.prestige) &&
        d();
}

export function getLast(j, p) {
    if (p >= j.length) {
        return j[j.length - 1];
    } else {
        return j[p];
    }
}


export function getNodeById(id, node) {
    var reduce = [].reduce;
    function runner(result, node) {
        if (result || !node) return result;
        return node.id === id && node ||
            runner(null, node.open) ||
            reduce.call(Object(node), runner, result);
    }
    return runner(null, node);
}

export function getNext(db, key) {
    for (var i = 0; i < db.length; i++) {
        if (db[i].key === key) {
            return db[i + 1] && db[i + 1].value;
        }
    }
}


export function copyToClipboard(text) {
    var today = new Date();
    var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    let filename = "AbsorberSave" + date;
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}


