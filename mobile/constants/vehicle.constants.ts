/**
 * Danh sách các hãng xe phổ biến tại Việt Nam
 * Đã bổ sung logo (icon) cho các hãng xe
 */
export const VEHICLE_BRANDS: { label: string; value: string; icon?: string }[] = [
	// Hãng phổ thông
	{
		label: "Honda",
		value: "Honda",
		icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Honda_Logo.svg/2560px-Honda_Logo.svg.png",
	},
	{
		label: "Yamaha",
		value: "Yamaha",
		icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Yamaha_Motor_Logo_%28full%29.svg/2560px-Yamaha_Motor_Logo_%28full%29.svg.png",
	},
	{
		label: "Piaggio",
		value: "Piaggio",
		icon: "https://www.nicepng.com/png/full/307-3070639_piaggio-logos-symbol-vector-free-download-piaggio-motorcycle.png",
	},
	{
		label: "SYM",
		value: "SYM",
		icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/SYM_logo_of_Sanyang_Motor_20180408.svg/2560px-SYM_logo_of_Sanyang_Motor_20180408.svg.png",
	},
	{
		label: "Suzuki",
		value: "Suzuki",
		icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Suzuki_Motor_Corporation_logo.svg/2560px-Suzuki_Motor_Corporation_logo.svg.png",
	},
	// Xe điện (Bổ sung)
	{
		label: "VinFast",
		value: "VinFast",
		icon: "https://static.wikia.nocookie.net/logopedia/images/8/86/VinFast_2017.png/revision/latest/scale-to-width-down/200?cb=20210113195756",
	},
	{
		label: "Yadea",
		value: "Yadea",
		icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Yadea_Logo.svg/1200px-Yadea_Logo.svg.png",
	},
	{
		label: "Dat Bike",
		value: "Dat Bike",
		icon: "https://www.motoplanete.com/Dat-Bike/Dat-Bike-Logo.webp",
	},
	{
		label: "Pega",
		value: "Pega",
		icon: "https://yt3.googleusercontent.com/ytc/AIdro_krHEgN8BMNxyq1UBcFfo0piGJAE5wfguM8WF9adLrmZQ=s900-c-k-c0x00ffffff-no-rj",
	},
	// Xe 50cc / Học sinh (Bổ sung)
	{
		label: "Kymco",
		value: "Kymco",
		icon: "https://upload.wikimedia.org/wikipedia/commons/2/26/Kymco-logo.jpg",
	},
	{
		label: "Daelim",
		value: "Daelim",
		icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR5rzDAkpPuYH1mQpoQ3IH_vXAIGfk3cR5xkA&s",
	},
	{
		label: "Hyosung",
		value: "Hyosung",
		icon: "https://iconape.com/wp-content/png_logo_vector/hyosung-logo.png",
	},
	// Phân khối lớn / Tay côn đặc thù
	{
		label: "Ducati",
		value: "Ducati",
		icon: "https://upload.wikimedia.org/wikipedia/commons/6/66/Ducati_red_logo.PNG",
	},
	{
		label: "Kawasaki",
		value: "Kawasaki",
		icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Kawasaki_Logo_vert.svg/1200px-Kawasaki_Logo_vert.svg.png",
	},
	{
		label: "KTM",
		value: "KTM",
		icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQALHO7268FeUb_mUSam9zC7Xe6tolkMYNdTA&s",
	},
	{
		label: "BMW",
		value: "BMW",
		icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/BMW.svg/2048px-BMW.svg.png",
	},
	{
		label: "Benelli",
		value: "Benelli",
		icon: "https://upload.wikimedia.org/wikipedia/en/thumb/f/f3/Benelli_logo.svg/1200px-Benelli_logo.png",
	},
	{ label: "GPX", value: "GPX", icon: "https://www.gpxmotouk.com/uploads/8/0/6/7/8067174/0001f_orig.jpg" },
	{
		label: "Harley-Davidson",
		value: "Harley-Davidson",
		icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Harley-Davidson_logo.svg/2560px-Harley-Davidson_logo.svg.png",
	},
	{
		label: "Triumph",
		value: "Triumph",
		icon: "https://i.pinimg.com/564x/fb/3e/a8/fb3ea823469054257ba628fdc0a5af38.jpg",
	},
	{
		label: "Brixton",
		value: "Brixton",
		icon: "https://ksr-group.com/wp-content/uploads/2019/09/brixton-logo.png",
	},
	// Khác
	{
		label: "Vespa",
		value: "Vespa",
		icon: "https://logoeps.com/wp-content/uploads/2013/06/vespa-motorcycle-vector-logo.png",
	},
	{ label: "Khác", value: "Khác" },
];

/**
 * Mapping các dòng xe theo từng hãng
 */
export const VEHICLE_MODELS_BY_BRAND: Record<string, { label: string; value: string }[]> = {
	Honda: [
		// Tay ga
		{ label: "SH", value: "SH" },
		{ label: "SH Mode", value: "SH Mode" },
		{ label: "SH 125i/150i", value: "SH 125i/150i" },
		{ label: "SH 350i", value: "SH 350i" },
		{ label: "Vision", value: "Vision" },
		{ label: "Lead", value: "Lead" },
		{ label: "Air Blade", value: "Air Blade" },
		{ label: "Air Blade 125", value: "Air Blade 125" },
		{ label: "Air Blade 160", value: "Air Blade 160" },
		{ label: "Vario", value: "Vario" }, // Bổ sung (Rất phổ biến mảng thuê)
		{ label: "Vario 125", value: "Vario 125" },
		{ label: "Vario 150/160", value: "Vario 150/160" },
		{ label: "PCX", value: "PCX" },
		// Xe số
		{ label: "Wave Alpha", value: "Wave Alpha" },
		{ label: "Wave RSX", value: "Wave RSX" },
		{ label: "Blade", value: "Blade" },
		{ label: "Future", value: "Future" },
		{ label: "Future 125 Fi", value: "Future 125 Fi" },
		{ label: "Super Cub C125", value: "Super Cub C125" },
		{ label: "Cub 50cc", value: "Cub 50cc" }, // Bổ sung cho loại 50cc
		// Tay côn
		{ label: "Winner", value: "Winner" },
		{ label: "Winner X", value: "Winner X" },
		{ label: "Sonic 150R", value: "Sonic 150R" }, // Bổ sung
		{ label: "CBR150R", value: "CBR150R" },
		{ label: "CB150R", value: "CB150R" },
		{ label: "MSX 125", value: "MSX 125" }, // Bổ sung
		// Moto
		{ label: "Rebel 300/500", value: "Rebel 300/500" },
		{ label: "CB300R", value: "CB300R" },
		{ label: "CB500X", value: "CB500X" },
		{ label: "CBR650R", value: "CBR650R" },
	],
	Yamaha: [
		// Tay ga
		{ label: "Grande", value: "Grande" },
		{ label: "Janus", value: "Janus" },
		{ label: "Latte", value: "Latte" },
		{ label: "NVX", value: "NVX" },
		{ label: "NVX 155 VVA", value: "NVX 155 VVA" },
		{ label: "FreeGo", value: "FreeGo" },
		// Xe số
		{ label: "Sirius", value: "Sirius" },
		{ label: "Sirius FI", value: "Sirius FI" },
		{ label: "Jupiter", value: "Jupiter" },
		{ label: "Jupiter Finn", value: "Jupiter Finn" },
		{ label: "PG-1", value: "PG-1" }, // Bổ sung (Trend mới)
		// Tay côn
		{ label: "Exciter 135", value: "Exciter 135" },
		{ label: "Exciter 150", value: "Exciter 150" },
		{ label: "Exciter 155 VVA", value: "Exciter 155 VVA" },
		{ label: "YZF-R15", value: "YZF-R15" },
		{ label: "MT-15", value: "MT-15" },
		{ label: "TFX 150", value: "TFX 150" },
		// Moto
		{ label: "MT-03", value: "MT-03" },
		{ label: "R3", value: "R3" },
		{ label: "MT-07", value: "MT-07" },
	],
	VinFast: [
		// Bổ sung Hãng này cho loại Xe điện
		{ label: "Klara A2", value: "Klara A2" },
		{ label: "Klara S", value: "Klara S" },
		{ label: "Feliz", value: "Feliz" },
		{ label: "Feliz S", value: "Feliz S" },
		{ label: "Evo200", value: "Evo200" },
		{ label: "Vento", value: "Vento" },
		{ label: "Theon", value: "Theon" },
		{ label: "Ludo/Impes", value: "Ludo/Impes" },
	],
	Yadea: [
		// Bổ sung Hãng này cho loại Xe điện
		{ label: "Yadea G5", value: "Yadea G5" },
		{ label: "Yadea Odora", value: "Yadea Odora" },
		{ label: "Yadea Ulike", value: "Yadea Ulike" },
		{ label: "Yadea E3", value: "Yadea E3" },
	],
	"Dat Bike": [
		// Bổ sung Hãng này cho loại Xe điện
		{ label: "Weaver", value: "Weaver" },
		{ label: "Weaver 200", value: "Weaver 200" },
		{ label: "Weaver++", value: "Weaver++" },
		{ label: "Quantum", value: "Quantum" },
	],
	Piaggio: [
		{ label: "Liberty One", value: "Liberty One" },
		{ label: "Liberty 125", value: "Liberty 125" },
		{ label: "Medley 125/150", value: "Medley 125/150" },
		{ label: "Beverly", value: "Beverly" },
		{ label: "Zip", value: "Zip" }, // Xe nhỏ gọn phổ biến
	],
	Vespa: [
		{ label: "Vespa Primavera", value: "Vespa Primavera" },
		{ label: "Vespa Sprint", value: "Vespa Sprint" },
		{ label: "Vespa GTS", value: "Vespa GTS" },
		{ label: "Vespa LX", value: "Vespa LX" }, // Đời cũ nhưng cho thuê nhiều
	],
	SYM: [
		// 50cc (Rất mạnh mảng này)
		{ label: "Attila 50", value: "Attila 50" },
		{ label: "Elite 50", value: "Elite 50" },
		{ label: "Galaxy 50", value: "Galaxy 50" },
		{ label: "Angela 50", value: "Angela 50" },
		{ label: "Elegant 50", value: "Elegant 50" },
		// Phổ thông
		{ label: "Attila 125", value: "Attila 125" },
		{ label: "Shark", value: "Shark" },
	],
	Suzuki: [
		{ label: "Raider R150", value: "Raider R150" },
		{ label: "Satria F150", value: "Satria F150" },
		{ label: "Burgman Street", value: "Burgman Street" },
		{ label: "Impulse", value: "Impulse" },
		{ label: "GSX-R150", value: "GSX-R150" },
		{ label: "GSX-S150", value: "GSX-S150" },
		{ label: "GZ150", value: "GZ150" }, // Cruiser nhỏ
		{ label: "GD110", value: "GD110" }, // Tay côn classic giá rẻ
	],
	Kymco: [
		// 50cc & Học sinh
		{ label: "Candy Hermosa 50", value: "Candy Hermosa 50" },
		{ label: "Like 50", value: "Like 50" },
		{ label: "Visar 50", value: "Visar 50" },
		{ label: "K-Pipe 50", value: "K-Pipe 50" },
		// 125cc+
		{ label: "K-Pipe 125", value: "K-Pipe 125" },
		{ label: "Like 125", value: "Like 125" },
	],
	Daelim: [
		// Bổ sung cho mảng 50cc
		{ label: "Cub 81", value: "Cub 81" },
		{ label: "Cub 82", value: "Cub 82" },
		{ label: "Super Cub 50", value: "Super Cub 50" },
	],
	Hyosung: [
		// Bổ sung cho mảng 50cc
		{ label: "Crea 50", value: "Crea 50" },
		{ label: "Giorno 50", value: "Giorno 50" },
		{ label: "Cub Hyosung", value: "Cub Hyosung" },
	],
	Ducati: [
		{ label: "Scrambler", value: "Scrambler" },
		{ label: "Monster 795/796", value: "Monster 795/796" }, // Đời cũ phổ biến cho thuê
		{ label: "Monster 821", value: "Monster 821" },
		{ label: "Panigale", value: "Panigale" },
		{ label: "Hyperstrada", value: "Hyperstrada" },
	],
	Kawasaki: [
		{ label: "Z1000", value: "Z1000" }, // Huyền thoại
		{ label: "Z800", value: "Z800" },
		{ label: "Z400", value: "Z400" },
		{ label: "Ninja 400", value: "Ninja 400" },
		{ label: "Ninja 650", value: "Ninja 650" },
		{ label: "Vulcan S", value: "Vulcan S" },
		{ label: "W175", value: "W175" }, // Classic nhỏ
	],
	KTM: [
		// Bổ sung
		{ label: "Duke 200", value: "Duke 200" },
		{ label: "Duke 390", value: "Duke 390" },
		{ label: "RC 390", value: "RC 390" },
	],
	GPX: [
		// Bổ sung (Xe Thái giá rẻ)
		{ label: "Demon 150GR", value: "Demon 150GR" },
		{ label: "Legend 150s", value: "Legend 150s" },
		{ label: "Legend 200", value: "Legend 200" },
		{ label: "Raptor", value: "Raptor" },
	],
	Brixton: [
		// Bổ sung (Classic)
		{ label: "Brixton Classic 150", value: "Brixton Classic 150" },
		{ label: "Brixton Scrambler", value: "Brixton Scrambler" },
	],
	"Harley-Davidson": [
		{ label: "Iron 883", value: "Iron 883" },
		{ label: "Forty-Eight", value: "Forty-Eight" },
		{ label: "Street 750", value: "Street 750" },
	],
	BMW: [
		{ label: "G310 R", value: "G310 R" },
		{ label: "G310 GS", value: "G310 GS" },
		{ label: "S1000 RR", value: "S1000 RR" },
		{ label: "R1200 GS", value: "R1200 GS" },
	],
	Triumph: [
		{ label: "Street Twin", value: "Street Twin" },
		{ label: "Bonneville T100", value: "Bonneville T100" },
		{ label: "Trident 660", value: "Trident 660" },
	],
	Benelli: [
		{ label: "Benelli 302S", value: "Benelli 302S" },
		{ label: "Leoncino 500", value: "Leoncino 500" },
		{ label: "TRK 502", value: "TRK 502" },
	],
	Pega: [
		{ label: "Pega-S", value: "Pega-S" },
		{ label: "New Tech", value: "New Tech" },
		{ label: "Aura", value: "Aura" },
	],
	Khác: [],
};

/**
 * Danh sách các loại xe phổ biến tại Việt Nam
 */
export const VEHICLE_TYPES: { label: string; value: string }[] = [
	{ label: "Xe số", value: "Xe số" },
	{ label: "Tay ga", value: "Tay ga" },
	{ label: "Tay côn", value: "Tay côn" },
	{ label: "Xe điện", value: "Xe điện" },
	{ label: "Mô tô", value: "Mô tô" },
	{ label: "50cc", value: "50cc" },
];

/**
 * Helper function để lấy danh sách model theo brand
 */
export function getModelsByBrand(brand: string): { label: string; value: string }[] {
	return VEHICLE_MODELS_BY_BRAND[brand] || [];
}

/**
 * Helper function để lấy loại xe dựa trên tên model xe
 */
export function getVehicleTypeByModel(modelName: string): string | undefined {
	const lowerModelName = modelName.toLowerCase();

	// 1. Xe điện
	if (["vinfast", "yadea", "dat bike", "pega"].some((brand) => lowerModelName.includes(brand))) return "Xe điện";

	// 2. 50cc
	if (
		lowerModelName.includes("50cc") ||
		lowerModelName.includes("50") ||
		[
			"cub 81",
			"cub 82",
			"crea 50",
			"giorno 50",
			"cub hyosung",
			"super cub 50",
			"attila 50",
			"elite 50",
			"galaxy 50",
			"angela 50",
			"elegant 50",
			"candy hermosa 50",
			"like 50",
			"visar 50",
			"k-pipe 50",
		].some((model) => lowerModelName.includes(model))
	)
		return "50cc";

	// 3. Mô tô / Phân khối lớn (Ưu tiên check trước tay côn thường)
	if (
		["ducati", "kawasaki", "ktm", "bmw", "benelli", "gpx", "harley-davidson", "triumph", "brixton"].some((brand) =>
			lowerModelName.includes(brand)
		) ||
		[
			"rebel",
			"cb300r",
			"cb500x",
			"cbr650r",
			"mt-03",
			"r3",
			"mt-07",
			"z1000",
			"z800",
			"z400",
			"ninja 400",
			"ninja 650",
			"vulcan s",
			"duke 200",
			"duke 390",
			"rc 390",
			"demon 150gr",
			"legend 150s",
			"legend 200",
			"raptor",
			"iron 883",
			"forty-eight",
			"street 750",
			"g310 r",
			"g310 gs",
			"s1000 rr",
			"r1200 gs",
			"street twin",
			"bonneville t100",
			"trident 660",
			"benelli 302s",
			"leoncino 500",
			"trk 502",
		].some((model) => lowerModelName.includes(model))
	)
		return "Mô tô";

	// 4. Tay côn
	if (
		[
			"winner",
			"sonic",
			"cbr150r",
			"cb150r",
			"msx 125",
			"exciter",
			"yzf-r15",
			"mt-15",
			"tfx 150",
			"raider",
			"satria",
			"gsx-r150",
			"gsx-s150",
			"gz150",
			"gd110",
			"k-pipe 125",
		].some((model) => lowerModelName.includes(model))
	)
		return "Tay côn";

	// 5. Tay ga
	if (
		[
			"sh",
			"vision",
			"lead",
			"air blade",
			"vario",
			"pcx",
			"grande",
			"janus",
			"latte",
			"nvx",
			"freego",
			"liberty",
			"medley",
			"beverly",
			"zip",
			"vespa",
			"attila",
			"shark",
			"burgman street",
			"impulse",
			"like 125",
		].some((model) => lowerModelName.includes(model))
	)
		return "Tay ga";

	// 6. Xe số
	if (
		["wave", "blade", "future", "super cub c125", "sirius", "jupiter", "pg-1"].some((model) =>
			lowerModelName.includes(model)
		)
	)
		return "Xe số";

	return undefined;
}
