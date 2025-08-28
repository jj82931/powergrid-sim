import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SweepChart from "./components/SweepChart";

test("shows hosting capacity after sweep", async () => {
  const resp = {
    points: [
      { pv: 0, violations: 0 },
      { pv: 0.5, violations: 0 },
      { pv: 1, violations: 2 },
    ],
    hosting_capacity: 0.5,
  };
  // @ts-ignore
  global.fetch = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => resp });

  render(<SweepChart feeder="feeder_00" hours={[28, 48, 74]} />);
  await userEvent.click(screen.getByRole("button", { name: /run pv sweep/i }));
  await screen.findByText(/Hosting capacity:/i);
});
