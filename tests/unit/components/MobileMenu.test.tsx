import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { MobileMenu, useMobileMenuToggle } from "@/shared/ui/MobileMenu";
import { useSettingsStore } from "@/shared/stores/settings-store";

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
	NavLink: ({
		children,
		to,
		className,
		onClick,
		...rest
	}: {
		children: React.ReactNode;
		to: string;
		className?: string | ((args: { isActive: boolean }) => string);
		onClick?: () => void;
		[key: string]: unknown;
	}) => {
		const isActive = to === "/";
		const resolvedClass = typeof className === "function" ? className({ isActive }) : className ?? "";
		return (
			<a
				href={to}
				data-active={isActive ? "true" : "false"}
				className={resolvedClass}
				onClick={(e: React.MouseEvent) => {
					e.preventDefault();
					onClick?.();
				}}
				{...rest}
			>
				{children}
			</a>
		);
	},
}));

describe("MobileMenu", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useSettingsStore.setState({ theme: "system" });
		document.body.style.overflow = "";
	});

	it("renders without crashing", () => {
		render(<MobileMenu />);
		// Component renders — the drawer exists but is translated off-screen
		expect(screen.getByRole("dialog")).toBeInTheDocument();
	});

	it("drawer is off-screen when closed", () => {
		render(<MobileMenu />);
		const dialog = screen.getByRole("dialog");
		// When closed, the drawer has translate-x-full class
		expect(dialog.className).toContain("translate-x-full");
	});

	it("opens when toggle is called", () => {
		render(<MobileMenu />);
		act(() => {
			useMobileMenuToggle()();
		});
		const dialog = screen.getByRole("dialog");
		expect(dialog.className).toContain("translate-x-0");
		expect(screen.getByText("Menu")).toBeInTheDocument();
	});

	it("closes when close button is clicked", async () => {
		const user = userEvent.setup();
		render(<MobileMenu />);
		act(() => {
			useMobileMenuToggle()();
		});

		const closeBtn = screen.getByRole("button", { name: /close menu/i });
		await user.click(closeBtn);

		const dialog = screen.getByRole("dialog");
		expect(dialog.className).toContain("translate-x-full");
	});

	it("renders all navigation links when open", () => {
		render(<MobileMenu />);
		act(() => {
			useMobileMenuToggle()();
		});

		expect(screen.getByText("Editor")).toBeInTheDocument();
		expect(screen.getByText("Gallery")).toBeInTheDocument();
		expect(screen.getByText("Calculators")).toBeInTheDocument();
		expect(screen.getByText("Help")).toBeInTheDocument();
		expect(screen.getByText("Settings")).toBeInTheDocument();
		expect(screen.getByText("About")).toBeInTheDocument();
	});

	it("renders theme toggle at bottom of drawer", () => {
		render(<MobileMenu />);
		act(() => {
			useMobileMenuToggle()();
		});

		expect(screen.getByText(/Theme:/i)).toBeInTheDocument();
	});

	it("has aria-modal on the drawer", () => {
		render(<MobileMenu />);
		const dialog = screen.getByRole("dialog");
		expect(dialog).toHaveAttribute("aria-modal", "true");
	});
});
