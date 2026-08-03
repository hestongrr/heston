/*
 * SPDX-License-Identifier: GPL-3.0-only
 *
 * USCS soil classification (ASTM D2487).
 * Copyright © Heston Norcott.
 *
 * This file is free software: you can redistribute it and/or modify it under the
 * terms of the GNU General Public License, version 3, as published by the Free
 * Software Foundation. See the LICENSE file at the root of this repository.
 *
 * This is the whole of the GPL-licensed JavaScript in this project — it is kept in
 * its own file precisely so the licence covers exactly the algorithm and nothing
 * else. The pages that call it are separately licensed; see LICENSING.md.
 *
 * A Python port of the same logic lives in uscs-classify/ and is contributed
 * upstream to the groundhog geotechnical library (also GPL-3.0).
 */
"use strict";

/**
 * Classify a soil sample per ASTM D2487.
 *
 * @param {object} s
 *   p200    percent passing the #200 sieve
 *   p4      percent passing the #4 sieve
 *   D60,D30,D10  grain diameters for the gradation coefficients
 *   LL, PL  liquid and plastic limits
 *   organic true if the sample is marked organic
 * @returns {{sym:string, name:string, warn:string, PI:number, Aline:number,
 *            Uline:number, isFine:boolean, steps:Array<[string,string]>}}
 *   `steps` is the worked derivation, each entry a [label, html] pair.
 */
function classifyUSCS(s){
  const p200 = +s.p200, p4 = +s.p4;
  const D60 = +s.D60, D30 = +s.D30, D10 = +s.D10;
  const LL = +s.LL, PL = +s.PL, organic = !!s.organic;
  const PI = LL - PL;
  const steps = [];
  let sym = "—", name = "Enter values", warn = "";

  const Aline = 0.73 * (LL - 20);
  const Uline = 0.9 * (LL - 8);
  const isFine = p200 >= 50;

  if (isFine){
    // ---------- FINE-GRAINED ----------
    steps.push(["#200", `<b>${p200}%</b> passing ≥ 50% → <b>fine-grained</b>`]);
    steps.push(["PI", `LL ${LL} − PL ${PL} = <b>PI ${PI.toFixed(1)}</b>`]);
    steps.push(["A-line", `PI = 0.73(${LL} − 20) = <b>${Aline.toFixed(1)}</b> — sample is
                 <b>${PI>=Aline?"above":"below"}</b> it`]);
    const high = LL >= 50;
    steps.push(["LL = 50", `LL ${LL} → <b>${high?"high (H)":"low (L)"}</b> plasticity`]);
    if (organic){
      sym = high ? "OH" : "OL";
      name = high ? "Organic clay or organic silt (high plasticity)"
                  : "Organic clay or organic silt (low plasticity)";
      steps.push(["organic", "Marked organic → O prefix"]);
    } else if (!high && PI>=4 && PI<=7 && PI>=Aline){
      sym="CL-ML"; name="Silty clay";
      steps.push(["dual", "PI between 4 and 7 and above A-line → borderline <b>CL-ML</b>"]);
    } else if (PI >= Aline && PI >= 7){
      sym = high?"CH":"CL"; name = high?"Fat clay":"Lean clay";
    } else {
      sym = high?"MH":"ML"; name = high?"Elastic silt":"Silt";
    }
    if (PI > Uline && LL>0)
      warn = "⚠ This point plots ABOVE the U-line. Real soils don't — re-check the lab results.";
  } else {
    // ---------- COARSE-GRAINED ----------
    steps.push(["#200", `<b>${p200}%</b> passing &lt; 50% → <b>coarse-grained</b>`]);
    const coarse = 100 - p200;                    // total coarse fraction
    const retained4_total = 100 - p4;             // retained on #4, of total
    const pctOfCoarse = coarse>0 ? (retained4_total/coarse)*100 : 0;
    const gravel = pctOfCoarse > 50;
    steps.push(["#4", `${retained4_total.toFixed(1)}% of the sample retained on #4 =
      <b>${pctOfCoarse.toFixed(1)}% of the coarse fraction</b> → <b>${gravel?"GRAVEL (G)":"SAND (S)"}</b>
      <em>(split is on the coarse fraction, not the total)</em>`]);
    const G = gravel?"G":"S";
    const base = gravel?"gravel":"sand";
    const Cu = D10>0 ? D60/D10 : 0;
    const Cc = (D60>0&&D10>0) ? (D30*D30)/(D60*D10) : 0;
    const cuMin = gravel?4:6;
    const wellGraded = Cu>=cuMin && Cc>=1 && Cc<=3;
    const fineIsClay = PI>=Aline && PI>=7;

    if (p200 < 5){
      steps.push(["fines", `${p200}% &lt; 5% → clean, grade it`]);
      steps.push(["Cu / Cc", `Cu = ${Cu.toFixed(1)} (needs ≥ ${cuMin}) · Cc = ${Cc.toFixed(2)}
        (needs 1–3) → <b>${wellGraded?"well graded":"poorly graded"}</b>`]);
      sym = G + (wellGraded?"W":"P");
      name = (wellGraded?"Well-graded ":"Poorly graded ") + base;
    } else if (p200 <= 12){
      steps.push(["fines", `${p200}% is in the <b>5–12% band → DUAL SYMBOL</b>`]);
      steps.push(["Cu / Cc", `Cu = ${Cu.toFixed(1)} · Cc = ${Cc.toFixed(2)} →
        ${wellGraded?"well graded":"poorly graded"}`]);
      steps.push(["fines type", `PI ${PI.toFixed(1)} vs A-line ${Aline.toFixed(1)} →
        ${fineIsClay?"clayey (C)":"silty (M)"}`]);
      sym = G + (wellGraded?"W":"P") + "-" + G + (fineIsClay?"C":"M");
      name = (wellGraded?"Well-graded ":"Poorly graded ") + base +
             (fineIsClay?" with clay":" with silt");
    } else {
      steps.push(["fines", `${p200}% &gt; 12% → fines govern the symbol`]);
      steps.push(["fines type", `PI ${PI.toFixed(1)} vs A-line ${Aline.toFixed(1)} →
        ${fineIsClay?"clayey (C)":"silty (M)"}`]);
      sym = G + (fineIsClay?"C":"M");
      name = (fineIsClay?"Clayey ":"Silty ") + base;
    }
  }

  return { sym, name, warn, PI, Aline, Uline, isFine, steps };
}

if (typeof module !== "undefined" && module.exports) module.exports = { classifyUSCS };
