module.exports = {
  params: {
    designator: "XX",
    side: "F",
    P1: { type: "net", value: "M2" },
  },
  body: (p) => {
    const fp = [];
    const flip = p.side === "B";
    if (!flip && p.side !== "F") throw new Error("unsupported side: " + p.side);

    fp.push(`(footprint MountingHole_2.2mm_M2`);
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

    fp.push(`(descr "Mounting Hole 2.2mm, no annular, M2")`);
    fp.push(`(tags "mounting hole 2.2mm no annular m2")`);
    fp.push(`(attr virtual)`);

    // Unknown to kicad2ergogen

    // Pads
    fp.push(
      `(pad "1" np_thru_hole circle (at 0 ${flipN(flip, 0)} ${flipR(flip, p.r + 0)}) (size 2.2 2.2) (drill 2.2) (layers "*.Cu" "*.Mask") ${p.P1})`,
    );

    // Drawings on F.CrtYd
    fp.push(
      `(fp_circle (center 0 ${flipN(flip, 0)}) (end 2.45 ${flipN(flip, 0)}) (layer "${flip ? "B.CrtYd" : "F.CrtYd"}") (width 0.05))`,
    );

    // Drawings on F.Fab
    fp.push(
      `(fp_text value MountingHole_2.2mm_M2 (at 0 ${flipN(flip, 3.2)} ${flipR(flip, p.r + 0) % 180}) (layer "${flip ? "B.Fab" : "F.Fab"}") (effects (font (size 1 1) (thickness 0.15)) (justify${flip ? " mirror" : ""})))`,
    );
    fp.push(
      `(fp_text user %R (at 0.3 ${flipN(flip, 0)} ${flipR(flip, p.r + 0) % 180}) (layer "${flip ? "B.Fab" : "F.Fab"}") (effects (font (size 1 1) (thickness 0.15)) (justify${flip ? " mirror" : ""})))`,
    );

    // Drawings on F.SilkS
    fp.push(
      `(fp_text reference REF** (at 0 ${flipN(flip, -3.2)} ${flipR(flip, p.r + 0) % 180}) (layer "${flip ? "B.SilkS" : "F.SilkS"}") (effects (font (size 1 1) (thickness 0.15)) (justify${flip ? " mirror" : ""})))`,
    );

    // Drawings on Cmts.User
    fp.push(
      `(fp_circle (center 0 ${flipN(flip, 0)}) (end 2.2 ${flipN(flip, 0)}) (layer "Cmts.User") (width 0.15))`,
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
