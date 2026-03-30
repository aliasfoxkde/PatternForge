import { useState } from "react";
import { Ruler, Scissors, Clock } from "lucide-react";
import {
	FabricCalculator,
	ThreadCalculator,
	TimeCalculator,
} from "@/features/calculators/components";

const tabs = [
	{ id: "fabric", icon: Ruler, label: "Fabric Calculator" },
	{ id: "thread", icon: Scissors, label: "Thread Calculator" },
	{ id: "time", icon: Clock, label: "Time Estimator" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function CalculatorsPage() {
	const [activeTab, setActiveTab] = useState<TabId>("fabric");

	return (
		<div className="flex h-full flex-col bg-surface">
			{/* Header */}
			<header className="border-b border-border px-4 py-3 sm:px-6 sm:py-4">
				<h1 className="text-lg font-bold text-text-primary sm:text-xl">Calculators</h1>
				<p className="mt-0.5 text-sm text-text-secondary">
					Plan your projects with precision
				</p>
			</header>

			{/* Tab Bar */}
			<div className="flex gap-1 overflow-x-auto border-b border-border px-4 sm:px-6">
				{tabs.map((tab) => {
					const Icon = tab.icon;
					const isActive = activeTab === tab.id;
					return (
						<button
							key={tab.id}
							type="button"
							onClick={() => setActiveTab(tab.id)}
							className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
								isActive
									? "border-craft-600 text-craft-600"
									: "border-transparent text-text-muted hover:border-text-muted hover:text-text-secondary"
							}`}
						>
							<Icon className="h-4 w-4" />
							{tab.label}
						</button>
					);
				})}
			</div>

			{/* Content */}
			<main className="flex-1 overflow-y-auto p-4 sm:p-6">
				<div className="mx-auto max-w-4xl">
					{activeTab === "fabric" && <FabricCalculator />}
					{activeTab === "thread" && <ThreadCalculator />}
					{activeTab === "time" && <TimeCalculator />}
				</div>
			</main>
		</div>
	);
}
