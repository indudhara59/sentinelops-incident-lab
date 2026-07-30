import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { TopologyPreview } from "./topology-preview";

vi.mock("framer-motion", () => ({
  motion: new Proxy({}, { get: (_, element) => element }),
  useReducedMotion: () => true,
}));

it("keeps the topology legible when reduced motion is preferred", () => {
  render(<TopologyPreview />);
  expect(
    screen.getByLabelText(/simulated service topology/i),
  ).toBeInTheDocument();
  expect(screen.getByText("Order service")).toBeVisible();
  expect(
    screen.getByRole("img", { name: /latency rose sharply/i }),
  ).toBeInTheDocument();
});
