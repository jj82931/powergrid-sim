import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

test("loads feeders and runs simulate", async () => {
  const feedersResp = { feeders: ["feeder_00"] };
  const simResp = {
    feeder_id: "feeder_00",
    hour: 12,
    transformer_loading: 0.5,
    min_voltage_pu: 0.98,
    voltage_violation: 0,
  };
  // @ts-ignore
  global.fetch = vi
    .fn()
    // @ts-ignore
    .mockResolvedValueOnce({ ok: true, json: async () => feedersResp })
    // @ts-ignore
    .mockResolvedValueOnce({ ok: true, json: async () => simResp });

  render(<App />);

  await screen.findByDisplayValue("feeder_00");

  const btn = screen.getByTestId("run-sim"); // 라벨 의존 대신 testid 고정
  await userEvent.click(btn);

  await waitFor(() => {
    // "Run" 버튼 클릭 후
    // 기존:
    // expect(screen.getByText(/Transformer loading/i)).toBeInTheDocument()
    // expect(screen.getByText(/0.5/)).toBeInTheDocument()

    // 변경: 라벨과 값을 한 줄로 정확 매칭
    expect(
      screen.getByText(/^Transformer loading:\s*0\.5$/i)
    ).toBeInTheDocument();
  });
});
