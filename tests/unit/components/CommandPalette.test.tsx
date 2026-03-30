import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CommandPalette } from "@/features/editor/components/CommandPalette";
import type { CommandItem } from "@/features/editor/components/CommandPalette";

function createMockCommands(): CommandItem[] {
	return [
		{ id: "save", label: "Save Pattern", shortcut: "Ctrl+S", action: vi.fn() },
		{ id: "export", label: "Export Pattern", shortcut: "Ctrl+E", action: vi.fn() },
		{ id: "undo", label: "Undo", shortcut: "Ctrl+Z", action: vi.fn() },
		{ id: "grid-toggle", label: "Toggle Grid", action: vi.fn() },
	];
}

describe("CommandPalette", () => {
	let commands: CommandItem[];
	let onClose: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		commands = createMockCommands();
		onClose = vi.fn();
		vi.clearAllMocks();
	});

	it("renders nothing when closed", () => {
		const { container } = render(
			<CommandPalette open={false} onClose={onClose} commands={commands} />,
		);
		expect(container.innerHTML).toBe("");
	});

	it("renders the dialog when open", () => {
		render(<CommandPalette open={true} onClose={onClose} commands={commands} />);
		expect(screen.getByRole("dialog")).toBeInTheDocument();
	});

	it("shows all commands initially", () => {
		render(<CommandPalette open={true} onClose={onClose} commands={commands} />);
		expect(screen.getByText("Save Pattern")).toBeInTheDocument();
		expect(screen.getByText("Export Pattern")).toBeInTheDocument();
		expect(screen.getByText("Undo")).toBeInTheDocument();
		expect(screen.getByText("Toggle Grid")).toBeInTheDocument();
	});

	it("shows shortcut badges for commands with shortcuts", () => {
		render(<CommandPalette open={true} onClose={onClose} commands={commands} />);
		expect(screen.getByText("Ctrl+S")).toBeInTheDocument();
		expect(screen.getByText("Ctrl+E")).toBeInTheDocument();
	});

	it("filters commands by query", async () => {
		const user = userEvent.setup();
		render(<CommandPalette open={true} onClose={onClose} commands={commands} />);
		const input = screen.getByPlaceholderText("Type a command...");
		await user.type(input, "export");
		expect(screen.getByText("Export Pattern")).toBeInTheDocument();
		expect(screen.queryByText("Save Pattern")).not.toBeInTheDocument();
		expect(screen.queryByText("Undo")).not.toBeInTheDocument();
	});

	it("shows no results message when nothing matches", async () => {
		const user = userEvent.setup();
		render(<CommandPalette open={true} onClose={onClose} commands={commands} />);
		await user.type(screen.getByPlaceholderText("Type a command..."), "zzzzz");
		expect(screen.getByText("No commands found")).toBeInTheDocument();
	});

	it("calls onClose when backdrop is clicked", async () => {
		const user = userEvent.setup();
		const { container } = render(
			<CommandPalette open={true} onClose={onClose} commands={commands} />,
		);
		const outerDiv = container.firstElementChild as HTMLElement;
		const backdrop = outerDiv?.children[0] as HTMLElement;
		if (backdrop) await user.click(backdrop);
		expect(onClose).toHaveBeenCalled();
	});

	it("has correct ARIA attributes", () => {
		render(<CommandPalette open={true} onClose={onClose} commands={commands} />);
		const dialog = screen.getByRole("dialog");
		expect(dialog).toHaveAttribute("aria-modal", "true");
		expect(dialog).toHaveAttribute("aria-label", "Command palette");
	});
});
