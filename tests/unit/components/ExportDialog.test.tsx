import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock export modules
vi.mock("@/features/export/export-png", () => ({
	exportToPNG: vi.fn(() => "data:image/png;base64,mockdata"),
}));
vi.mock("@/features/export/export-svg", () => ({
	exportToSVG: vi.fn(() => "<svg>mock</svg>"),
}));
vi.mock("@/features/export/export-pdf", () => ({
	exportToPDF: vi.fn(() => Promise.resolve(new Blob(["pdf"], { type: "application/pdf" }))),
}));
vi.mock("@/features/export/export-json", () => ({
	downloadPatternJSON: vi.fn(),
}));
vi.mock("@/features/export/export-csv", () => ({
	downloadPatternCSV: vi.fn(),
}));
vi.mock("@/features/export/export-print", () => ({
	printPattern: vi.fn(),
}));

import { ExportDialog } from "@/features/export/components/ExportDialog";
import { PatternGrid } from "@/engine/grid/grid";

function createMockPattern() {
	const grid = new PatternGrid(10, 10);
	grid.setCell(0, 0, { color: "#ff0000", symbol: null, stitchType: "full", completed: false });
	grid.setCell(1, 1, { color: "#00ff00", symbol: null, stitchType: "full", completed: false });

	return {
		id: "test-id",
		metadata: {
			name: "Test Pattern",
			description: "",
			author: "",
			craftType: "cross-stitch" as const,
			tags: [],
			createdAt: Date.now(),
			updatedAt: Date.now(),
			version: 1,
			cellSize: 20,
			notes: "",
		},
		grid,
		palette: { id: "", name: "", colors: [] },
	};
}

describe("ExportDialog", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders nothing when closed", () => {
		const pattern = createMockPattern();
		const { container } = render(
			<ExportDialog open={false} onClose={() => {}} pattern={pattern} />,
		);
		expect(container.innerHTML).toBe("");
	});

	it("renders the dialog when open", () => {
		const pattern = createMockPattern();
		render(<ExportDialog open={true} onClose={() => {}} pattern={pattern} />);
		expect(screen.getByText("Export Pattern")).toBeInTheDocument();
	});

	it("renders all format options", () => {
		const pattern = createMockPattern();
		render(<ExportDialog open={true} onClose={() => {}} pattern={pattern} />);
		expect(screen.getByText("PNG")).toBeInTheDocument();
		expect(screen.getByText("SVG")).toBeInTheDocument();
		expect(screen.getByText("PDF")).toBeInTheDocument();
		expect(screen.getByText("JSON")).toBeInTheDocument();
		expect(screen.getByText("CSV")).toBeInTheDocument();
	});

	it("selects PNG format by default", () => {
		const pattern = createMockPattern();
		render(<ExportDialog open={true} onClose={() => {}} pattern={pattern} />);
		// PNG should be selected - check the button has active styling
		const pngBtn = screen.getByText("PNG").closest("button");
		expect(pngBtn?.className).toContain("border-craft-500");
	});

	it("changes format when clicked", async () => {
		const user = userEvent.setup();
		const pattern = createMockPattern();
		render(<ExportDialog open={true} onClose={() => {}} pattern={pattern} />);

		await user.click(screen.getByText("PDF"));
		const pdfBtn = screen.getByText("PDF").closest("button");
		expect(pdfBtn?.className).toContain("border-craft-500");
	});

	it("shows cell size slider for image formats", () => {
		const pattern = createMockPattern();
		render(<ExportDialog open={true} onClose={() => {}} pattern={pattern} />);
		expect(screen.getByText("Cell Size (px)")).toBeInTheDocument();
		expect(screen.getByDisplayValue("20")).toBeInTheDocument();
	});

	it("hides cell size slider for JSON and CSV", async () => {
		const user = userEvent.setup();
		const pattern = createMockPattern();
		render(<ExportDialog open={true} onClose={() => {}} pattern={pattern} />);

		await user.click(screen.getByText("JSON"));
		expect(screen.queryByText("Cell Size (px)")).not.toBeInTheDocument();
	});

	it("shows grid lines and symbols checkboxes for image formats", () => {
		const pattern = createMockPattern();
		render(<ExportDialog open={true} onClose={() => {}} pattern={pattern} />);
		expect(screen.getByLabelText("Grid lines")).toBeInTheDocument();
		expect(screen.getByLabelText("Symbols")).toBeInTheDocument();
	});

	it("shows PDF-specific options when PDF selected", async () => {
		const user = userEvent.setup();
		const pattern = createMockPattern();
		render(<ExportDialog open={true} onClose={() => {}} pattern={pattern} />);

		await user.click(screen.getByText("PDF"));
		expect(screen.getByLabelText("Color legend")).toBeInTheDocument();
		expect(screen.getByLabelText("Page size:")).toBeInTheDocument();
	});

	it("shows Cancel and Export buttons", () => {
		const pattern = createMockPattern();
		render(<ExportDialog open={true} onClose={() => {}} pattern={pattern} />);
		expect(screen.getByText("Cancel")).toBeInTheDocument();
		expect(screen.getByText("Export")).toBeInTheDocument();
	});

	it("calls onClose when backdrop is clicked", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		const pattern = createMockPattern();
		const { container } = render(<ExportDialog open={true} onClose={onClose} pattern={pattern} />);

		// The backdrop is a div with bg-black/40 class inside the outer fixed div
		const outerDiv = container.firstElementChild as HTMLElement;
		const backdrop = outerDiv?.children[0] as HTMLElement;
		expect(backdrop).toBeTruthy();
		await user.click(backdrop);
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("calls onClose when Cancel is clicked", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		const pattern = createMockPattern();
		render(<ExportDialog open={true} onClose={onClose} pattern={pattern} />);

		await user.click(screen.getByText("Cancel"));
		expect(onClose).toHaveBeenCalled();
	});

	it("has correct dialog ARIA attributes", () => {
		const pattern = createMockPattern();
		render(<ExportDialog open={true} onClose={() => {}} pattern={pattern} />);
		const dialog = screen.getByRole("dialog");
		expect(dialog).toHaveAttribute("aria-modal", "true");
		expect(dialog).toHaveAttribute("aria-labelledby", "export-dialog-title");
	});

	it("shows output dimensions for PNG format", () => {
		const pattern = createMockPattern();
		render(<ExportDialog open={true} onClose={() => {}} pattern={pattern} />);
		// Default cell size is 20, grid is 10x10, so output is 200x200
		expect(screen.getByText(/200 x 200 pixels/)).toBeInTheDocument();
	});
});
