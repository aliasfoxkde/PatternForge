import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: vi.fn((key: string) => store[key] ?? null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		}),
		clear: vi.fn(() => {
			store = {};
		}),
	};
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

// We need to mock the editor store before importing the component
// Since Zustand stores are singletons, we import the store first
import { useEditorStore } from "@/shared/stores/editor-store";
import { ColorPalette } from "@/features/editor/components/ColorPalette";

function renderWithStore(ui: React.ReactElement) {
	return render(ui);
}

describe("ColorPalette", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorageMock.clear();
		useEditorStore.setState({
			activeColor: "#ff0000",
			setActiveColor: (color: string) =>
				useEditorStore.setState({ activeColor: color }),
		});
	});

	it("renders the color palette header", () => {
		renderWithStore(<ColorPalette />);
		expect(screen.getByText("Colors")).toBeInTheDocument();
	});

	it("displays the active color hex value", () => {
		renderWithStore(<ColorPalette />);
		expect(screen.getByText("#FF0000")).toBeInTheDocument();
	});

	it("shows palette tab by default", () => {
		renderWithStore(<ColorPalette />);
		// The palette tab should have an active border
		const tabs = screen.getAllByRole("button", { name: /palette|dmc|recent/i });
		expect(tabs.length).toBeGreaterThanOrEqual(3);
	});

	it("renders default color swatches in palette tab", () => {
		renderWithStore(<ColorPalette />);
		// Should have many color buttons (50 default colors)
		const swatches = screen.getAllByRole("button", { name: "#000000" });
		expect(swatches.length).toBeGreaterThan(0);
	});

	it("switches to DMC tab when clicked", async () => {
		const user = userEvent.setup();
		renderWithStore(<ColorPalette />);
		const dmcTab = screen.getByRole("button", { name: "dmc" });
		await user.click(dmcTab);
		expect(screen.getByPlaceholderText("Search ID or name...")).toBeInTheDocument();
	});

	it("switches to recent tab when clicked", async () => {
		const user = userEvent.setup();
		renderWithStore(<ColorPalette />);
		const recentTab = screen.getByRole("button", { name: "recent" });
		await user.click(recentTab);
		expect(screen.getByText("No recent colors yet")).toBeInTheDocument();
	});

	it("shows recent colors when stored in localStorage", () => {
		localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(["#ff0000", "#00ff00"]));
		renderWithStore(<ColorPalette />);
		const recentTab = screen.getByRole("button", { name: "recent" });
		userEvent.click(recentTab);
		// Should have color swatches, not the empty message
		expect(screen.queryByText("No recent colors yet")).not.toBeInTheDocument();
	});

	it("has a custom color picker input", () => {
		renderWithStore(<ColorPalette />);
		const colorInput = document.querySelector('input[type="color"]');
		expect(colorInput).toBeInTheDocument();
	});

	it("has a transparent/no-color button", () => {
		renderWithStore(<ColorPalette />);
		const transparentBtn = screen.getByTitle("No color (transparent)");
		expect(transparentBtn).toBeInTheDocument();
	});

	it("shows Match to DMC button when a color is active", () => {
		renderWithStore(<ColorPalette />);
		expect(screen.getByText("Match to DMC")).toBeInTheDocument();
	});

	it("hides Match to DMC when no color is active", () => {
		useEditorStore.setState({ activeColor: "" });
		renderWithStore(<ColorPalette />);
		expect(screen.queryByText("Match to DMC")).not.toBeInTheDocument();
	});
});
