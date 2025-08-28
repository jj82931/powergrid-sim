import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CompareTab from "./components/CompareTab";

test("runs compare across feeders", async () => {
  // mock two simulate calls
  const sim1 = {
    feeder_id: "feeder_00",
    transformer_loading: 0.5,
    min_voltage_pu: 0.98,
    voltage_violation: 0,
  };
  const sim2 = {
    feeder_id: "feeder_01",
    transformer_loading: 0.6,
    min_voltage_pu: 0.97,
    voltage_violation: 1,
  };
  // @ts-ignore
  global.fetch = vi
    .fn()
    // first simulate
    .mockResolvedValueOnce({ ok: true, json: async () => sim1 })
    // second simulate
    .mockResolvedValueOnce({ ok: true, json: async () => sim2 });

  render(
    <CompareTab
      feeders={["feeder_00", "feeder_01"]}
      pv={0.3}
      bat={0.1}
      hour={12}
    />
  );
  await userEvent.click(screen.getByRole("button", { name: /run compare/i }));
  await waitFor(() => {
    expect(screen.getByText("feeder_00")).toBeInTheDocument();
    expect(screen.getByText("feeder_01")).toBeInTheDocument();
  });
});
