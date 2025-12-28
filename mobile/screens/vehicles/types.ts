export interface VehicleImage {
	id: string;
	url: string;
	isPrimary: boolean;
	order: number;
}

export interface VehicleOwner {
	id: string;
	phone: string;
	fullName?: string | null;
	email?: string | null;
	avatar?: string | null;
}

export interface Vehicle {
	id: string;
	ownerId: string;
	type: string;
	brand: string;
	model: string;
	year: number;
	color: string;
	licensePlate: string;
	engineSize: number;
	requiredLicense: string;
	address: string;
	fullAddress?: string;
	ward?: string;
	district: string;
	city: string;
	lat: number;
	lng: number;
	pricePerDay: number;
	depositAmount: number;
	deliveryFeePerKm: number;
	deliveryRadiusKm: number;
	instantBook: boolean;
	deliveryAvailable?: boolean;
	status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "MAINTENANCE" | "HIDDEN";
	description: string;
	images: VehicleImage[];
	owner?: VehicleOwner;
	createdAt: string;
	updatedAt: string;
}

export interface RentalVehicle {
	id: string;
	brand: string;
	model: string;
	licensePlate: string;
	images: {
		id?: string;
		url: string;
		isPrimary: boolean;
		order?: number;
	}[];
}

export interface Rental {
	id: string;
	renterId: string;
	ownerId: string;
	vehicleId: string;
	vehicle: RentalVehicle;
	startDate: string;
	endDate: string;
	durationMinutes: number;
	currency: string;
	pricePerDay: number;
	deliveryFee: number;
	discountAmount: number;
	totalPrice: number;
	depositPrice: number;
	platformFeeRatio: number;
	platformFee: number;
	ownerEarning: number;
	status: "PENDING_PAYMENT" | "AWAIT_APPROVAL" | "CONFIRMED" | "ON_TRIP" | "COMPLETED" | "CANCELLED" | "DISPUTED";
	createdAt: string;
	updatedAt: string;
	startOdometer?: number;
	endOdometer?: number;
	cancelReason?: string;
}

export const vehicleStatusLabels = {
	DRAFT: "Nháp",
	PENDING: "Chờ duyệt",
	APPROVED: "Đã duyệt",
	REJECTED: "Bị từ chối",
	MAINTENANCE: "Bảo trì",
	HIDDEN: "Ẩn",
} as const;

export const rentalStatusLabels = {
	PENDING_PAYMENT: "Chờ thanh toán",
	AWAIT_APPROVAL: "Chờ duyệt",
	CONFIRMED: "Đã xác nhận",
	ON_TRIP: "Đang thuê",
	COMPLETED: "Hoàn thành",
	CANCELLED: "Đã hủy ",
	DISPUTED: "Tranh chấp",
} as const;
