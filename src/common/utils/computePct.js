function computeNonMinorityPct(rows = []) {
    if (!Array.isArray(rows)) return 0;

    let total = 0;
    let nonMinority = 0;

    for (const r of rows) {
        const minorityBoys = Number(r.minority_boys || 0);
        const minorityGirls = Number(r.minority_girls || 0);
        const otherBoys = Number(r.other_boys || 0);
        const otherGirls = Number(r.other_girls || 0);

        const mb = Number.isFinite(minorityBoys) && minorityBoys > 0 ? minorityBoys : 0;
        const mg = Number.isFinite(minorityGirls) && minorityGirls > 0 ? minorityGirls : 0;
        const ob = Number.isFinite(otherBoys) && otherBoys > 0 ? otherBoys : 0;
        const og = Number.isFinite(otherGirls) && otherGirls > 0 ? otherGirls : 0;

        const rowTotal = mb + mg + ob + og;
        total += rowTotal;
        nonMinority += ob + og;
    }

    if (total === 0) return 0;

    const pct = (nonMinority / total) * 100;
    return Math.round(pct * 100) / 100;
}

module.exports = computeNonMinorityPct;
