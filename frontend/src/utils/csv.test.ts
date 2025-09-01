import { toCSV } from "./csv";

test("toCSV returns header and one row", () => {
  const csv = toCSV([
    { feeder_id: "feeder_00", hour: 12, transformer_loading: 0.5 },
  ]);
  expect(csv.split("\n")[0]).toBe("feeder_id,hour,transformer_loading");
  expect(csv).toContain("feeder_00,12,0.5");
});
