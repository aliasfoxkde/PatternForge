import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, afterAll } from "vitest";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";

// Component that throws on render
function ThrowOnRender({ error }: { error?: Error }): never {
	throw error ?? new Error("test crash");
}

describe("ErrorBoundary", () => {
	const spy = vi.spyOn(console, "error").mockImplementation(() => {});

	afterEach(() => {
		spy.mockClear();
	});
	afterAll(() => {
		spy.mockRestore();
	});

	it("renders children when no error", () => {
		render(
			<ErrorBoundary>
				<div>Hello</div>
			</ErrorBoundary>,
		);
		expect(screen.getByText("Hello")).toBeInTheDocument();
	});

	it("shows default fallback UI when child throws", () => {
		render(
			<ErrorBoundary>
				<ThrowOnRender />
			</ErrorBoundary>,
		);
		expect(screen.getByText("Something went wrong")).toBeInTheDocument();
		expect(screen.getByText("test crash")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Try Again" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Go Home" })).toBeInTheDocument();
	});

	it("shows custom fallback when provided", () => {
		render(
			<ErrorBoundary fallback={<div>Custom fallback</div>}>
				<ThrowOnRender />
			</ErrorBoundary>,
		);
		expect(screen.getByText("Custom fallback")).toBeInTheDocument();
		expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
	});

	it("displays the error message", () => {
		const msg = "specific error message";
		render(
			<ErrorBoundary>
				<ThrowOnRender error={new Error(msg)} />
			</ErrorBoundary>,
		);
		expect(screen.getByText(msg)).toBeInTheDocument();
	});

	it("has a working Try Again button", () => {
		render(
			<ErrorBoundary>
				<ThrowOnRender />
			</ErrorBoundary>,
		);
		const tryAgainBtn = screen.getByRole("button", { name: "Try Again" });
		expect(tryAgainBtn).toBeInTheDocument();
		expect(tryAgainBtn).not.toBeDisabled();
	});

	it("logs error to console", () => {
		render(
			<ErrorBoundary>
				<ThrowOnRender />
			</ErrorBoundary>,
		);
		expect(spy).toHaveBeenCalled();
	});

	it("Go Home link points to /", () => {
		render(
			<ErrorBoundary>
				<ThrowOnRender />
			</ErrorBoundary>,
		);
		const link = screen.getByRole("link", { name: "Go Home" });
		expect(link).toHaveAttribute("href", "/");
	});
});
