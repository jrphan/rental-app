// Helper functions for formatting currency
export function formatCurrency(value: string | number | undefined): string {
	if (value === undefined || value === null) return "";
	const s = typeof value === "number" ? String(value) : value;
	// Remove all non-numeric characters
	const numeric = s.toString().replace(/\D/g, "");
	if (!numeric) return "";
	// Add dots as thousand separators
	return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function parseCurrency(value: string | undefined): string {
	if (!value) return "";
	// Remove all dots to get pure number string
	return value.replace(/\./g, "");
}
