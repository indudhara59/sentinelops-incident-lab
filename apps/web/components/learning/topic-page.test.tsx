import { render, screen } from "@testing-library/react";
import { TopicPage } from "./topic-page";
import { getLearningTopic } from "@/lib/learning/content";

describe("learning topic navigation", () => {
  it("renders accessible topic navigation and expandable detail", () => {
    render(<TopicPage topic={getLearningTopic("observability")!} />);
    expect(
      screen.getByRole("navigation", { name: "Learning topics" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Observability as a way to ask questions",
      }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByText("Technical detail: instrumentation"),
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link", { name: /Metrics/ })
        .some((link) => link.getAttribute("href") === "/learn/metrics"),
    ).toBe(true);
  });

  it("renders glossary terms as addressable definitions", () => {
    const { container } = render(
      <TopicPage topic={getLearningTopic("glossary")!} />,
    );
    expect(screen.getByText("correlation")).toBeInTheDocument();
    expect(container.querySelector("#service-level-indicator")).not.toBeNull();
  });
});
