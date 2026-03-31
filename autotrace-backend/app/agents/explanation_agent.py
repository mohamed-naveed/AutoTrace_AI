"""
ExplanationAgent — generates a rich, human-readable explanation of how
the cost estimate was produced. Covers both 'new' and 'extension' scenarios.
"""
from typing import Dict, Any


class ExplanationAgent:
    def process(self, dna: Dict[str, Any]) -> str:
        try:
            fc       = dna.get("final_cost", {})
            mat      = dna.get("derived_materials", {})
            lab      = dna.get("labor_calculation", {})
            mflags   = dna.get("material_flags", {})
            mults    = dna.get("multipliers_applied", {})
            vr       = dna.get("validation_result", {})
            ai       = dna.get("ai_prediction", {})
            inp      = dna.get("inputs", {})

            project_type = inp.get("project_type", "new").lower()
            build_type   = inp.get("build_type",   "overhead").lower()
            area_type    = inp.get("area_type",     "urban").lower()
            complexity   = inp.get("complexity",    "low").lower()
            dist_km      = inp.get("distance_km",   0)
            is_ext       = (project_type == "extension")

            total     = fc.get("total_cost",      0)
            mat_cost  = fc.get("material_cost",   0)
            lab_cost  = fc.get("labor_cost",       0)
            perm_cost = fc.get("permission_cost",  0)
            equip_cost= fc.get("equipment_cost",   0)
            cpkm      = fc.get("cost_per_km",      0)

            cable  = mat.get("cable_length",  0)
            poles  = mat.get("poles",         0)
            ducts  = mat.get("duct_sections", 0)
            jboxes = mat.get("joint_boxes",   0)

            base_d    = lab.get("base_days",             0)
            final_d   = lab.get("final_days",            0)
            prod      = lab.get("productivity",          500)
            c_mult    = lab.get("complexity_multiplier", 1.0)
            ext_fact  = lab.get("extension_factor",      1.0)

            conf     = vr.get("confidence", "High")
            dev_pct  = vr.get("deviation_percentage", 0)
            flags    = vr.get("flags", [])
            ai_cost  = ai.get("ai_predicted_cost", 0)
            ai_diff  = ai.get("prediction_difference", 0) * 100

            # ── Build the explanation ─────────────────────────────────────
            lines = []

            # Scenario header
            if is_ext:
                lines.append(
                    f"This is an EXTENSION project — FTTP infrastructure already exists "
                    f"at the premises and this estimate covers only the incremental cost "
                    f"to extend the network by {dist_km} km."
                )
            else:
                lines.append(
                    f"This is a NEW DEPLOYMENT project covering a full {dist_km} km "
                    f"FTTP cable route using {build_type} construction in a {area_type} area."
                )

            # Distance → metres
            lines.append(
                f"The {dist_km} km route is converted to {dist_km * 1000:,.0f} metres for calculations "
                f"(Rule 1: Distance_m = Distance_km × 1000)."
            )

            # Material section
            if build_type == "overhead":
                lines.append(
                    f"Material estimation: Cable length = {cable:,.1f} m (route × 1.05 wastage buffer). "
                    f"{poles:,.0f} poles required at 1 per 50 m spacing."
                )
            else:
                lines.append(
                    f"Material estimation: Cable length = {cable:,.1f} m (route × 1.05 wastage buffer). "
                    f"{ducts:,.0f} duct sections required at 1 per 100 m."
                )
            lines.append(f"{jboxes:,.1f} joint boxes required at 1 per 500 m.")

            if mflags.get("underground_uplift_applied"):
                lines.append(
                    "Underground new-deployment surcharge of ×1.30 applied to material cost "
                    "(Rule 14 — covers additional civil works for new duct laying)."
                )

            if mflags.get("extension_reduction_applied"):
                factor_pct = int(round((1 - mflags.get("extension_material_factor", 0.7)) * 100))
                lines.append(
                    f"Extension discount of {factor_pct}% applied to material cost — "
                    f"existing ONU, indoor wiring, splice box, and entry point infrastructure "
                    f"is already in place and does not need to be re-provisioned."
                )

            mat_pct = (mat_cost / total * 100) if total > 0 else 0
            lines.append(f"Total material cost = ₹{mat_cost:,.0f} ({mat_pct:.1f}% of total).")

            # Labour section
            lines.append(
                f"Labour: at {prod:,.0f} m/day productivity ({build_type}), "
                f"{dist_km * 1000:,.0f} m requires {base_d:.2f} base days."
            )
            lines.append(
                f"Complexity multiplier ({complexity}) = ×{c_mult:.1f}, giving {base_d * c_mult:.2f} adjusted days."
            )
            if is_ext:
                lines.append(
                    f"Extension factor ×{ext_fact:.1f} applied (Rule 11) — extension work is "
                    f"faster because core infrastructure exists. Final labour days = {final_d:.2f}."
                )
            else:
                lines.append(
                    f"Area multiplier ({area_type}) = ×{mults.get('area_multiplier', 1.0):.1f} applied (Rule 10). "
                    f"Final labour days = {final_d:.2f}."
                )
            lab_pct = (lab_cost / total * 100) if total > 0 else 0
            lines.append(f"Total labour cost = ₹{lab_cost:,.0f} ({lab_pct:.1f}% of total).")

            # Overheads
            if perm_cost > 0:
                lines.append(
                    f"Permission cost = ₹{perm_cost:,.0f} (Rule 15: 5% of material + labour)."
                )
            if equip_cost > 0:
                lines.append(
                    f"Equipment cost = ₹{equip_cost:,.0f} (Rule 16: equipment rate × final days)."
                )

            # Totals
            lines.append(
                f"Total estimated cost = ₹{total:,.0f} (Rule 17: sum of all components). "
                f"Cost per km = ₹{cpkm:,.0f} (Rule 18)."
            )

            # Validation
            if ai_cost > 0:
                lines.append(
                    f"Validation (Rule 19): The rule-based estimation produced ₹{total:,.0f} "
                    f"while the AI model predicted ₹{ai_cost:,.0f} based on historical "
                    f"FTTP deployments. The difference is {ai_diff:.1f}%, resulting in a {conf.lower()} confidence estimate."
                )
            else:
                lines.append(
                    f"Validation (Rule 19): {conf} confidence — {dev_pct:.1f}% deviation from "
                    f"India FTTP baseline of ₹1,20,000/km."
                )
            if flags:
                lines.append("Flags: " + " | ".join(flags))

            return " ".join(lines)

        except Exception as e:
            return f"Explanation could not be generated: {str(e)}"
