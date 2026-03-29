/**
 * CalculatorLayout - Shared layout wrapper for calculator components.
 *
 * Provides consistent title, description, and structural styling
 * across all calculator panels.
 */

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface CalculatorLayoutProps {
	icon: LucideIcon;
	title: string;
	description: string;
	iconColor: string;
	children: ReactNode;
}

export function CalculatorLayout({
	icon: Icon,
	title,
	description,
	iconColor,
	children,
}: CalculatorLayoutProps) {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-start gap-3">
				<div
					className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconColor}`}
				>
					<Icon className="h-5 w-5" />
				</div>
				<div>
					<h2 className="text-lg font-semibold text-text-primary">{title}</h2>
					<p className="mt-0.5 text-sm text-text-secondary">{description}</p>
				</div>
			</div>
			{children}
		</div>
	);
}
