export type Promo = {
	code: string;
	id: string;
	title: string;
	description: string;
	type: "PERCENT" | "FIXED" | "FREESHIP";
	value: number; // percent (e.g. 10) or fixed amount (VND)
	maxAmount?: number; // cap for percent
	minAmount?: number; // cap for fixed
	enabled?: boolean;
	note?: string;
};

// Sample promos for client-side selection (demo only)
export const PROMOS: Promo[] = [
	{
		id: "p_1",
		code: "FIRSTFREESHIP",
		title: "Freeship lần đầu",
		description: "Miễn phí giao xe cho đơn đầu tiên",
		type: "FREESHIP",
		value: 0,
		enabled: true,
	},
	{
		id: "p_2",
		code: "FIRST10",
		title: "Giảm 10%",
		description: "Giảm 10% trên giá thuê (tối đa 200.000đ)",
		type: "PERCENT",
		value: 10,
		maxAmount: 200000,
		enabled: true,
	},
	{
		id: "p_3",
		code: "CASH50",
		title: "Giảm 50.000đ",
		description: "Giảm 50.000đ đơn tối thiểu 300.000đ",
		type: "FIXED",
		value: 50000,
		minAmount: 300000,
		enabled: true,
	},
];
