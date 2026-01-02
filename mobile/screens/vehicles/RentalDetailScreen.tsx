import React, { useState, useMemo } from "react";
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	ActivityIndicator,
	Alert,
	TextInput,
	Modal,
	Image,
} from "react-native";
import ImageViewing from "react-native-image-viewing";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import HeaderBase from "@/components/header/HeaderBase";
import { openExternalMaps } from "@/utils/maps";
import OwnerInfo from "./components/OwnerInfo";
import VehicleImageCarousel from "./components/VehicleImageCarousel";
import { apiRental, type RentalStatus, type EvidenceType, type UploadEvidenceRequest } from "@/services/api.rental";
import { apiReview } from "@/services/api.review";
import { useUploadUserFile } from "@/hooks/files/useUserFiles";
import * as ImagePicker from "expo-image-picker";
import { formatPrice, formatDate, getRentalStatusLabel, getRentalStatusStyles } from "./utils";
import { COLORS } from "@/constants/colors";
import { useAuthStore } from "@/store/auth";

// Evidence Upload Form Component
function EvidenceUploadForm({
	rentalId,
	onSuccess,
	onCancel,
}: {
	rentalId: string;
	onSuccess: () => void;
	onCancel: () => void;
}) {
	const queryClient = useQueryClient();
	const uploadFile = useUploadUserFile("rental-evidence");
	const [evidenceUrls, setEvidenceUrls] = useState<Record<EvidenceType, string>>({
		PICKUP_FRONT: "",
		PICKUP_BACK: "",
		PICKUP_LEFT: "",
		PICKUP_RIGHT: "",
		PICKUP_DASHBOARD: "",
		RETURN_FRONT: "",
		RETURN_BACK: "",
		RETURN_LEFT: "",
		RETURN_RIGHT: "",
		RETURN_DASHBOARD: "",
		DAMAGE_DETAIL: "",
	});

	const uploadMutation = useMutation({
		mutationFn: async () => {
			const evidences: UploadEvidenceRequest[] = [];
			let order = 0;

			// Add pickup evidences
			const pickupTypes: EvidenceType[] = [
				"PICKUP_FRONT",
				"PICKUP_BACK",
				"PICKUP_LEFT",
				"PICKUP_RIGHT",
				"PICKUP_DASHBOARD",
			];

			for (const type of pickupTypes) {
				if (evidenceUrls[type]) {
					evidences.push({
						type,
						url: evidenceUrls[type],
						order: order++,
					});
				}
			}

			if (evidences.length === 0) {
				throw new Error("Vui lòng chụp ít nhất 1 ảnh");
			}

			return apiRental.uploadEvidence(rentalId, { evidences });
		},
		onSuccess: () => {
			// Invalidate queries to refresh rental data with new evidences
			queryClient.invalidateQueries({ queryKey: ["rental", rentalId] });
			queryClient.invalidateQueries({ queryKey: ["rental"] });
			Alert.alert("Thành công", "Đã upload ảnh hiện trạng thành công");
			onSuccess();
		},
		onError: (error: any) => {
			Alert.alert("Lỗi", error.message || "Không thể upload ảnh");
		},
	});

	const handleImageSelect = async (type: EvidenceType) => {
		try {
			const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (status !== "granted") {
				Alert.alert("Lỗi", "Cần quyền truy cập thư viện ảnh");
				return;
			}

			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: "images",
				allowsEditing: true,
				quality: 0.8,
			});

			if (result.canceled || !result.assets[0]) return;

			const asset = result.assets[0];
			const uploaded = await uploadFile.mutateAsync({
				uri: asset.uri,
				name: asset.fileName || "evidence.jpg",
				type: asset.mimeType || "image/jpeg",
			});

			setEvidenceUrls((prev) => ({ ...prev, [type]: uploaded.url }));
		} catch (error: any) {
			Alert.alert("Lỗi", error.message || "Không thể upload ảnh");
		}
	};

	const evidenceLabels: Record<EvidenceType, string> = {
		PICKUP_FRONT: "Mặt trước",
		PICKUP_BACK: "Mặt sau",
		PICKUP_LEFT: "Bên trái",
		PICKUP_RIGHT: "Bên phải",
		PICKUP_DASHBOARD: "Dashboard",
		RETURN_FRONT: "Mặt trước (trả)",
		RETURN_BACK: "Mặt sau (trả)",
		RETURN_LEFT: "Bên trái (trả)",
		RETURN_RIGHT: "Bên phải (trả)",
		RETURN_DASHBOARD: "Dashboard (trả)",
		DAMAGE_DETAIL: "Chi tiết hư hỏng",
	};

	const pickupTypes: EvidenceType[] = [
		"PICKUP_FRONT",
		"PICKUP_BACK",
		"PICKUP_LEFT",
		"PICKUP_RIGHT",
		"PICKUP_DASHBOARD",
	];

	return (
		<View>
			{pickupTypes.map((type) => (
				<View key={type} className="mb-4">
					<Text className="text-sm font-medium text-gray-700 mb-2">{evidenceLabels[type]} *</Text>
					{evidenceUrls[type] ? (
						<View className="relative">
							<Image
								source={{ uri: evidenceUrls[type] }}
								className="w-full h-48 rounded-lg"
								resizeMode="cover"
							/>
							<TouchableOpacity
								onPress={() => setEvidenceUrls((prev) => ({ ...prev, [type]: "" }))}
								className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 items-center justify-center"
							>
								<MaterialIcons name="close" size={18} color="#FFF" />
							</TouchableOpacity>
						</View>
					) : (
						<TouchableOpacity
							onPress={() => handleImageSelect(type)}
							disabled={uploadFile.isPending}
							className="h-48 rounded-lg border-2 border-dashed border-gray-300 items-center justify-center bg-gray-50"
						>
							{uploadFile.isPending ? (
								<ActivityIndicator size="small" color={COLORS.primary} />
							) : (
								<>
									<MaterialIcons name="add-a-photo" size={32} color="#9CA3AF" />
									<Text className="mt-2 text-sm text-gray-500">Chọn ảnh {evidenceLabels[type]}</Text>
								</>
							)}
						</TouchableOpacity>
					)}
				</View>
			))}

			<View className="flex-row gap-3 mt-4">
				<TouchableOpacity
					onPress={onCancel}
					disabled={uploadMutation.isPending}
					className="flex-1 py-3 px-4 rounded-lg border border-gray-300 bg-white"
				>
					<Text className="text-center font-medium text-gray-700">Hủy</Text>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={() => uploadMutation.mutate()}
					disabled={uploadMutation.isPending || uploadFile.isPending}
					className="flex-1 py-3 px-4 rounded-lg"
					style={{
						opacity: uploadMutation.isPending || uploadFile.isPending ? 0.5 : 1,
						backgroundColor: "#3B82F6",
					}}
				>
					{uploadMutation.isPending ? (
						<ActivityIndicator color="#FFFFFF" />
					) : (
						<Text className="text-center font-medium text-white">Xác nhận</Text>
					)}
				</TouchableOpacity>
			</View>
		</View>
	);
}

export default function RentalDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const { user } = useAuthStore();
	const queryClient = useQueryClient();
	const [showCancelModal, setShowCancelModal] = useState(false);
	const [cancelReason, setCancelReason] = useState("");
	const [showReviewModal, setShowReviewModal] = useState(false);
	const [reviewRating, setReviewRating] = useState(0);
	const [reviewContent, setReviewContent] = useState("");
	const [showEvidenceModal, setShowEvidenceModal] = useState(false);
	const [showDisputeModal, setShowDisputeModal] = useState(false);
	const [disputeReason, setDisputeReason] = useState("");
	const [disputeDescription, setDisputeDescription] = useState("");
	const [galleryImageIndex, setGalleryImageIndex] = useState<number | null>(null);
	const [galleryImages, setGalleryImages] = useState<{ uri: string }[]>([]);

	// Fetch rental detail
	const { data: rentalData, isLoading } = useQuery({
		queryKey: ["rental", id],
		queryFn: () => {
			if (!id) throw new Error("Rental ID is required");
			return apiRental.getRentalDetail(id);
		},
		enabled: !!id,
	});

	const rental = rentalData?.rental;

	// Fetch rental reviews to check if user has already reviewed
	const { data: rentalReviewsData } = useQuery({
		queryKey: ["rentalReviews", id],
		queryFn: () => {
			if (!id) throw new Error("Rental ID is required");
			return apiReview.getRentalReviews(id);
		},
		enabled: !!id && !!rental,
	});

	const showOwnerActions = true; // Can be passed as prop or determined from context
	const isOwner = showOwnerActions && user?.id === rental?.ownerId;
	const isRenter = user?.id === rental?.renterId;
	const hasReviewed = rentalReviewsData?.userHasReviewed || false;
	const canReview = isRenter && rental?.status === "COMPLETED" && !hasReviewed;

	// Memoize grouped evidences to avoid recalculation on every render (performance optimization for Android)
	// Must be called before any early returns
	const groupedEvidences = useMemo(() => {
		if (!rental?.evidences || rental.evidences.length === 0) {
			return {
				pickup: [],
				return: [],
				damage: [],
			};
		}

		const pickup = rental.evidences.filter((e) => e.type.startsWith("PICKUP_")).sort((a, b) => a.order - b.order);

		const returnEv = rental.evidences.filter((e) => e.type.startsWith("RETURN_")).sort((a, b) => a.order - b.order);

		const damage = rental.evidences.filter((e) => e.type === "DAMAGE_DETAIL").sort((a, b) => a.order - b.order);

		return { pickup, return: returnEv, damage };
	}, [rental?.evidences]);

	const updateStatusMutation = useMutation({
		mutationFn: async ({ status, reason }: { status: RentalStatus; reason?: string }) => {
			if (!rental) throw new Error("Rental not found");
			return apiRental.updateRentalStatus(rental.id, {
				status,
				cancelReason: reason,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["myRentals"] });
			queryClient.invalidateQueries({ queryKey: ["rental", id] });
			Alert.alert("Thành công", "Trạng thái đơn thuê đã được cập nhật");
			setShowCancelModal(false);
			setCancelReason("");
		},
		onError: (error: any) => {
			Alert.alert("Lỗi", error.message || "Không thể cập nhật trạng thái");
		},
	});

	const handleApprove = () => {
		if (!rental) return;
		Alert.alert("Xác nhận đơn thuê", "Bạn có chắc chắn muốn xác nhận đơn thuê này?", [
			{ text: "Hủy", style: "cancel" },
			{
				text: "Xác nhận",
				onPress: () => {
					updateStatusMutation.mutate({ status: "CONFIRMED" });
				},
			},
		]);
	};

	const handleCancel = () => {
		setShowCancelModal(true);
	};

	const handleConfirmCancel = () => {
		if (!rental || !cancelReason.trim()) {
			Alert.alert("Lỗi", "Vui lòng nhập lý do hủy");
			return;
		}
		updateStatusMutation.mutate({
			status: "CANCELLED",
			reason: cancelReason.trim(),
		});
	};

	const handleStatusUpdate = (newStatus: RentalStatus) => {
		if (!rental) return;
		updateStatusMutation.mutate({ status: newStatus });
	};

	// Create review mutation
	const createReviewMutation = useMutation({
		mutationFn: async (data: { rating: number; content?: string }) => {
			if (!rental) throw new Error("Rental not found");
			return apiReview.createReview({
				rentalId: rental.id,
				type: "RENTER_TO_VEHICLE",
				rating: data.rating,
				content: data.content,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["rental", id] });
			queryClient.invalidateQueries({ queryKey: ["rentalReviews", id] });
			queryClient.invalidateQueries({
				queryKey: ["vehicleReviews", rental?.vehicleId],
			});
			Alert.alert("Thành công", "Đánh giá của bạn đã được gửi");
			setShowReviewModal(false);
			setReviewRating(0);
			setReviewContent("");
		},
		onError: (error: any) => {
			Alert.alert("Lỗi", error.message || "Không thể gửi đánh giá");
		},
	});

	const handleSubmitReview = () => {
		if (reviewRating === 0) {
			Alert.alert("Lỗi", "Vui lòng chọn số sao đánh giá");
			return;
		}
		createReviewMutation.mutate({
			rating: reviewRating,
			content: reviewContent.trim() || undefined,
		});
	};

	// Create dispute mutation
	const createDisputeMutation = useMutation({
		mutationFn: async (data: { reason: string; description?: string }) => {
			if (!rental) throw new Error("Rental not found");
			return apiRental.createDispute(rental.id, data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["rental", id] });
			queryClient.invalidateQueries({ queryKey: ["myRentals"] });
			Alert.alert("Thành công", "Đã gửi phàn nàn thành công");
			setShowDisputeModal(false);
			setDisputeReason("");
			setDisputeDescription("");
		},
		onError: (error: any) => {
			Alert.alert("Lỗi", error.message || "Không thể tạo phàn nàn");
		},
	});

	const handleSubmitDispute = () => {
		if (!disputeReason.trim()) {
			Alert.alert("Lỗi", "Vui lòng nhập lý do phàn nàn");
			return;
		}
		createDisputeMutation.mutate({
			reason: disputeReason.trim(),
			description: disputeDescription.trim() || undefined,
		});
	};

	const renderStars = (rating: number, interactive = false, onPress?: (rating: number) => void) => {
		return (
			<View className="flex-row">
				{[1, 2, 3, 4, 5].map((star) => (
					<TouchableOpacity
						key={star}
						onPress={interactive && onPress ? () => onPress(star) : undefined}
						disabled={!interactive}
						activeOpacity={interactive ? 0.7 : 1}
					>
						<MaterialIcons
							name={star <= rating ? "star" : "star-border"}
							size={interactive ? 32 : 20}
							color={star <= rating ? "#F59E0B" : "#D1D5DB"}
						/>
					</TouchableOpacity>
				))}
			</View>
		);
	};

	if (isLoading) {
		return (
			<SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
				<HeaderBase title="Chi tiết đơn thuê" showBackButton />
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color={COLORS.primary} />
					<Text className="mt-4 text-gray-600">Đang tải thông tin...</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (!rental) {
		return (
			<SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
				<HeaderBase title="Chi tiết đơn thuê" showBackButton />
				<View className="flex-1 items-center justify-center px-4">
					<MaterialIcons name="error-outline" size={64} color="#EF4444" />
					<Text className="mt-4 text-red-600 text-center">Không tìm thấy thông tin đơn thuê</Text>
				</View>
			</SafeAreaView>
		);
	}

	// Check if owner can perform actions
	const canApprove = isOwner && rental.status === "AWAIT_APPROVAL";
	const canUpdateToOnTrip = isOwner && rental.status === "CONFIRMED";
	const canUpdateToCompleted = isOwner && rental.status === "ON_TRIP";
	const canCancel =
		// isOwner && (rental.status === "AWAIT_APPROVAL" || rental.status === "CONFIRMED" || rental.status === "ON_TRIP");
		(rental.status === "AWAIT_APPROVAL" || rental.status === "CONFIRMED" || rental.status === "ON_TRIP");

	// Check if renter can upload pickup evidence
	const canUploadPickupEvidence = isRenter && (rental.status === "CONFIRMED" || rental.status === "ON_TRIP");

	// Check if user can create dispute (after completion)
	// Only allow if status is COMPLETED (not DISPUTED)
	const canCreateDispute = (isRenter || isOwner) && rental?.status === "COMPLETED";

	// Convert vehicle images to VehicleImage format
	const vehicleImages =
		rental.vehicle.images?.map((img) => ({
			id: img.id || "",
			url: img.url,
			isPrimary: img.isPrimary || false,
			order: img.order || 0,
		})) || [];

	return (
		<SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
			<HeaderBase title="Chi tiết đơn thuê" showBackButton />

			<ScrollView
				className="flex-1"
				contentContainerStyle={{ paddingBottom: 24 }}
				showsVerticalScrollIndicator={false}
			>
				{/* Image Carousel */}
				<VehicleImageCarousel images={vehicleImages} height={320} />

				{/* Content */}
				<View className="px-4 pt-4">
					{/* Header */}
					<View className="mt-4 mb-4">
						<View className="flex-row items-start justify-between mb-2">
							<View className="flex-1">
								<Text className="text-2xl font-bold text-gray-900">
									{rental.vehicle.brand} {rental.vehicle.model}
								</Text>
								{(rental.vehicle as any).year && (rental.vehicle as any).color && (
									<Text className="text-base text-gray-600 mt-1">
										Năm {(rental.vehicle as any).year} • {(rental.vehicle as any).color}
									</Text>
								)}
							</View>
							{(() => {
								const s = getRentalStatusStyles(rental.status);
								return (
									<View
										style={{
											paddingHorizontal: 12,
											paddingVertical: 6,
											borderRadius: 999,
											backgroundColor: s.backgroundColor,
										}}
									>
										<Text style={{ fontSize: 12, color: s.color, fontWeight: "600" }}>
											{getRentalStatusLabel(rental.status)}
										</Text>
									</View>
								);
							})()}
						</View>

						{/* License Plate */}
						<View className="flex-row justify-between">
							<View className="flex-row items-center mt-2">
								<MaterialIcons name="confirmation-number" size={20} color="#6B7280" />
								<Text className="ml-2 text-base font-mono text-gray-700">
									{rental.vehicle.licensePlate}
								</Text>
							</View>
							{/* Rebook button */}
							{(() => {
								// Khai báo biến ngay tại đây
								const showRebook = (rental.status === "COMPLETED" || rental.status === "CANCELLED") && !isOwner;
								return (
									<TouchableOpacity
										onPress={() => router.push(`/vehicle/${rental.vehicle.id}`)}
										activeOpacity={0.8}
									>
										<View className="flex-row items-center mt-2">
											<Text style={{ color: COLORS.primary, fontWeight: "600" }}>{showRebook ? "Đặt lại" : "Chi tiết xe"}</Text>
											<MaterialIcons name="chevron-right" size={18} color={COLORS.primary} />
										</View>
									</TouchableOpacity>
								);
							})()}
						</View>
					</View>

					{/* Owner Info: show only when viewer is renter (not owner) */}
					{!isOwner && rental.owner && <OwnerInfo owner={rental.owner} ownerId={rental.ownerId} />}

					{/* Rental Period */}
					<View className="bg-gray-50 rounded-xl p-4 mb-4">
						<Text className="text-base font-semibold text-gray-900 mb-3">Thời gian thuê</Text>
						<View className="flex-row items-center mb-2">
							<MaterialIcons name="calendar-today" size={20} color="#6B7280" />
							<View className="ml-3 flex-1">
								<Text className="text-sm text-gray-600">Ngày bắt đầu</Text>
								<Text className="text-base font-medium text-gray-900">
									{formatDate(rental.startDate)}
								</Text>
							</View>
						</View>
						<View className="flex-row items-center">
							<MaterialIcons name="event" size={20} color="#6B7280" />
							<View className="ml-3 flex-1">
								<Text className="text-sm text-gray-600">Ngày kết thúc</Text>
								<Text className="text-base font-medium text-gray-900">
									{formatDate(rental.endDate)}
								</Text>
							</View>
						</View>
					</View>

					{/* Pickup / Delivery block */}
					{(() => {
						// Use persisted deliveryAddress (backend) if exists,
						// otherwise fall back to vehicle address (pickup)
						const deliveryAddress = rental.deliveryAddress ?? null;
						const isDelivery = Boolean(deliveryAddress) || Number(rental.deliveryFee) > 0;
						const displayParts = deliveryAddress
							? {
								fullAddress: deliveryAddress.fullAddress || "",
								address: deliveryAddress.address || "",
								ward: deliveryAddress.ward,
								district: deliveryAddress.district,
								city: deliveryAddress.city,
								lat: deliveryAddress.lat,
								lng: deliveryAddress.lng,
							}
							: {
								fullAddress: rental.vehicle?.fullAddress || "",
								address: rental.vehicle?.address || "",
								ward: (rental.vehicle as any)?.ward,
								district: (rental.vehicle as any)?.district,
								city: (rental.vehicle as any)?.city,
								lat: (rental.vehicle as any)?.lat,
								lng: (rental.vehicle as any)?.lng,
							};
						const label = isDelivery ? "Giao xe tại" : "Nhận xe tại";
						const fullAddress =
							[
								displayParts.address,
								displayParts.ward ? `, ${displayParts.ward}` : "",
								displayParts.district ? `, ${displayParts.district}` : "",
								displayParts.city ? `, ${displayParts.city}` : "",
							]
								.join("")
								.trim() ||
							displayParts.fullAddress ||
							"—";

						return (
							<View className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
								<View className="flex-row items-center justify-between">
									<View style={{ flex: 1 }}>
										<Text className="text-base font-semibold text-gray-900 mb-2">{label}</Text>
										<Text className="text-sm text-gray-700">{fullAddress}</Text>
									</View>
									<TouchableOpacity
										onPress={() => {
											const lat = Number(displayParts.lat);
											const lng = Number(displayParts.lng);
											if (!isFinite(lat) || !isFinite(lng)) {
												Alert.alert("Lỗi", "Không có tọa độ để mở chỉ đường");
												return;
											}
											openExternalMaps(lat, lng, fullAddress);
										}}
										activeOpacity={0.8}
									>
										<MaterialIcons name="directions" size={27} color="#1F8A70" />
									</TouchableOpacity>
								</View>
							</View>
						);
					})()}

					{/* Price Breakdown */}
					<View className="bg-orange-50 rounded-xl p-4 mb-4 border border-orange-200">
						<Text className="text-base font-semibold text-gray-900 mb-3">Chi tiết giá</Text>

						<View className="flex-row justify-between mb-2">
							<Text className="text-sm text-gray-600">Giá cơ bản</Text>
							<Text className="text-sm font-medium text-gray-900">
								{formatPrice(
									Number(rental.pricePerDay) * Math.ceil(rental.durationMinutes / (60 * 24))
								)}
							</Text>
						</View>

						{Number(rental.deliveryFee) > 0 && (
							<View className="flex-row justify-between mb-2">
								<Text className="text-sm text-gray-600">Phí giao xe</Text>
								<Text className="text-sm font-medium text-gray-900">
									{formatPrice(Number(rental.deliveryFee))}
								</Text>
							</View>
						)}

						{Number(rental.insuranceFee) > 0 && (
							<View className="flex-row justify-between mb-2">
								<Text className="text-sm text-gray-600">Phí bảo hiểm</Text>
								<Text className="text-sm font-medium text-gray-900">
									{formatPrice(Number(rental.insuranceFee))}
								</Text>
							</View>
						)}

						{Number(rental.discountAmount) > 0 && (
							<View className="flex-row justify-between mb-2">
								<Text className="text-sm text-gray-600">Giảm giá</Text>
								<Text className="text-sm font-medium text-green-600">
									-{formatPrice(Number(rental.discountAmount))}
								</Text>
							</View>
						)}

						<View className="border-t border-orange-200 pt-2 mt-2">
							<View className="flex-row justify-between mb-2">
								<Text className="text-base font-bold text-gray-900">Tổng cộng</Text>
								<Text className="text-lg font-bold text-orange-600">
									{formatPrice(Number(rental.totalPrice))}
								</Text>
							</View>

							{Number(rental.depositPrice) > 0 && (
								<View className="flex-row justify-between">
									<Text className="text-sm text-gray-600">Tiền cọc</Text>
									<Text className="text-sm font-medium text-gray-900">
										{formatPrice(Number(rental.depositPrice))}
									</Text>
								</View>
							)}
						</View>
					</View>

					{/* Additional Info */}
					{rental.cancelReason && (
						<View className="bg-red-50 rounded-xl p-4 mb-4 border border-red-200">
							<Text className="text-sm font-semibold text-red-900 mb-2">Lý do hủy</Text>
							<Text className="text-sm text-red-700">{rental.cancelReason}</Text>
						</View>
					)}

					{/* Rental Info */}
					<View className="bg-gray-50 rounded-xl p-4 mb-4">
						<Text className="text-base font-semibold text-gray-900 mb-3">Thông tin đơn thuê</Text>

						<View className="flex-row items-center mb-2">
							<MaterialIcons name="access-time" size={20} color="#6B7280" />
							<View className="ml-3 flex-1">
								<Text className="text-sm text-gray-600">Thời lượng</Text>
								<Text className="text-base font-medium text-gray-900">
									{Math.ceil(rental.durationMinutes / (60 * 24))} ngày
								</Text>
							</View>
						</View>

						<View className="flex-row items-center mb-2">
							<MaterialIcons name="today" size={20} color="#6B7280" />
							<View className="ml-3 flex-1">
								<Text className="text-sm text-gray-600">Ngày tạo đơn</Text>
								<Text className="text-base font-medium text-gray-900">
									{formatDate(rental.createdAt)}
								</Text>
							</View>
						</View>

						{rental.startOdometer !== undefined && rental.startOdometer !== null && (
							<View className="flex-row items-center mb-2">
								<MaterialIcons name="speed" size={20} color="#6B7280" />
								<View className="ml-3 flex-1">
									<Text className="text-sm text-gray-600">Số km bắt đầu</Text>
									<Text className="text-base font-medium text-gray-900">
										{rental.startOdometer.toLocaleString("vi-VN")} km
									</Text>
								</View>
							</View>
						)}

						{rental.endOdometer !== undefined && rental.endOdometer !== null && (
							<View className="flex-row items-center">
								<MaterialIcons name="speed" size={20} color="#6B7280" />
								<View className="ml-3 flex-1">
									<Text className="text-sm text-gray-600">Số km kết thúc</Text>
									<Text className="text-base font-medium text-gray-900">
										{rental.endOdometer.toLocaleString("vi-VN")} km
									</Text>
								</View>
							</View>
						)}
					</View>

					{/* Evidence Section - Show uploaded evidences */}
					{(() => {
						if (
							groupedEvidences.pickup.length === 0 &&
							groupedEvidences.return.length === 0 &&
							groupedEvidences.damage.length === 0
						) {
							return null;
						}

						const renderEvidenceItem = (
							evidence: (typeof rental.evidences)[0],
							index: number,
							allEvidences: typeof rental.evidences,
							onPress: () => void
						) => (
							<TouchableOpacity
								key={evidence.id}
								onPress={onPress}
								activeOpacity={0.7}
								style={{ marginRight: 12 }}
							>
								<Image
									source={{ uri: evidence.url }}
									style={{
										width: 100,
										height: 100,
										borderRadius: 8,
									}}
									resizeMode="cover"
								/>
								{evidence.note && (
									<Text
										className="text-xs text-gray-500 mt-1"
										numberOfLines={2}
										style={{ width: 100 }}
									>
										{evidence.note}
									</Text>
								)}
							</TouchableOpacity>
						);

						return (
							<View className="bg-gray-50 rounded-xl p-4 mb-4">
								<Text className="text-base font-semibold text-gray-900 mb-3">Ảnh hiện trạng xe</Text>

								{groupedEvidences.pickup.length > 0 && (
									<View className="mb-4">
										<Text className="text-sm font-medium text-gray-700 mb-2">Ảnh khi nhận xe</Text>
										<ScrollView
											horizontal
											showsHorizontalScrollIndicator={false}
											contentContainerStyle={{ paddingRight: 4 }}
											removeClippedSubviews={true}
											nestedScrollEnabled={true}
										>
											{groupedEvidences.pickup.map((evidence, index) =>
												renderEvidenceItem(evidence, index, groupedEvidences.pickup, () => {
													const allImages = groupedEvidences.pickup.map((e) => ({
														uri: e.url,
													}));
													setGalleryImages(allImages);
													setGalleryImageIndex(index);
												})
											)}
										</ScrollView>
									</View>
								)}

								{groupedEvidences.return.length > 0 && (
									<View className="mb-4">
										<Text className="text-sm font-medium text-gray-700 mb-2">Ảnh khi trả xe</Text>
										<ScrollView
											horizontal
											showsHorizontalScrollIndicator={false}
											contentContainerStyle={{ paddingRight: 4 }}
											removeClippedSubviews={true}
											nestedScrollEnabled={true}
										>
											{groupedEvidences.return.map((evidence, index) =>
												renderEvidenceItem(evidence, index, groupedEvidences.return, () => {
													const allImages = groupedEvidences.return.map((e) => ({
														uri: e.url,
													}));
													setGalleryImages(allImages);
													setGalleryImageIndex(index);
												})
											)}
										</ScrollView>
									</View>
								)}

								{groupedEvidences.damage.length > 0 && (
									<View>
										<Text className="text-sm font-medium text-gray-700 mb-2">Ảnh hư hỏng</Text>
										<ScrollView
											horizontal
											showsHorizontalScrollIndicator={false}
											contentContainerStyle={{ paddingRight: 4 }}
											removeClippedSubviews={true}
											nestedScrollEnabled={true}
										>
											{groupedEvidences.damage.map((evidence, index) =>
												renderEvidenceItem(evidence, index, groupedEvidences.damage, () => {
													const allImages = groupedEvidences.damage.map((e) => ({
														uri: e.url,
													}));
													setGalleryImages(allImages);
													setGalleryImageIndex(index);
												})
											)}
										</ScrollView>
									</View>
								)}
							</View>
						);
					})()}

					{/* Owner Actions */}
					{isOwner && (canApprove || canUpdateToOnTrip || canUpdateToCompleted || canCancel) && (
						<View className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200">
							<Text className="text-base font-semibold text-gray-900 mb-3">Hành động</Text>

							{canApprove && (
								<TouchableOpacity
									onPress={handleApprove}
									disabled={updateStatusMutation.isPending}
									style={{
										backgroundColor: "#fff",
										borderWidth: 1,
										borderColor: "#10B981",
										borderRadius: 12,
										padding: 12,
										marginBottom: 8,
									}}
								>
									<View className="flex-row items-center justify-center">
										<MaterialIcons name="check-circle" size={20} color="#10B981" />
										<Text
											style={{
												marginLeft: 8,
												color: "#10B981",
												fontWeight: "600",
											}}
										>
											Xác nhận đơn thuê
										</Text>
									</View>
								</TouchableOpacity>
							)}

							{canUpdateToOnTrip && (
								<TouchableOpacity
									onPress={() => handleStatusUpdate("ON_TRIP")}
									disabled={updateStatusMutation.isPending}
									style={{
										backgroundColor: "#fff",
										borderWidth: 1,
										borderColor: "#2563EB",
										borderRadius: 12,
										padding: 12,
										marginBottom: 8,
									}}
								>
									<View className="flex-row items-center justify-center">
										<MaterialIcons name="directions-bike" size={20} color="#2563EB" />
										<Text
											style={{
												marginLeft: 8,
												color: "#2563EB",
												fontWeight: "600",
											}}
										>
											Bắt đầu chuyến đi
										</Text>
									</View>
								</TouchableOpacity>
							)}

							{canUpdateToCompleted && (
								<TouchableOpacity
									onPress={() => handleStatusUpdate("COMPLETED")}
									disabled={updateStatusMutation.isPending}
									style={{
										backgroundColor: "#fff",
										borderWidth: 1,
										borderColor: "#8B5CF6",
										borderRadius: 12,
										padding: 12,
										marginBottom: 8,
									}}
								>
									<View className="flex-row items-center justify-center">
										<MaterialIcons name="check-circle-outline" size={20} color="#8B5CF6" />
										<Text
											style={{
												marginLeft: 8,
												color: "#8B5CF6",
												fontWeight: "600",
											}}
										>
											Hoàn thành đơn thuê
										</Text>
									</View>
								</TouchableOpacity>
							)}

							{canCancel && (
								<TouchableOpacity
									onPress={handleCancel}
									disabled={updateStatusMutation.isPending}
									style={{
										backgroundColor: "#fff",
										borderWidth: 1,
										borderColor: "#EF4444",
										borderRadius: 12,
										padding: 12,
										marginBottom: 8,
									}}
								>
									<View className="flex-row items-center justify-center">
										<MaterialIcons name="cancel" size={20} color="#EF4444" />
										<Text
											style={{
												marginLeft: 8,
												color: "#EF4444",
												fontWeight: "600",
											}}
										>
											Hủy đơn thuê
										</Text>
									</View>
								</TouchableOpacity>
							)}

							{updateStatusMutation.isPending && (
								<View className="mt-2 items-center">
									<ActivityIndicator size="small" color={COLORS.primary} />
								</View>
							)}
						</View>
					)}

					{/* Upload Pickup Evidence Section - Renter only */}
					{canUploadPickupEvidence && (
						<View className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200">
							<Text className="text-base font-semibold text-gray-900 mb-3">
								Chụp ảnh hiện trạng xe khi nhận
							</Text>
							<Text className="text-sm text-gray-600 mb-3">
								Vui lòng chụp ảnh hiện trạng xe (mặt trước, sau, trái, phải, dashboard) để bảo vệ quyền
								lợi của bạn
							</Text>
							<TouchableOpacity
								onPress={() => setShowEvidenceModal(true)}
								style={{
									backgroundColor: "#fff",
									borderWidth: 1,
									borderColor: "#3B82F6",
									borderRadius: 12,
									padding: 12,
								}}
							>
								<View className="flex-row items-center justify-center">
									<MaterialIcons name="camera-alt" size={20} color="#3B82F6" />
									<Text
										style={{
											marginLeft: 8,
											color: "#3B82F6",
											fontWeight: "600",
										}}
									>
										Chụp ảnh hiện trạng
									</Text>
								</View>
							</TouchableOpacity>
						</View>
					)}

					{/* Dispute Section - Show existing dispute or allow creating new one */}
					{rental.dispute ? (
						<View className="bg-red-50 rounded-xl p-4 mb-4 border border-red-200">
							<View className="flex-row items-center justify-between mb-3">
								<Text className="text-base font-semibold text-gray-900">Phàn nàn về đơn thuê</Text>
								<View
									className={`px-2 py-1 rounded-full ${rental.dispute.status === "OPEN"
										? "bg-amber-100"
										: rental.dispute.status === "RESOLVED"
											? "bg-green-100"
											: "bg-gray-100"
										}`}
								>
									<Text
										className={`text-xs font-medium ${rental.dispute.status === "OPEN"
											? "text-amber-700"
											: rental.dispute.status === "RESOLVED"
												? "text-green-700"
												: "text-gray-700"
											}`}
									>
										{rental.dispute.status === "OPEN"
											? "Đang xử lý"
											: rental.dispute.status === "RESOLVED"
												? "Đã giải quyết"
												: "Đã đóng"}
									</Text>
								</View>
							</View>
							<View className="mb-2">
								<Text className="text-sm font-medium text-gray-700 mb-1">Lý do phàn nàn:</Text>
								<Text className="text-sm text-gray-900">{rental.dispute.reason}</Text>
							</View>
							{rental.dispute.description && (
								<View className="mb-2">
									<Text className="text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết:</Text>
									<Text className="text-sm text-gray-900">{rental.dispute.description}</Text>
								</View>
							)}
							<Text className="text-xs text-gray-500 mt-2">
								Tạo lúc: {formatDate(rental.dispute.createdAt)}
							</Text>
						</View>
					) : canCreateDispute ? (
						<View className="bg-amber-50 rounded-xl p-4 mb-4 border border-amber-200">
							<Text className="text-base font-semibold text-gray-900 mb-3">Phàn nàn về đơn thuê</Text>
							<Text className="text-sm text-gray-600 mb-3">
								Nếu bạn có phàn nàn về đơn thuê này, vui lòng gửi phàn nàn để chúng tôi xử lý
							</Text>
							<TouchableOpacity
								onPress={() => setShowDisputeModal(true)}
								style={{
									backgroundColor: "#fff",
									borderWidth: 1,
									borderColor: "#F59E0B",
									borderRadius: 12,
									padding: 12,
								}}
							>
								<View className="flex-row items-center justify-center">
									<MaterialIcons name="report-problem" size={20} color="#F59E0B" />
									<Text
										style={{
											marginLeft: 8,
											color: "#F59E0B",
											fontWeight: "600",
										}}
									>
										Gửi phàn nàn
									</Text>
								</View>
							</TouchableOpacity>
						</View>
					) : null}

					{/* Renter Review Section */}
					{canReview && (
						<View className="bg-green-50 rounded-xl p-4 mb-4 border border-green-200">
							<Text className="text-base font-semibold text-gray-900 mb-3">Đánh giá chuyến đi</Text>
							<Text className="text-sm text-gray-600 mb-3">
								Chia sẻ trải nghiệm của bạn về chuyến đi này
							</Text>
							<TouchableOpacity
								onPress={() => setShowReviewModal(true)}
								style={{
									backgroundColor: "#fff",
									borderWidth: 1,
									borderColor: "#10B981",
									borderRadius: 12,
									padding: 12,
								}}
							>
								<View className="flex-row items-center justify-center">
									<MaterialIcons name="rate-review" size={20} color="#10B981" />
									<Text
										style={{
											marginLeft: 8,
											color: "#10B981",
											fontWeight: "600",
										}}
									>
										Viết đánh giá
									</Text>
								</View>
							</TouchableOpacity>
						</View>
					)}
				</View>
			</ScrollView>

			{/* Cancel Modal */}
			<Modal
				visible={showCancelModal}
				transparent
				animationType="fade"
				onRequestClose={() => setShowCancelModal(false)}
			>
				<View className="flex-1 bg-black/50 justify-center items-center px-4">
					<View className="bg-white rounded-2xl w-full max-w-md p-6">
						<Text className="text-xl font-bold text-gray-900 mb-4">Hủy đơn thuê</Text>

						<Text className="text-sm text-gray-600 mb-3">Vui lòng nhập lý do hủy đơn thuê:</Text>

						<TextInput
							value={cancelReason}
							onChangeText={setCancelReason}
							placeholder="Nhập lý do hủy..."
							placeholderTextColor="#9CA3AF"
							multiline
							numberOfLines={4}
							className="border border-gray-300 rounded-lg p-3 text-base min-h-[100px]"
							textAlignVertical="top"
						/>

						<View className="flex-row gap-3 mt-4">
							<TouchableOpacity
								onPress={() => {
									setShowCancelModal(false);
									setCancelReason("");
								}}
								disabled={updateStatusMutation.isPending}
								className="flex-1 py-3 px-4 rounded-lg border border-gray-300 bg-white"
							>
								<Text className="text-center font-medium text-gray-700">Hủy</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={handleConfirmCancel}
								disabled={updateStatusMutation.isPending || !cancelReason.trim()}
								className="flex-1 py-3 px-4 rounded-lg bg-red-600"
								style={{
									opacity: updateStatusMutation.isPending || !cancelReason.trim() ? 0.5 : 1,
									borderWidth: 1,
									borderColor: "#EF4444",
								}}
							>
								{updateStatusMutation.isPending ? (
									<ActivityIndicator color="#EF4444" />
								) : (
									<Text className="text-center font-medium text-white" style={{ color: "#EF4444" }}>
										Xác nhận hủy
									</Text>
								)}
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Review Modal */}
			<Modal
				visible={showReviewModal}
				transparent
				animationType="fade"
				onRequestClose={() => setShowReviewModal(false)}
			>
				<View className="flex-1 bg-black/50 justify-center items-center px-4">
					<View className="bg-white rounded-2xl w-full max-w-md p-6">
						<Text className="text-xl font-bold text-gray-900 mb-4">Đánh giá chuyến đi</Text>

						<Text className="text-sm text-gray-600 mb-4">Bạn đánh giá chuyến đi này như thế nào?</Text>

						{/* Star Rating */}
						<View className="items-center mb-4">{renderStars(reviewRating, true, setReviewRating)}</View>

						{/* Review Content */}
						<Text className="text-sm text-gray-600 mb-2">Nhận xét (tùy chọn)</Text>
						<TextInput
							value={reviewContent}
							onChangeText={setReviewContent}
							placeholder="Chia sẻ trải nghiệm của bạn..."
							placeholderTextColor="#9CA3AF"
							multiline
							numberOfLines={4}
							className="border border-gray-300 rounded-lg p-3 text-base min-h-[100px]"
							textAlignVertical="top"
						/>

						<View className="flex-row gap-3 mt-4">
							<TouchableOpacity
								onPress={() => {
									setShowReviewModal(false);
									setReviewRating(0);
									setReviewContent("");
								}}
								disabled={createReviewMutation.isPending}
								className="flex-1 py-3 px-4 rounded-lg border border-gray-300 bg-white"
							>
								<Text className="text-center font-medium text-gray-700">Hủy</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={handleSubmitReview}
								disabled={createReviewMutation.isPending || reviewRating === 0}
								className="flex-1 py-3 px-4 rounded-lg bg-green-600"
								style={{
									opacity: createReviewMutation.isPending || reviewRating === 0 ? 0.5 : 1,
									borderWidth: 1,
									borderColor: "#F59E0B",
								}}
							>
								{createReviewMutation.isPending ? (
									<ActivityIndicator color="#F59E0B" />
								) : (
									<Text className="text-center font-medium" style={{ color: "#F59E0B" }}>
										Gửi đánh giá
									</Text>
								)}
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Evidence Upload Modal */}
			<Modal
				visible={showEvidenceModal}
				transparent
				animationType="slide"
				onRequestClose={() => setShowEvidenceModal(false)}
			>
				<View className="flex-1 bg-black/50 justify-end">
					<View className="bg-white rounded-t-3xl max-h-[90%] p-6" style={{ maxHeight: "90%" }}>
						<View className="flex-row items-center justify-between mb-4">
							<Text className="text-xl font-bold text-gray-900">Chụp ảnh hiện trạng xe</Text>
							<TouchableOpacity onPress={() => setShowEvidenceModal(false)}>
								<MaterialIcons name="close" size={24} color="#6B7280" />
							</TouchableOpacity>
						</View>

						<ScrollView showsVerticalScrollIndicator={false}>
							<Text className="text-sm text-gray-600 mb-4">
								Vui lòng chụp ảnh các góc của xe để ghi nhận hiện trạng khi nhận xe
							</Text>

							<EvidenceUploadForm
								rentalId={rental?.id || ""}
								onSuccess={() => {
									setShowEvidenceModal(false);
									queryClient.invalidateQueries({ queryKey: ["rental", id] });
								}}
								onCancel={() => setShowEvidenceModal(false)}
							/>
						</ScrollView>
					</View>
				</View>
			</Modal>

			{/* Dispute Modal */}
			<Modal
				visible={showDisputeModal}
				transparent
				animationType="fade"
				onRequestClose={() => setShowDisputeModal(false)}
			>
				<View className="flex-1 bg-black/50 justify-center items-center px-4">
					<View className="bg-white rounded-2xl w-full max-w-md p-6">
						<Text className="text-xl font-bold text-gray-900 mb-4">Gửi phàn nàn</Text>

						<Text className="text-sm text-gray-600 mb-3">Vui lòng mô tả chi tiết vấn đề bạn gặp phải:</Text>

						<Text className="text-sm font-medium text-gray-700 mb-2">Lý do phàn nàn *</Text>
						<TextInput
							value={disputeReason}
							onChangeText={setDisputeReason}
							placeholder="Ví dụ: Xe bị hỏng, không đúng mô tả..."
							placeholderTextColor="#9CA3AF"
							multiline
							numberOfLines={3}
							className="border border-gray-300 rounded-lg p-3 text-base min-h-[80px] mb-4"
							textAlignVertical="top"
						/>

						<Text className="text-sm font-medium text-gray-700 mb-2">Mô tả chi tiết (tùy chọn)</Text>
						<TextInput
							value={disputeDescription}
							onChangeText={setDisputeDescription}
							placeholder="Mô tả chi tiết vấn đề..."
							placeholderTextColor="#9CA3AF"
							multiline
							numberOfLines={4}
							className="border border-gray-300 rounded-lg p-3 text-base min-h-[100px]"
							textAlignVertical="top"
						/>

						<View className="flex-row gap-3 mt-4">
							<TouchableOpacity
								onPress={() => {
									setShowDisputeModal(false);
									setDisputeReason("");
									setDisputeDescription("");
								}}
								disabled={createDisputeMutation.isPending}
								className="flex-1 py-3 px-4 rounded-lg border border-gray-300 bg-white"
							>
								<Text className="text-center font-medium text-gray-700">Hủy</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={handleSubmitDispute}
								disabled={createDisputeMutation.isPending || !disputeReason.trim()}
								className="flex-1 py-3 px-4 rounded-lg"
								style={{
									opacity: createDisputeMutation.isPending || !disputeReason.trim() ? 0.5 : 1,
									backgroundColor: "#F59E0B",
								}}
							>
								{createDisputeMutation.isPending ? (
									<ActivityIndicator color="#FFFFFF" />
								) : (
									<Text className="text-center font-medium text-white">Gửi phàn nàn</Text>
								)}
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Image Gallery Viewer - Using ImageViewing like VehicleImageCarousel */}
			<ImageViewing
				images={galleryImages}
				imageIndex={galleryImageIndex ?? 0}
				visible={galleryImageIndex !== null}
				onRequestClose={() => setGalleryImageIndex(null)}
				swipeToCloseEnabled={true}
				doubleTapToZoomEnabled={true}
				presentationStyle="overFullScreen"
			/>
		</SafeAreaView>
	);
}
