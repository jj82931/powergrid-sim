import { render, screen, fireEvent } from "@testing-library/react";
// findBy*를 쓰면 별도 waitFor import 필요 없음
import { vi } from "vitest";
import CompareTab from "./components/CompareTab";

// services/api를 테스트용으로 mock
vi.mock("./services/api", () => ({
  postSim: vi.fn().mockImplementation(async ({ feeder_id }) => ({
    feeder_id,
    hour: 12,
    transformer_loading: 0.1,
    min_voltage_pu: 0.99,
    voltage_violation: 0,
    advice: "OK",
  })),
}));

it("runs compare across feeders", async () => {
  // 컴포넌트가 요구하는 props 반드시 전달
  render(
    <CompareTab feeders={["feeder_00", "feeder_01"]} pv={0} bat={0} hour={12} />
  );

  // 버튼 클릭
  const btn = screen.getByRole("button", { name: /run compare/i });
  fireEvent.click(btn);

  // 결과가 나타날 때까지 기다리며 검증
  expect(await screen.findByText(/feeder_01/i)).toBeInTheDocument();
});
