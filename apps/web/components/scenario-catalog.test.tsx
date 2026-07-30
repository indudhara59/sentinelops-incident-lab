import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { scenarios, serviceTypes } from "@/data/scenarios";
import { ScenarioCatalog } from "./scenario-catalog";

function setup() {
  const user = userEvent.setup();
  render(<ScenarioCatalog scenarios={scenarios} serviceTypes={serviceTypes} />);
  return user;
}
function cardTitles() {
  return screen
    .queryAllByRole("heading", { level: 3 })
    .map((heading) => heading.textContent);
}

describe("scenario catalog", () => {
  it("searches titles and objectives", async () => {
    const user = setup();
    await user.type(
      screen.getByRole("searchbox", { name: "Search scenarios" }),
      "queue depth",
    );
    expect(
      screen.getByRole("heading", { name: "Queue at the Breaking Point" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Memory Under Pressure" }),
    ).not.toBeInTheDocument();
  });

  it.each([
    ["Difficulty", "Beginner", "Memory Under Pressure"],
    ["Incident category", "Authentication", "The Authentication Storm"],
    ["Service type", "Integration", "Queue at the Breaking Point"],
    ["Estimated duration", "More than 45 min", "Cascading Checkout Failure"],
  ])("filters by %s", async (label, option, expected) => {
    const user = setup();
    await user.selectOptions(
      screen.getByRole("combobox", { name: label }),
      option,
    );
    expect(screen.getByRole("heading", { name: expected })).toBeInTheDocument();
  });

  it("sorts by title and duration", async () => {
    const user = setup();
    const sort = screen.getByRole("combobox", { name: "Sort by" });
    await user.selectOptions(sort, "Title");
    expect(cardTitles()[0]).toBe("Cascading Checkout Failure");
    await user.selectOptions(sort, "Duration");
    expect(cardTitles()[0]).toBe("Memory Under Pressure");
  });

  it("resets filters and announces an empty result", async () => {
    const user = setup();
    await user.type(
      screen.getByRole("searchbox", { name: "Search scenarios" }),
      "not-a-scenario",
    );
    expect(
      screen.getByRole("heading", {
        name: "No scenarios match those filters.",
      }),
    ).toBeInTheDocument();
    await user.click(
      screen.getAllByRole("button", { name: "Reset filters" })[1]!,
    );
    expect(screen.getByText("5 scenarios")).toBeInTheDocument();
  });

  it("has labelled keyboard-accessible controls and real briefing links", async () => {
    const user = setup();
    await user.tab();
    expect(
      screen.getByRole("searchbox", { name: "Search scenarios" }),
    ).toHaveFocus();
    const card = screen
      .getByRole("heading", { name: "The Midnight Latency Incident" })
      .closest("article");
    expect(
      within(card as HTMLElement).getByRole("link", { name: "View Briefing" }),
    ).toHaveAttribute("href", "/scenarios/midnight-latency-incident");
  });
});
