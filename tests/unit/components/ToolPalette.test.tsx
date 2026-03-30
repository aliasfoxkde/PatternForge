import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { useEditorStore } from "@/shared/stores/editor-store";
import { ToolPalette } from "@/features/editor/components/ToolPalette";

describe("ToolPalette", () => {
	beforeEach(() => {
		useEditorStore.setState({
			activeTool: "pencil",
			activeStitchType: "full",
			mirrorHorizontal: false,
			mirrorVertical: false,
		});
	});

	it("renders with toolbar role and label", () => {
		render(<ToolPalette />);
		expect(screen.getByRole("toolbar")).toBeInTheDocument();
		expect(screen.getByRole("toolbar")).toHaveAttribute("aria-label", "Drawing tools");
	});

	it("renders all draw tools", () => {
		render(<ToolPalette />);
		expect(screen.getByTitle("Pencil (P)")).toBeInTheDocument();
		expect(screen.getByTitle("Brush (B)")).toBeInTheDocument();
		expect(screen.getByTitle("Eraser (E)")).toBeInTheDocument();
		expect(screen.getByTitle("Fill (G)")).toBeInTheDocument();
	});

	it("renders all shape tools", () => {
		render(<ToolPalette />);
		expect(screen.getByTitle("Line (L)")).toBeInTheDocument();
		expect(screen.getByTitle("Rectangle (R)")).toBeInTheDocument();
		expect(screen.getByTitle("Ellipse (O)")).toBeInTheDocument();
	});

	it("renders selection and utility tools", () => {
		render(<ToolPalette />);
		expect(screen.getByTitle("Color Picker (I)")).toBeInTheDocument();
		expect(screen.getByTitle("Selection (S)")).toBeInTheDocument();
		expect(screen.getByTitle("Text (T)")).toBeInTheDocument();
		expect(screen.getByTitle("Pan (H)")).toBeInTheDocument();
	});

	it("highlights the active tool", () => {
		render(<ToolPalette />);
		const pencil = screen.getByTitle("Pencil (P)");
		expect(pencil.className).toContain("bg-craft-200");
	});

	it("switches active tool on click", async () => {
		const user = userEvent.setup();
		render(<ToolPalette />);
		const eraser = screen.getByTitle("Eraser (E)");
		await user.click(eraser);
		expect(useEditorStore.getState().activeTool).toBe("eraser");
	});

	it("shows stitch type selector when a draw tool is active", () => {
		render(<ToolPalette />);
		// Pencil is active by default, so stitch types should be visible
		expect(screen.getByTitle("Full Stitch")).toBeInTheDocument();
		expect(screen.getByTitle("Half Stitch")).toBeInTheDocument();
		expect(screen.getByTitle("Backstitch")).toBeInTheDocument();
		expect(screen.getByTitle("French Knot")).toBeInTheDocument();
	});

	it("hides stitch type selector when pan tool is active", async () => {
		const user = userEvent.setup();
		render(<ToolPalette />);
		await user.click(screen.getByTitle("Pan (H)"));
		expect(screen.queryByTitle("Full Stitch")).not.toBeInTheDocument();
	});

	it("switches stitch type on click", async () => {
		const user = userEvent.setup();
		render(<ToolPalette />);
		await user.click(screen.getByTitle("Backstitch"));
		expect(useEditorStore.getState().activeStitchType).toBe("backstitch");
	});

	it("renders mirror horizontal toggle", () => {
		render(<ToolPalette />);
		expect(screen.getByTitle("Mirror Horizontal")).toBeInTheDocument();
	});

	it("renders mirror vertical toggle", () => {
		render(<ToolPalette />);
		expect(screen.getByTitle("Mirror Vertical")).toBeInTheDocument();
	});

	it("toggles mirror horizontal on click", async () => {
		const user = userEvent.setup();
		render(<ToolPalette />);
		await user.click(screen.getByTitle("Mirror Horizontal"));
		expect(useEditorStore.getState().mirrorHorizontal).toBe(true);
	});

	it("toggles mirror vertical on click", async () => {
		const user = userEvent.setup();
		render(<ToolPalette />);
		await user.click(screen.getByTitle("Mirror Vertical"));
		expect(useEditorStore.getState().mirrorVertical).toBe(true);
	});
});
