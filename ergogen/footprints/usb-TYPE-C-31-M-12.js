module.exports = {
  params: {
    designator: "XX",
    side: "F",
    A1_B12: { type: "net", value: undefined },
    A4_B9: { type: "net", value: undefined },
    A5: { type: "net", value: undefined },
    A6: { type: "net", value: undefined },
    A7: { type: "net", value: undefined },
    A8: { type: "net", value: undefined },
    B1_A12: { type: "net", value: undefined },
    B4_A9: { type: "net", value: undefined },
    B5: { type: "net", value: undefined },
    B6: { type: "net", value: undefined },
    B7: { type: "net", value: undefined },
    B8: { type: "net", value: undefined },
    None: { type: "net", value: undefined },
    S1: { type: "net", value: undefined },
    S2: { type: "net", value: undefined },
    S3: { type: "net", value: undefined },
    S4: { type: "net", value: undefined },
  },
  body: (p) => {
    const fp = [];
    const flip = p.side === "B";
    if (!flip && p.side !== "F") throw new Error("unsupported side: " + p.side);

    fp.push(`(footprint HRO_TYPE-C-31-M-12`);
    fp.push(`(at ${p.x} ${p.y} ${flipR(flip, p.r)})`);
    fp.push(`(layer "${flip ? "B.Cu" : "F.Cu"}")`);
    fp.push(
      `(property "Reference" "${p.ref}" ${p.ref_hide} (at 0 0 ${flipR(flip, p.r) % 180}) (layer "${p.side}.SilkS") (effects (font (size 1 1) (thickness 0.15))${p.side === "B" ? " (justify mirror)" : ""}))`,
    );
    fp.push(
      `(property "Value" "" hide (at 0 0 ${flipR(flip, p.r) % 180}) (layer "${p.side}.Fab") (effects (font (size 1 1) (thickness 0.15))${p.side === "B" ? " (justify mirror)" : ""}))`,
    );
    fp.push(
      `(property "Datasheet" "" hide (at 0 0 ${flipR(flip, p.r) % 180}) (layer "${p.side}.Fab") (effects (font (size 1 1) (thickness 0.15))${p.side === "B" ? " (justify mirror)" : ""}))`,
    );
    fp.push(
      `(property "Description" "" hide (at 0 0 ${flipR(flip, p.r) % 180}) (layer "${p.side}.Fab") (effects (font (size 1 1) (thickness 0.15))${p.side === "B" ? " (justify mirror)" : ""}))`,
    );

    fp.push(`(descr "")`);
    fp.push(`(attr smd)`);

    // Unknown to kicad2ergogen

    // Pads
    fp.push(
      `(pad "A1_B12" smd rect (at -3.2 ${flipN(flip, -4.75)} ${flipR(flip, p.r + 0)}) (size 0.6 1.14) (layers "${flip ? "B" : "F"}.Cu" "${flip ? "B" : "F"}.Paste") ${p.A1_B12})`,
    );
    fp.push(
      `(pad "A4_B9" smd rect (at -2.4 ${flipN(flip, -4.75)} ${flipR(flip, p.r + 0)}) (size 0.6 1.14) (layers "${flip ? "B" : "F"}.Cu" "${flip ? "B" : "F"}.Paste") ${p.A4_B9})`,
    );
    fp.push(
      `(pad "A6" smd rect (at -0.25 ${flipN(flip, -4.75)} ${flipR(flip, p.r + 0)}) (size 0.3 1.14) (layers "${flip ? "B" : "F"}.Cu" "${flip ? "B" : "F"}.Paste") ${p.A6})`,
    );
    fp.push(
      `(pad "B7" smd rect (at -0.75 ${flipN(flip, -4.75)} ${flipR(flip, p.r + 0)}) (size 0.3 1.14) (layers "${flip ? "B" : "F"}.Cu" "${flip ? "B" : "F"}.Paste") ${p.B7})`,
    );
    fp.push(
      `(pad "A5" smd rect (at -1.25 ${flipN(flip, -4.75)} ${flipR(flip, p.r + 0)}) (size 0.3 1.14) (layers "${flip ? "B" : "F"}.Cu" "${flip ? "B" : "F"}.Paste") ${p.A5})`,
    );
    fp.push(
      `(pad "B8" smd rect (at -1.75 ${flipN(flip, -4.75)} ${flipR(flip, p.r + 0)}) (size 0.3 1.14) (layers "${flip ? "B" : "F"}.Cu" "${flip ? "B" : "F"}.Paste") ${p.B8})`,
    );
    fp.push(
      `(pad "A7" smd rect (at 0.25 ${flipN(flip, -4.75)} ${flipR(flip, p.r + 0)}) (size 0.3 1.14) (layers "${flip ? "B" : "F"}.Cu" "${flip ? "B" : "F"}.Paste") ${p.A7})`,
    );
    fp.push(
      `(pad "B6" smd rect (at 0.75 ${flipN(flip, -4.75)} ${flipR(flip, p.r + 0)}) (size 0.3 1.14) (layers "${flip ? "B" : "F"}.Cu" "${flip ? "B" : "F"}.Paste") ${p.B6})`,
    );
    fp.push(
      `(pad "A8" smd rect (at 1.25 ${flipN(flip, -4.75)} ${flipR(flip, p.r + 0)}) (size 0.3 1.14) (layers "${flip ? "B" : "F"}.Cu" "${flip ? "B" : "F"}.Paste") ${p.A8})`,
    );
    fp.push(
      `(pad "B5" smd rect (at 1.75 ${flipN(flip, -4.75)} ${flipR(flip, p.r + 0)}) (size 0.3 1.14) (layers "${flip ? "B" : "F"}.Cu" "${flip ? "B" : "F"}.Paste") ${p.B5})`,
    );
    fp.push(
      `(pad "B4_A9" smd rect (at 2.4 ${flipN(flip, -4.75)} ${flipR(flip, p.r + 0)}) (size 0.6 1.14) (layers "${flip ? "B" : "F"}.Cu" "${flip ? "B" : "F"}.Paste") ${p.B4_A9})`,
    );
    fp.push(
      `(pad "B1_A12" smd rect (at 3.2 ${flipN(flip, -4.75)} ${flipR(flip, p.r + 0)}) (size 0.6 1.14) (layers "${flip ? "B" : "F"}.Cu" "${flip ? "B" : "F"}.Paste") ${p.B1_A12})`,
    );
    fp.push(
      `(pad "None" np_thru_hole circle (at -2.89 ${flipN(flip, -3.68)} ${flipR(flip, p.r + 0)}) (size 0.6 0.6) (drill 0.6) (layers "*.Cu" "*.Mask") ${p.None})`,
    );
    fp.push(
      `(pad "None" np_thru_hole circle (at 2.89 ${flipN(flip, -3.68)} ${flipR(flip, p.r + 0)}) (size 0.6 0.6) (drill 0.6) (layers "*.Cu" "*.Mask") ${p.None})`,
    );
    fp.push(
      `(pad "S1" thru_hole oval (at -4.325 ${flipN(flip, -4.17)} ${flipR(flip, p.r + 0)}) (size 0.9 2.0) (drill oval 0.6 1.7) (layers "*.Cu" "*.Mask") (solder_mask_margin 0.102) ${p.S1})`,
    );
    fp.push(
      `(pad "S2" thru_hole oval (at 4.325 ${flipN(flip, -4.17)} ${flipR(flip, p.r + 0)}) (size 0.9 2.0) (drill oval 0.6 1.7) (layers "*.Cu" "*.Mask") (solder_mask_margin 0.102) ${p.S2})`,
    );
    fp.push(
      `(pad "S3" thru_hole oval (at -4.325 ${flipN(flip, 0.0)} ${flipR(flip, p.r + 0)}) (size 0.9 1.7) (drill oval 0.6 1.4) (layers "*.Cu" "*.Mask") (solder_mask_margin 0.102) ${p.S3})`,
    );
    fp.push(
      `(pad "S4" thru_hole oval (at 4.325 ${flipN(flip, 0.0)} ${flipR(flip, p.r + 0)}) (size 0.9 1.7) (drill oval 0.6 1.4) (layers "*.Cu" "*.Mask") (solder_mask_margin 0.102) ${p.S4})`,
    );

    // Drawings on F.CrtYd
    fp.push(
      `(fp_line (start -5.025 ${flipN(flip, -5.57)}) (end -5.025 ${flipN(flip, 2.85)}) (layer "${flip ? "B.CrtYd" : "F.CrtYd"}") (width 0.05))`,
    );
    fp.push(
      `(fp_line (start -5.025 ${flipN(flip, 2.85)}) (end 5.025 ${flipN(flip, 2.85)}) (layer "${flip ? "B.CrtYd" : "F.CrtYd"}") (width 0.05))`,
    );
    fp.push(
      `(fp_line (start 5.025 ${flipN(flip, 2.85)}) (end 5.025 ${flipN(flip, -5.57)}) (layer "${flip ? "B.CrtYd" : "F.CrtYd"}") (width 0.05))`,
    );
    fp.push(
      `(fp_line (start 5.025 ${flipN(flip, -5.57)}) (end -5.025 ${flipN(flip, -5.57)}) (layer "${flip ? "B.CrtYd" : "F.CrtYd"}") (width 0.05))`,
    );

    // Drawings on F.Fab
    fp.push(
      `(fp_text value HRO_TYPE-C-31-M-12 (at 6.405 ${flipN(flip, 3.685)} ${flipR(flip, p.r + 0) % 180}) (layer "${flip ? "B.Fab" : "F.Fab"}") (effects (font (size 1.0 1.0) (thickness 0.15)) (justify${flip ? " mirror" : ""})))`,
    );
    fp.push(
      `(fp_line (start -4.47 ${flipN(flip, 2.6)}) (end 4.47 ${flipN(flip, 2.6)}) (layer "${flip ? "B.Fab" : "F.Fab"}") (width 0.127))`,
    );
    fp.push(
      `(fp_line (start 4.47 ${flipN(flip, 2.6)}) (end 4.47 ${flipN(flip, -4.75)}) (layer "${flip ? "B.Fab" : "F.Fab"}") (width 0.127))`,
    );
    fp.push(
      `(fp_line (start 4.47 ${flipN(flip, -4.75)}) (end -4.47 ${flipN(flip, -4.75)}) (layer "${flip ? "B.Fab" : "F.Fab"}") (width 0.127))`,
    );
    fp.push(
      `(fp_line (start -4.47 ${flipN(flip, -4.75)}) (end -4.47 ${flipN(flip, 2.6)}) (layer "${flip ? "B.Fab" : "F.Fab"}") (width 0.127))`,
    );
    fp.push(
      `(fp_line (start -5.5 ${flipN(flip, 2.11)}) (end 9.0 ${flipN(flip, 2.11)}) (layer "${flip ? "B.Fab" : "F.Fab"}") (width 0.127))`,
    );
    fp.push(
      `(fp_text user "PCB EDGE" (at 5.2 ${flipN(flip, 1.9)} ${flipR(flip, p.r + 0) % 180}) (layer "${flip ? "B.Fab" : "F.Fab"}") (effects (font (size 0.48 0.48) (thickness 0.15)) (justify${flip ? " mirror" : ""})))`,
    );
    fp.push(
      `(fp_circle (center -3.2 ${flipN(flip, -6.0)}) (end -3.1 ${flipN(flip, -6.0)}) (layer "${flip ? "B.Fab" : "F.Fab"}") (width 0.2))`,
    );

    // Drawings on F.Mask
    fp.push(
      `(fp_poly (pts (xy -1.95 ${flipN(flip, -5.37)}) (xy -1.55 ${flipN(flip, -5.37)}) (xy -1.55 ${flipN(flip, -4.13)}) (xy -1.95 ${flipN(flip, -4.13)})) (layer "${flip ? "B.Mask" : "F.Mask"}") (width 0.01))`,
    );
    fp.push(
      `(fp_poly (pts (xy -1.45 ${flipN(flip, -5.37)}) (xy -1.05 ${flipN(flip, -5.37)}) (xy -1.05 ${flipN(flip, -4.13)}) (xy -1.45 ${flipN(flip, -4.13)})) (layer "${flip ? "B.Mask" : "F.Mask"}") (width 0.01))`,
    );
    fp.push(
      `(fp_poly (pts (xy -0.95 ${flipN(flip, -5.37)}) (xy -0.55 ${flipN(flip, -5.37)}) (xy -0.55 ${flipN(flip, -4.13)}) (xy -0.95 ${flipN(flip, -4.13)})) (layer "${flip ? "B.Mask" : "F.Mask"}") (width 0.01))`,
    );
    fp.push(
      `(fp_poly (pts (xy 1.55 ${flipN(flip, -5.37)}) (xy 1.95 ${flipN(flip, -5.37)}) (xy 1.95 ${flipN(flip, -4.13)}) (xy 1.55 ${flipN(flip, -4.13)})) (layer "${flip ? "B.Mask" : "F.Mask"}") (width 0.01))`,
    );
    fp.push(
      `(fp_poly (pts (xy 1.05 ${flipN(flip, -5.37)}) (xy 1.45 ${flipN(flip, -5.37)}) (xy 1.45 ${flipN(flip, -4.13)}) (xy 1.05 ${flipN(flip, -4.13)})) (layer "${flip ? "B.Mask" : "F.Mask"}") (width 0.01))`,
    );
    fp.push(
      `(fp_poly (pts (xy 0.55 ${flipN(flip, -5.37)}) (xy 0.95 ${flipN(flip, -5.37)}) (xy 0.95 ${flipN(flip, -4.13)}) (xy 0.55 ${flipN(flip, -4.13)})) (layer "${flip ? "B.Mask" : "F.Mask"}") (width 0.01))`,
    );
    fp.push(
      `(fp_poly (pts (xy -0.45 ${flipN(flip, -5.37)}) (xy -0.05 ${flipN(flip, -5.37)}) (xy -0.05 ${flipN(flip, -4.13)}) (xy -0.45 ${flipN(flip, -4.13)})) (layer "${flip ? "B.Mask" : "F.Mask"}") (width 0.01))`,
    );
    fp.push(
      `(fp_poly (pts (xy 0.05 ${flipN(flip, -5.37)}) (xy 0.45 ${flipN(flip, -5.37)}) (xy 0.45 ${flipN(flip, -4.13)}) (xy 0.05 ${flipN(flip, -4.13)})) (layer "${flip ? "B.Mask" : "F.Mask"}") (width 0.01))`,
    );
    fp.push(
      `(fp_poly (pts (xy -3.55 ${flipN(flip, -5.37)}) (xy -2.85 ${flipN(flip, -5.37)}) (xy -2.85 ${flipN(flip, -4.13)}) (xy -3.55 ${flipN(flip, -4.13)})) (layer "${flip ? "B.Mask" : "F.Mask"}") (width 0.01))`,
    );
    fp.push(
      `(fp_poly (pts (xy 2.85 ${flipN(flip, -5.37)}) (xy 3.55 ${flipN(flip, -5.37)}) (xy 3.55 ${flipN(flip, -4.13)}) (xy 2.85 ${flipN(flip, -4.13)})) (layer "${flip ? "B.Mask" : "F.Mask"}") (width 0.01))`,
    );
    fp.push(
      `(fp_poly (pts (xy -2.75 ${flipN(flip, -5.37)}) (xy -2.05 ${flipN(flip, -5.37)}) (xy -2.05 ${flipN(flip, -4.13)}) (xy -2.75 ${flipN(flip, -4.13)})) (layer "${flip ? "B.Mask" : "F.Mask"}") (width 0.01))`,
    );
    fp.push(
      `(fp_poly (pts (xy 2.05 ${flipN(flip, -5.37)}) (xy 2.75 ${flipN(flip, -5.37)}) (xy 2.75 ${flipN(flip, -4.13)}) (xy 2.05 ${flipN(flip, -4.13)})) (layer "${flip ? "B.Mask" : "F.Mask"}") (width 0.01))`,
    );

    // Drawings on F.SilkS
    fp.push(
      `(fp_text reference REF** (at -1.85 ${flipN(flip, -7.205)} ${flipR(flip, p.r + 0) % 180}) (layer "${flip ? "B.SilkS" : "F.SilkS"}") (effects (font (size 1.0 1.0) (thickness 0.15)) (justify${flip ? " mirror" : ""})))`,
    );
    fp.push(
      `(fp_line (start 4.47 ${flipN(flip, -2.85)}) (end 4.47 ${flipN(flip, -1.17)}) (layer "${flip ? "B.SilkS" : "F.SilkS"}") (width 0.127))`,
    );
    fp.push(
      `(fp_line (start 4.47 ${flipN(flip, 2.6)}) (end 4.47 ${flipN(flip, 1.17)}) (layer "${flip ? "B.SilkS" : "F.SilkS"}") (width 0.127))`,
    );
    fp.push(
      `(fp_line (start -4.47 ${flipN(flip, -2.85)}) (end -4.47 ${flipN(flip, -1.17)}) (layer "${flip ? "B.SilkS" : "F.SilkS"}") (width 0.127))`,
    );
    fp.push(
      `(fp_line (start -4.47 ${flipN(flip, 2.6)}) (end -4.47 ${flipN(flip, 1.17)}) (layer "${flip ? "B.SilkS" : "F.SilkS"}") (width 0.127))`,
    );
    fp.push(
      `(fp_line (start -4.47 ${flipN(flip, 2.6)}) (end 4.47 ${flipN(flip, 2.6)}) (layer "${flip ? "B.SilkS" : "F.SilkS"}") (width 0.127))`,
    );
    fp.push(
      `(fp_circle (center -3.2 ${flipN(flip, -6.0)}) (end -3.1 ${flipN(flip, -6.0)}) (layer "${flip ? "B.SilkS" : "F.SilkS"}") (width 0.2))`,
    );

    fp.push(")");
    return fp.join("\n");
  },
};
function normalizeAngle(angle) {
  angle = angle % 360;
  if (angle <= -180) angle += 360;
  else if (angle > 180) angle -= 360;
  return angle;
}
function flipR(flip, r) {
  return normalizeAngle(flip ? 180 - r : r);
}
function flipN(flip, n) {
  return flip ? -n : n;
}
