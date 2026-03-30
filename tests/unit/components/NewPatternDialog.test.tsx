import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NewPatternDialog } from "@/features/editor/components/NewPatternDialog";
import { usePatternStore } from "@/shared/stores/pattern-store";
import { useSettingsStore } from "@/shared/stores/settings-store";

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
	useNavigate: () => vi.fn(),
}));

describe("NewPatternDialog", () => {
	let onClose: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		onClose = vi.fn();
		vi.clearAllMocks();
		usePatternStore.setState({
			createPattern: vi.fn(),
		});
		useSettingsStore.setState({
			defaultCraftType: "cross-stitch",
			defaultGridWidth: 40,
			defaultGridHeight: 40,
		});
	});

	it("renders nothing when closed", () => {
		const { container } = render(
			<NewPatternDialog open={false} onClose={onClose} />,
		);
		expect(container.innerHTML).toBe("");
	});

	it("renders the dialog when open", () => {
		render(<NewPatternDialog open={true} onClose={onClose} />);
		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByText("New Pattern")).toBeInTheDocument();
	});

	it("shows craft type selection on first step", () => {
		render(<NewPatternDialog open={true} onClose={onClose} />);
		expect(screen.getByText("Craft Type")).toBeInTheDocument();
		expect(screen.getByText("Cross Stitch")).toBeInTheDocument();
	});

	it("shows dimension presets on second step", async () => {
		const user = userEvent.setup();
		render(<NewPatternDialog open={true} onClose={onClose} />);
		// Click Next to advance from craft type step
		await user.click(screen.getByRole("button", { name: /Next/i }));
		expect(screen.getByText("Size")).toBeInTheDocument();
		expect(screen.getByText("Medium (40×40)")).toBeInTheDocument();
		expect(screen.getByText("Large (60×60)")).toBeInTheDocument();
	});

	it("has a custom dimension input", async () => {
		const user = userEvent.setup();
		render(<NewPatternDialog open={true} onClose={onClose} />);
		await user.click(screen.getByRole("button", { name: /Next/i }));
		expect(screen.getByLabelText("Width")).toBeInTheDocument();
		expect(screen.getByLabelText("Height")).toBeInTheDocument();
	});

	it("calls onClose when backdrop is clicked", async () => {
		const user = userEvent.setup();
		const { container } = render(
			<NewPatternDialog open={true} onClose={onClose} />,
		);
		const outerDiv = container.firstElementChild as HTMLElement;
		const backdrop = outerDiv?.children[0] as HTMLElement;
		if (backdrop) await user.click(backdrop);
		expect(onClose).toHaveBeenCalled();
	});

	it("calls onClose when Cancel is clicked", async () => {
		const user = userEvent.setup();
		render(<NewPatternDialog open={true} onClose={onClose} />);
		await user.click(screen.getByText("Cancel"));
		expect(onClose).toHaveBeenCalled();
	});

	it("has correct ARIA attributes", () => {
		render(<NewPatternDialog open={true} onClose={onClose} />);
		const dialog = screen.getByRole("dialog");
		expect(dialog).toHaveAttribute("aria-modal", "true");
	});
});
