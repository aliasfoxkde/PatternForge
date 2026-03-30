import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TopNav } from "@/shared/ui/TopNav";
import { useSettingsStore } from "@/shared/stores/settings-store";

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
	NavLink: ({
		children,
		to,
		className,
		...rest
	}: {
		children: React.ReactNode;
		to: string;
		className?: string | ((args: { isActive: boolean }) => string);
		[key: string]: unknown;
	}) => {
		// Simulate an active state for the "/" route
		const isActive = to === "/";
		const resolvedClass = typeof className === "function" ? className({ isActive }) : className ?? "";
		return (
			<a
				href={to}
				data-active={isActive ? "true" : "false"}
				className={resolvedClass}
				{...rest}
			>
				{children}
			</a>
		);
	},
	useNavigate: () => mockNavigate,
}));

describe("TopNav", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useSettingsStore.setState({ theme: "system" });
	});

	it("renders the PatternForge brand", () => {
		render(<TopNav />);
		const brand = screen.getByText("PatternForge");
		expect(brand).toBeInTheDocument();
	});

	it("renders all navigation links", () => {
		render(<TopNav />);
		// MobileMenu also renders nav links, so use getAllByText
		expect(screen.getAllByText("Editor").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("Gallery").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("Calculators").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("Threads").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("Stitches").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("Help").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("Settings").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("About").length).toBeGreaterThanOrEqual(1);
	});

	it("renders the theme toggle button", () => {
		render(<TopNav />);
		const themeBtn = screen.getByTitle(/Theme:/i);
		expect(themeBtn).toBeInTheDocument();
	});

	it("renders the mobile menu hamburger button", () => {
		render(<TopNav />);
		const hamburger = screen.getByLabelText("Open menu");
		expect(hamburger).toBeInTheDocument();
	});

	it("cycles theme on toggle click", async () => {
		const user = userEvent.setup();
		render(<TopNav />);

		const themeBtn = screen.getByTitle(/Theme:/i);
		expect(useSettingsStore.getState().theme).toBe("system");

		await user.click(themeBtn);
		expect(useSettingsStore.getState().theme).toBe("light");

		await user.click(themeBtn);
		expect(useSettingsStore.getState().theme).toBe("dark");

		await user.click(themeBtn);
		expect(useSettingsStore.getState().theme).toBe("system");
	});
});
