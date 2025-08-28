import { render } from "@testing-library/react";
import SvgLineView from "./SvgLineView";
import type { Network } from "../services/api";

test("renders same number of lines as network", () => {
  const mock: Network = {
    feeder_id: "feeder_x",
    base_kv: 0.4,
    buses: [
      { id: "bus_0", x: 0, y: 0 },
      { id: "bus_1", x: 1, y: 0 },
      { id: "bus_2", x: 1, y: 1 },
    ],
    lines: [
      { from: "bus_0", to: "bus_1" },
      { from: "bus_1", to: "bus_2" },
    ],
  };
  const { container } = render(
    <SvgLineView feeder="feeder_x" network={mock} />
  );
  const lines = container.querySelectorAll("line");
  expect(lines.length).toBe(mock.lines.length);
});
