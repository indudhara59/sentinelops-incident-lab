import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/site-header";
import Home from "./page";

describe("homepage", () => {
  it("renders its main purpose and capability content", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /learn incident response/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Every signal tells part of the story.",
      }),
    ).toBeInTheDocument();
  });

  it("provides primary calls to action with real routes", () => {
    render(<Home />);
    expect(
      screen.getByRole("link", { name: /start investigation/i }),
    ).toHaveAttribute("href", "/lab");
    expect(
      screen.getByRole("link", { name: /explore scenarios/i }),
    ).toHaveAttribute("href", "/scenarios");
  });

  it("states the safety boundary", () => {
    render(<Home />);
    expect(
      screen.getByText("No connection to real infrastructure"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Not a penetration-testing platform"),
    ).toBeInTheDocument();
  });
});

describe("navigation and theme", () => {
  it("renders accessible navigation", () => {
    render(
      <ThemeProvider>
        <SiteHeader />
      </ThemeProvider>,
    );
    expect(
      screen.getByRole("navigation", { name: "Primary navigation" }),
    ).toBeInTheDocument();
    expect(
      screen
        .getByRole("navigation", { name: "Primary navigation" })
        .querySelector('a[href="/scenarios"]'),
    ).toBeInTheDocument();
  });

  it("allows selecting a theme", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <SiteHeader />
      </ThemeProvider>,
    );
    const selector = screen.getByRole("combobox", {
      name: "Select color theme",
    });
    await user.selectOptions(selector, "light");
    expect(selector).toHaveValue("light");
  });
});
