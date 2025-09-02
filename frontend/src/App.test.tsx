import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "./App";

vi.mock("./services/api", () => ({
  getFeeders: vi
    .fn()
    .mockResolvedValue({ feeders: ["feeder_00", "feeder_01"] }),
  postSim: vi.fn().mockResolvedValue({
    feeder_id: "feeder_00",
    hour: 12,
    transformer_loading: 0.12,
    min_voltage_pu: 0.98,
    voltage_violation: 0,
    advice: "OK",
  }),
}));

it("loads feeders and runs simulate", async () => {
  render(<App />);
  // 드롭다운 값이 채워질 때까지 대기
  await screen.findByDisplayValue(/feeder_00/i);
  fireEvent.click(screen.getByRole("button", { name: /run simulation/i }));
  await waitFor(() =>
    expect(screen.getByText(/transformer loading/i)).toBeInTheDocument()
  );
});
