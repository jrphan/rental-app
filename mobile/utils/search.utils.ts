export function normalizeSearchQuery(input: string | undefined) {
	// Normalize: trim, lowercase, remove diacritics, collapse spaces
	if (!input) return "";
	const s = input.trim().toLowerCase();
	// Remove Vietnamese diacritics (basic)
	const from = "áàạảãâấầậẩẫăắằặẳẵéèẹẻẽêếềệểễíìịỉĩóòọỏõôốồộổỗơớờợởỡúùụủũưứừựửữýỳỷỹỵđ";
	const to = "aaaaaaaaaaaaeeeeeeeeiiiiooooooooooooooouuuuuuuuuuuyyyyyd";
	let out = "";
	for (let i = 0; i < s.length; i++) {
		const idx = from.indexOf(s[i]);
		out += idx > -1 ? to[idx] : s[i];
	}
	out = out.replace(/\s+/g, " ");
	return out;
}

// Heuristic: detect license-plate-like token (letters+digits and dash)
export function detectLicensePlateTokens(input: string | undefined) {
	if (!input) return undefined;
	const tokens = input.split(/\s+/).map((t) => t.replace(/[^A-Za-z0-9-]/g, ""));
	for (const t of tokens) {
		// simple heuristic: contains letter+digit and length between 4 and 10
		if (/[A-Za-z]/.test(t) && /\d/.test(t) && t.length >= 4 && t.length <= 12) {
			return t;
		}
	}
	return undefined;
}
