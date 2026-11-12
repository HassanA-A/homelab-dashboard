import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/dates";
import { KG_PER_LB } from "@/lib/units";
import { computeAdaptive, classifyRate } from "./adaptive";
import { weightSeries } from "./weight";
import { estimated1RM, volume, workingSetCount } from "./strength";

const today = "2026-11-12";

function scenario(lbPerWeek: number, intake: number, days = 28) {
  const weighIns = [];
  const food = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    const t = days - 1 - i;
    // daily noise ±0.4 lb, deterministic
    const noise = Math.sin(t * 1.7) * 0.4;
    weighIns.push({ local_date: date, weight_kg: (170 + (lbPerWeek / 7) * t + noise) * KG_PER_LB });
    food.push({ date, calories: intake, complete: true });
  }
  return { weighIns, intake: food };
}

describe("adaptive recommendations", () => {
  it("insufficient data with only a few days", () => {
    const s = scenario(0, 2600, 5);
    const r = computeAdaptive({ today, ...s, goalType: "slight_surplus", currentTarget: 2600 });
    expect(r.confidence).toBe("insufficient");
    expect(r.suggestedTarget).toBeNull();
  });

  it("stable weight on a surplus goal suggests a modest increase", () => {
    const s = scenario(0, 2600);
    const r = computeAdaptive({ today, ...s, goalType: "slight_surplus", currentTarget: 2600 });
    expect(r.status).toBe("stable");
    expect(r.estimatedMaintenance).toBeGreaterThan(2500);
    expect(r.estimatedMaintenance).toBeLessThan(2700);
    expect(r.suggestedTarget).toBeGreaterThan(2600);
    expect(r.suggestedTarget! - 2600).toBeLessThanOrEqual(200);
  });

  it("gaining at 0.375 lb/week is on target", () => {
    const s = scenario(0.375, 2800);
    const r = computeAdaptive({ today, ...s, goalType: "slight_surplus", currentTarget: 2800 });
    expect(r.status).toBe("increasing_slowly");
    expect(r.suggestedTarget).toBeNull();
  });

  it("gaining too fast suggests a reduction", () => {
    const s = scenario(1.2, 3200);
    const r = computeAdaptive({ today, ...s, goalType: "slight_surplus", currentTarget: 3200 });
    expect(r.status).toBe("increasing_quickly");
    expect(r.suggestedTarget).toBeLessThan(3200);
  });

  it("incomplete days are ignored", () => {
    const s = scenario(0, 2600);
    s.intake = s.intake.map((d) => ({ ...d, complete: false }));
    const r = computeAdaptive({ today, ...s, goalType: "slight_surplus", currentTarget: 2600 });
    expect(r.confidence).toBe("insufficient");
  });

  it("classifies rates", () => {
    expect(classifyRate(-0.5)).toBe("decreasing");
    expect(classifyRate(0.05)).toBe("stable");
    expect(classifyRate(0.4)).toBe("increasing_slowly");
    expect(classifyRate(1)).toBe("increasing_quickly");
  });
});

describe("weight series", () => {
  it("one spike barely moves the trend", () => {
    const s = weightSeries([
      { local_date: "2026-11-01", weight_kg: 80 },
      { local_date: "2026-11-02", weight_kg: 80 },
      { local_date: "2026-11-03", weight_kg: 82 },
    ]);
    expect(s.at(-1)!.trend).toBeCloseTo(80.2, 5);
    expect(s).toHaveLength(3);
  });
  it("averages multiple weigh-ins per day and fills gaps", () => {
    const s = weightSeries([
      { local_date: "2026-11-01", weight_kg: 80 },
      { local_date: "2026-11-01", weight_kg: 81 },
      { local_date: "2026-11-04", weight_kg: 80 },
    ]);
    expect(s[0]!.scale).toBe(80.5);
    expect(s).toHaveLength(4);
    expect(s[1]!.scale).toBeNull();
  });
});

describe("strength", () => {
  it("epley with RIR", () => {
    expect(estimated1RM(100, 5, 0)).toBeCloseTo(116.67, 1);
    expect(estimated1RM(100, 5, 2)).toBeCloseTo(123.33, 1);
    expect(estimated1RM(100, 15)).toBeNull();
  });
  it("warm-ups don't count toward volume or working sets", () => {
    const sets = [
      { set_type: "warmup" as const, weight_kg: 40, reps: 10 },
      { set_type: "working" as const, weight_kg: 60, reps: 8 },
      { set_type: "failure" as const, weight_kg: 60, reps: 6 },
    ];
    expect(volume(sets)).toBe(840);
    expect(workingSetCount(sets)).toBe(2);
  });
});
