import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all page components before any imports
vi.mock("@/app/routes/LandingPage", () => ({
	LandingPage: () => <div data-testid="page-landing">Landing Page</div>,
}));
vi.mock("@/app/routes/EditorPage", () => ({
	EditorPage: () => <div data-testid="page-editor">Editor Page</div>,
}));
vi.mock("@/app/routes/GalleryPage", () => ({
	GalleryPage: () => <div data-testid="page-gallery">Gallery Page</div>,
}));
vi.mock("@/app/routes/ImageConverterPage", () => ({
	ImageConverterPage: () => <div data-testid="page-converter">Converter Page</div>,
}));
vi.mock("@/app/routes/CalculatorsPage", () => ({
	CalculatorsPage: () => <div data-testid="page-calculators">Calculators Page</div>,
}));
vi.mock("@/app/routes/SettingsPage", () => ({
	SettingsPage: () => <div data-testid="page-settings">Settings Page</div>,
}));
vi.mock("@/app/routes/SharedPatternPage", () => ({
	SharedPatternPage: () => <div data-testid="page-shared">Shared Pattern</div>,
}));
vi.mock("@/app/routes/YarnPage", () => ({
	YarnPage: () => <div data-testid="page-yarn">Yarn Page</div>,
}));
vi.mock("@/app/routes/StitchesPage", () => ({
	StitchesPage: () => <div data-testid="page-stitches">Stitches Page</div>,
}));
vi.mock("@/app/routes/HelpPage", () => ({
	HelpPage: () => <div data-testid="page-help">Help Page</div>,
}));
vi.mock("@/app/routes/AboutPage", () => ({
	AboutPage: () => <div data-testid="page-about">About Page</div>,
}));

import { MemoryRouter } from "react-router-dom";
import { AppLayout } from "@/app/layout/AppLayout";

function renderWithRouter(initialEntry = "/") {
	return render(
		<MemoryRouter initialEntries={[initialEntry]}>
			<AppLayout />
		</MemoryRouter>,
	);
}

describe("AppLayout", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the landing page at /", async () => {
		renderWithRouter("/");
		await waitFor(() => {
			expect(screen.getByTestId("page-landing")).toBeInTheDocument();
		}, { timeout: 3000 });
	});

	it("renders the editor page at /editor without TopNav", async () => {
		renderWithRouter("/editor");
		await waitFor(() => {
			expect(screen.getByTestId("page-editor")).toBeInTheDocument();
		}, { timeout: 3000 });
		expect(screen.queryByText("PatternForge")).not.toBeInTheDocument();
	});

	it("renders the gallery page at /gallery", async () => {
		renderWithRouter("/gallery");
		await waitFor(() => {
			expect(screen.getByTestId("page-gallery")).toBeInTheDocument();
		}, { timeout: 3000 });
	});

	it("renders the calculators page at /calculators", async () => {
		renderWithRouter("/calculators");
		await waitFor(() => {
			expect(screen.getByTestId("page-calculators")).toBeInTheDocument();
		}, { timeout: 3000 });
	});

	it("renders the yarn page at /yarn", async () => {
		renderWithRouter("/yarn");
		await waitFor(() => {
			expect(screen.getByTestId("page-yarn")).toBeInTheDocument();
		}, { timeout: 3000 });
	});

	it("renders the stitches page at /stitches", async () => {
		renderWithRouter("/stitches");
		await waitFor(() => {
			expect(screen.getByTestId("page-stitches")).toBeInTheDocument();
		}, { timeout: 3000 });
	});

	it("renders the help page at /help", async () => {
		renderWithRouter("/help");
		await waitFor(() => {
			expect(screen.getByTestId("page-help")).toBeInTheDocument();
		}, { timeout: 3000 });
	});

	it("renders the about page at /about", async () => {
		renderWithRouter("/about");
		await waitFor(() => {
			expect(screen.getByTestId("page-about")).toBeInTheDocument();
		}, { timeout: 3000 });
	});

	it("renders the settings page at /settings", async () => {
		renderWithRouter("/settings");
		await waitFor(() => {
			expect(screen.getByTestId("page-settings")).toBeInTheDocument();
		}, { timeout: 3000 });
	});

	it("renders the 404 page for unknown routes", async () => {
		renderWithRouter("/nonexistent-page");
		await waitFor(() => {
			expect(screen.getByText("404")).toBeInTheDocument();
		}, { timeout: 3000 });
	});
});
