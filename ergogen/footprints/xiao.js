module.exports = {
  params: {
    designator: "XX",
    side: "F",
    A0: { type: "net", value: undefined },
    A1: { type: "net", value: undefined },
    A10: { type: "net", value: undefined },
    A2: { type: "net", value: undefined },
    A3: { type: "net", value: undefined },
    A4: { type: "net", value: undefined },
    A5: { type: "net", value: undefined },
    A6: { type: "net", value: undefined },
    A7: { type: "net", value: undefined },
    A8: { type: "net", value: undefined },
    A9: { type: "net", value: undefined },
    GND: { type: "net", value: undefined },
    P_3V3: { type: "net", value: undefined },
    VCC: { type: "net", value: undefined },
  },
  body: (p) => {
    const fp = [];
    const flip = p.side === "B";
    if (!flip && p.side !== "F") throw new Error("unsupported side: " + p.side);

    fp.push(`(footprint MODULE_102010428`);
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
      `(pad "7" smd roundrect (roundrect_rratio 0.25) (at -8.1 ${flipN(flip, 7.62)} ${flipR(flip, p.r + 0)}) (size 2.75 2.0) (layers "${flip ? "B" : "F"}.Cu" "${flip ? "B" : "F"}.Mask" "${flip ? "B" : "F"}.Paste") (solder_mask_margin 0.102) ${p.A6})`,
    );
    fp.push(
      `(pad "6" smd roundrect (roundrect_rratio 0.25) (at -8.1 ${flipN(flip, 5.08)} ${flipR(flip, p.r + 0)}) (size 2.75 2.0) (layers "${flip ? "B" : "F"}.Cu" "${flip ? "B" : "F"}.Mask" "${flip ? "B" : "F"}.Paste") (solder_mask_margin 0.102) ${p.A5})`,
    );
    fp.push(
      `(pad "5" smd roundrect (roundrect_rratio 0.25) (at -8.1 ${flipN(flip, 2.54)} ${flipR(flip, p.r + 0)}) (size 2.75 2.0) (layers "${flip ? "B" : "F"}.Cu" "${flip ? "B" : "F"}.Mask" "${flip ? "B" : "F"}.Paste") (solder_mask_margin 0.102) ${p.A4})`,
    );
    fp.push(
      `(pad "4" smd roundrect (roundrect_rratio 0.25) (at -8.1 ${flipN(flip, 0.0)} ${flipR(flip, p.r + 0)}) (size 2.75 2.0) (layers "${flip ? "B" : "F"}.Cu" "${flip ? "B" : "F"}.Mask" "${flip ? "B" : "F"}.Paste") (solder_mask_margin 0.102) ${p.A3})`,
    );
    fp.push(
      `(pad "3" smd roundrect (roundrect_rratio 0.25) (at -8.1 ${flipN(flip, -2.54)} ${flipR(flip, p.r + 0)}) (size 2.75 2.0) (layers "${flip ? "B" : "F"}.Cu" "${flip ? "B" : "F"}.Mask" "${flip ? "B" : "F"}.Paste") (solder_mask_margin 0.102) ${p.A2})`,
    );
    fp.push(
      `(pad "2" smd roundrect (roundrect_rratio 0.25) (at -8.1 ${flipN(flip, -5.08)} ${flipR(flip, p.r + 0)}) (size 2.75 2.0) (layers "${flip ? "B" : "F"}.Cu" "${flip ? "B" : "F"}.Mask" "${flip ? "B" : "F"}.Paste") (solder_mask_margin 0.102) ${p.A1})`,
    );
    fp.push(
      `(pad "1" smd roundrect (roundrect_rratio 0.25) (at -8.1 ${flipN(flip, -7.62)} ${flipR(flip, p.r + 0)}) (size 2.75 2.0) (layers "${flip ? "B" : "F"}.Cu" "${flip ? "B" : "F"}.Mask" "${flip ? "B" : "F"}.Paste") (solder_mask_margin 0.102) ${p.A0})`,
    );
    fp.push(
      `(pad "8" smd roundrect (roundrect_rratio 0.25) (at 8.1 ${flipN(flip, 7.62)} ${flipR(flip, p.r + 0)}) (size 2.75 2.0) (layers "${flip ? "B" : "F"}.Cu" "${flip ? "B" : "F"}.Mask" "${flip ? "B" : "F"}.Paste") (solder_mask_margin 0.102) ${p.A7})`,
    );
    fp.push(
      `(pad "9" smd roundrect (roundrect_rratio 0.25) (at 8.1 ${flipN(flip, 5.08)} ${flipR(flip, p.r + 0)}) (size 2.75 2.0) (layers "${flip ? "B" : "F"}.Cu" "${flip ? "B" : "F"}.Mask" "${flip ? "B" : "F"}.Paste") (solder_mask_margin 0.102) ${p.A8})`,
    );
    fp.push(
      `(pad "10" smd roundrect (roundrect_rratio 0.25) (at 8.1 ${flipN(flip, 2.54)} ${flipR(flip, p.r + 0)}) (size 2.75 2.0) (layers "${flip ? "B" : "F"}.Cu" "${flip ? "B" : "F"}.Mask" "${flip ? "B" : "F"}.Paste") (solder_mask_margin 0.102) ${p.A9})`,
    );
    fp.push(
      `(pad "11" smd roundrect (roundrect_rratio 0.25) (at 8.1 ${flipN(flip, 0.0)} ${flipR(flip, p.r + 0)}) (size 2.75 2.0) (layers "${flip ? "B" : "F"}.Cu" "${flip ? "B" : "F"}.Mask" "${flip ? "B" : "F"}.Paste") (solder_mask_margin 0.102) ${p.A10})`,
    );
    fp.push(
      `(pad "12" smd roundrect (roundrect_rratio 0.25) (at 8.1 ${flipN(flip, -2.54)} ${flipR(flip, p.r + 0)}) (size 2.75 2.0) (layers "${flip ? "B" : "F"}.Cu" "${flip ? "B" : "F"}.Mask" "${flip ? "B" : "F"}.Paste") (solder_mask_margin 0.102) ${p.P_3V3})`,
    );
    fp.push(
      `(pad "13" smd roundrect (roundrect_rratio 0.25) (at 8.1 ${flipN(flip, -5.08)} ${flipR(flip, p.r + 0)}) (size 2.75 2.0) (layers "${flip ? "B" : "F"}.Cu" "${flip ? "B" : "F"}.Mask" "${flip ? "B" : "F"}.Paste") (solder_mask_margin 0.102) ${p.GND})`,
    );
    fp.push(
      `(pad "14" smd roundrect (roundrect_rratio 0.25) (at 8.1 ${flipN(flip, -7.62)} ${flipR(flip, p.r + 0)}) (size 2.75 2.0) (layers "${flip ? "B" : "F"}.Cu" "${flip ? "B" : "F"}.Mask" "${flip ? "B" : "F"}.Paste") (solder_mask_margin 0.102) ${p.VCC})`,
    );

    // Drawings on F.CrtYd
    fp.push(
      `(fp_line (start -9.725 ${flipN(flip, -12.174)}) (end 9.725 ${flipN(flip, -12.174)}) (layer "${flip ? "B.CrtYd" : "F.CrtYd"}") (width 0.05))`,
    );
    fp.push(
      `(fp_line (start 9.725 ${flipN(flip, -12.174)}) (end 9.725 ${flipN(flip, 10.75)}) (layer "${flip ? "B.CrtYd" : "F.CrtYd"}") (width 0.05))`,
    );
    fp.push(
      `(fp_line (start 9.725 ${flipN(flip, 10.75)}) (end -9.725 ${flipN(flip, 10.75)}) (layer "${flip ? "B.CrtYd" : "F.CrtYd"}") (width 0.05))`,
    );
    fp.push(
      `(fp_line (start -9.725 ${flipN(flip, 10.75)}) (end -9.725 ${flipN(flip, -12.174)}) (layer "${flip ? "B.CrtYd" : "F.CrtYd"}") (width 0.05))`,
    );

    // Drawings on F.Fab
    fp.push(
      `(fp_text value MODULE_102010428 (at -0.582 ${flipN(flip, 11.347)} ${flipR(flip, p.r + 0) % 180}) (layer "${flip ? "B.Fab" : "F.Fab"}") (effects (font (size 0.8 0.8) (thickness 0.15)) (justify${flip ? " mirror" : ""})))`,
    );
    fp.push(
      `(fp_line (start -8.9 ${flipN(flip, 10.5)}) (end 8.9 ${flipN(flip, 10.5)}) (layer "${flip ? "B.Fab" : "F.Fab"}") (width 0.127))`,
    );
    fp.push(
      `(fp_line (start 8.9 ${flipN(flip, 10.5)}) (end 8.9 ${flipN(flip, -10.5)}) (layer "${flip ? "B.Fab" : "F.Fab"}") (width 0.127))`,
    );
    fp.push(
      `(fp_line (start 8.9 ${flipN(flip, -10.5)}) (end 4.5 ${flipN(flip, -10.5)}) (layer "${flip ? "B.Fab" : "F.Fab"}") (width 0.127))`,
    );
    fp.push(
      `(fp_line (start 4.5 ${flipN(flip, -10.5)}) (end 4.5 ${flipN(flip, -11.924)}) (layer "${flip ? "B.Fab" : "F.Fab"}") (width 0.127))`,
    );
    fp.push(
      `(fp_line (start 4.5 ${flipN(flip, -11.924)}) (end -4.5 ${flipN(flip, -11.924)}) (layer "${flip ? "B.Fab" : "F.Fab"}") (width 0.127))`,
    );
    fp.push(
      `(fp_line (start -4.5 ${flipN(flip, -11.924)}) (end -4.5 ${flipN(flip, -10.5)}) (layer "${flip ? "B.Fab" : "F.Fab"}") (width 0.127))`,
    );
    fp.push(
      `(fp_line (start -4.5 ${flipN(flip, -10.5)}) (end -8.9 ${flipN(flip, -10.5)}) (layer "${flip ? "B.Fab" : "F.Fab"}") (width 0.127))`,
    );
    fp.push(
      `(fp_line (start -8.9 ${flipN(flip, -10.5)}) (end -8.9 ${flipN(flip, 10.5)}) (layer "${flip ? "B.Fab" : "F.Fab"}") (width 0.127))`,
    );
    fp.push(
      `(fp_circle (center -10.229 ${flipN(flip, -7.891)}) (end -10.129 ${flipN(flip, -7.891)}) (layer "${flip ? "B.Fab" : "F.Fab"}") (width 0.2))`,
    );

    // Drawings on F.SilkS
    fp.push(
      `(fp_text reference REF** (at -5.898 ${flipN(flip, -13.494)} ${flipR(flip, p.r + 0) % 180}) (layer "${flip ? "B.SilkS" : "F.SilkS"}") (effects (font (size 0.8 0.8) (thickness 0.15)) (justify${flip ? " mirror" : ""})))`,
    );
    fp.push(
      `(fp_line (start -8.9 ${flipN(flip, 10.5)}) (end 8.9 ${flipN(flip, 10.5)}) (layer "${flip ? "B.SilkS" : "F.SilkS"}") (width 0.127))`,
    );
    fp.push(
      `(fp_line (start 8.9 ${flipN(flip, 10.5)}) (end 8.9 ${flipN(flip, 8.97)}) (layer "${flip ? "B.SilkS" : "F.SilkS"}") (width 0.127))`,
    );
    fp.push(
      `(fp_line (start -8.9 ${flipN(flip, 8.97)}) (end -8.9 ${flipN(flip, 10.5)}) (layer "${flip ? "B.SilkS" : "F.SilkS"}") (width 0.127))`,
    );
    fp.push(
      `(fp_line (start -4.5 ${flipN(flip, -11.924)}) (end 4.495 ${flipN(flip, -11.924)}) (layer "${flip ? "B.SilkS" : "F.SilkS"}") (width 0.127))`,
    );
    fp.push(
      `(fp_circle (center -10.229 ${flipN(flip, -7.891)}) (end -10.129 ${flipN(flip, -7.891)}) (layer "${flip ? "B.SilkS" : "F.SilkS"}") (width 0.2))`,
    );
    fp.push(
      `(fp_line (start -8.9 ${flipN(flip, -9.0)}) (end -8.9 ${flipN(flip, -10.5)}) (layer "${flip ? "B.SilkS" : "F.SilkS"}") (width 0.127))`,
    );
    fp.push(
      `(fp_line (start -8.9 ${flipN(flip, -10.5)}) (end -4.5 ${flipN(flip, -10.5)}) (layer "${flip ? "B.SilkS" : "F.SilkS"}") (width 0.127))`,
    );
    fp.push(
      `(fp_line (start -4.5 ${flipN(flip, -10.5)}) (end -4.5 ${flipN(flip, -11.9)}) (layer "${flip ? "B.SilkS" : "F.SilkS"}") (width 0.127))`,
    );
    fp.push(
      `(fp_line (start 4.5 ${flipN(flip, -11.9)}) (end 4.5 ${flipN(flip, -10.5)}) (layer "${flip ? "B.SilkS" : "F.SilkS"}") (width 0.127))`,
    );
    fp.push(
      `(fp_line (start 4.5 ${flipN(flip, -10.5)}) (end 8.9 ${flipN(flip, -10.5)}) (layer "${flip ? "B.SilkS" : "F.SilkS"}") (width 0.127))`,
    );
    fp.push(
      `(fp_line (start 8.9 ${flipN(flip, -10.5)}) (end 8.9 ${flipN(flip, -9.0)}) (layer "${flip ? "B.SilkS" : "F.SilkS"}") (width 0.127))`,
    );

    // Zones
    fp.push(
      `(zone (net 0) (net_name "") (layer "${flip ? "B.Cu" : "F.Cu"}") (hatch full 0.508) (connect_pads (clearance 0)) (min_thickness 0.01) (keepout (tracks not_allowed) (vias not_allowed) (pads not_allowed) (copperpour not_allowed) (footprints allowed)) (fill (thermal_gap 0.508) (thermal_bridge_width 0.508)) (polygon (pts ${zoneXY(p, flip ? 2.54 : -2.54, 7.325)} ${zoneXY(p, flip ? -3.175 : 3.175, 7.325)} ${zoneXY(p, flip ? -3.175 : 3.175, 9.865)} ${zoneXY(p, flip ? 2.54 : -2.54, 9.865)})))`,
    );
    fp.push(
      `(zone (net 0) (net_name "") (layer "${flip ? "B.Cu" : "F.Cu"}") (hatch full 0.508) (connect_pads (clearance 0)) (min_thickness 0.01) (keepout (tracks not_allowed) (vias not_allowed) (pads not_allowed) (copperpour not_allowed) (footprints allowed)) (fill (thermal_gap 0.508) (thermal_bridge_width 0.508)) (polygon (pts ${zoneXY(p, flip ? 5.207 : -5.207, -10.582)} ${zoneXY(p, flip ? 3.429 : -3.429, -10.582)} ${zoneXY(p, flip ? 3.429 : -3.429, -7.915)} ${zoneXY(p, flip ? 5.207 : -5.207, -7.915)})))`,
    );
    fp.push(
      `(zone (net 0) (net_name "") (layer "${flip ? "B.Cu" : "F.Cu"}") (hatch full 0.508) (connect_pads (clearance 0)) (min_thickness 0.01) (keepout (tracks not_allowed) (vias not_allowed) (pads not_allowed) (copperpour not_allowed) (footprints allowed)) (fill (thermal_gap 0.508) (thermal_bridge_width 0.508)) (polygon (pts ${zoneXY(p, flip ? 5.207 : -5.207, -6.518)} ${zoneXY(p, flip ? 3.429 : -3.429, -6.518)} ${zoneXY(p, flip ? 3.429 : -3.429, -3.851)} ${zoneXY(p, flip ? 5.207 : -5.207, -3.851)})))`,
    );
    fp.push(
      `(zone (net 0) (net_name "") (layer "${flip ? "B.Cu" : "F.Cu"}") (hatch full 0.508) (connect_pads (clearance 0)) (min_thickness 0.01) (keepout (tracks not_allowed) (vias not_allowed) (pads not_allowed) (copperpour not_allowed) (footprints allowed)) (fill (thermal_gap 0.508) (thermal_bridge_width 0.508)) (polygon (pts ${zoneXY(p, flip ? -3.429 : 3.429, -6.518)} ${zoneXY(p, flip ? -5.207 : 5.207, -6.518)} ${zoneXY(p, flip ? -5.207 : 5.207, -3.851)} ${zoneXY(p, flip ? -3.429 : 3.429, -3.851)})))`,
    );
    fp.push(
      `(zone (net 0) (net_name "") (layer "${flip ? "B.Cu" : "F.Cu"}") (hatch full 0.508) (connect_pads (clearance 0)) (min_thickness 0.01) (keepout (tracks not_allowed) (vias not_allowed) (pads not_allowed) (copperpour not_allowed) (footprints allowed)) (fill (thermal_gap 0.508) (thermal_bridge_width 0.508)) (polygon (pts ${zoneXY(p, flip ? -3.429 : 3.429, -10.582)} ${zoneXY(p, flip ? -5.207 : 5.207, -10.582)} ${zoneXY(p, flip ? -5.207 : 5.207, -7.915)} ${zoneXY(p, flip ? -3.429 : 3.429, -7.915)})))`,
    );
    fp.push(
      `(zone (net 0) (net_name "") (layer "${flip ? "B.Cu" : "F.Cu"}") (hatch full 0.508) (connect_pads (clearance 0)) (min_thickness 0.01) (keepout (tracks not_allowed) (vias not_allowed) (pads not_allowed) (copperpour not_allowed) (footprints allowed)) (fill (thermal_gap 0.508) (thermal_bridge_width 0.508)) (polygon (pts ${zoneXY(p, flip ? 2.54 : -2.54, -9.82)} ${zoneXY(p, flip ? -2.54 : 2.54, -9.82)} ${zoneXY(p, flip ? -2.54 : 2.54, -5.375)} ${zoneXY(p, flip ? 2.54 : -2.54, -5.375)})))`,
    );
    fp.push(
      `(zone (net 0) (net_name "") (layers "*.Cu") (hatch full 0.508) (connect_pads (clearance 0)) (min_thickness 0.01) (keepout (tracks allowed) (vias not_allowed) (pads allowed) (copperpour allowed) (footprints allowed)) (fill (thermal_gap 0.508) (thermal_bridge_width 0.508)) (polygon (pts ${zoneXY(p, flip ? 2.54 : -2.54, 7.325)} ${zoneXY(p, flip ? -3.175 : 3.175, 7.325)} ${zoneXY(p, flip ? -3.175 : 3.175, 9.865)} ${zoneXY(p, flip ? 2.54 : -2.54, 9.865)})))`,
    );
    fp.push(
      `(zone (net 0) (net_name "") (layers "*.Cu") (hatch full 0.508) (connect_pads (clearance 0)) (min_thickness 0.01) (keepout (tracks allowed) (vias not_allowed) (pads allowed) (copperpour allowed) (footprints allowed)) (fill (thermal_gap 0.508) (thermal_bridge_width 0.508)) (polygon (pts ${zoneXY(p, flip ? 5.207 : -5.207, -10.582)} ${zoneXY(p, flip ? 3.429 : -3.429, -10.582)} ${zoneXY(p, flip ? 3.429 : -3.429, -7.915)} ${zoneXY(p, flip ? 5.207 : -5.207, -7.915)})))`,
    );
    fp.push(
      `(zone (net 0) (net_name "") (layers "*.Cu") (hatch full 0.508) (connect_pads (clearance 0)) (min_thickness 0.01) (keepout (tracks allowed) (vias not_allowed) (pads allowed) (copperpour allowed) (footprints allowed)) (fill (thermal_gap 0.508) (thermal_bridge_width 0.508)) (polygon (pts ${zoneXY(p, flip ? 5.207 : -5.207, -6.518)} ${zoneXY(p, flip ? 3.429 : -3.429, -6.518)} ${zoneXY(p, flip ? 3.429 : -3.429, -3.851)} ${zoneXY(p, flip ? 5.207 : -5.207, -3.851)})))`,
    );
    fp.push(
      `(zone (net 0) (net_name "") (layers "*.Cu") (hatch full 0.508) (connect_pads (clearance 0)) (min_thickness 0.01) (keepout (tracks allowed) (vias not_allowed) (pads allowed) (copperpour allowed) (footprints allowed)) (fill (thermal_gap 0.508) (thermal_bridge_width 0.508)) (polygon (pts ${zoneXY(p, flip ? -3.429 : 3.429, -6.518)} ${zoneXY(p, flip ? -5.207 : 5.207, -6.518)} ${zoneXY(p, flip ? -5.207 : 5.207, -3.851)} ${zoneXY(p, flip ? -3.429 : 3.429, -3.851)})))`,
    );
    fp.push(
      `(zone (net 0) (net_name "") (layers "*.Cu") (hatch full 0.508) (connect_pads (clearance 0)) (min_thickness 0.01) (keepout (tracks allowed) (vias not_allowed) (pads allowed) (copperpour allowed) (footprints allowed)) (fill (thermal_gap 0.508) (thermal_bridge_width 0.508)) (polygon (pts ${zoneXY(p, flip ? -3.429 : 3.429, -10.582)} ${zoneXY(p, flip ? -5.207 : 5.207, -10.582)} ${zoneXY(p, flip ? -5.207 : 5.207, -7.915)} ${zoneXY(p, flip ? -3.429 : 3.429, -7.915)})))`,
    );
    fp.push(
      `(zone (net 0) (net_name "") (layers "*.Cu") (hatch full 0.508) (connect_pads (clearance 0)) (min_thickness 0.01) (keepout (tracks allowed) (vias not_allowed) (pads allowed) (copperpour allowed) (footprints allowed)) (fill (thermal_gap 0.508) (thermal_bridge_width 0.508)) (polygon (pts ${zoneXY(p, flip ? 2.54 : -2.54, -9.82)} ${zoneXY(p, flip ? -2.54 : 2.54, -9.82)} ${zoneXY(p, flip ? -2.54 : 2.54, -5.375)} ${zoneXY(p, flip ? 2.54 : -2.54, -5.375)})))`,
    );
    // 3D Models
    fp.push(
      `(model "\${KIPRJMOD}/models/xiao.step" (offset (xyz 0 0 0)) (scale (xyz 1 1 1)) (rotate (xyz -90 0 0)))`,
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
function zoneXY(point, offsetX, offsetY) {
  const rad = (-point.rot * Math.PI) / 180;
  const x = point.x + offsetX * Math.cos(rad) - offsetY * Math.sin(rad);
  const y = point.y + offsetX * Math.sin(rad) + offsetY * Math.cos(rad);
  return `(xy ${x.toFixed(3)} ${y.toFixed(3)})`;
}
