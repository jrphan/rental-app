import { Text, View, TouchableOpacity, ScrollView, ActivityIndicator, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "@/lib/api.profile";
import { useToast } from "@/lib/toast";
import { queryKeys } from "@/lib/queryClient";

export default function ProfileScreen() {
	const { logout, user, isAuthenticated } = useAuthStore();
	const router = useRouter();
	const toast = useToast();

	console.log("user in profile screen", user);

	const handleLogout = () => {
		logout();
		toast.showSuccess("Đã đăng xuất thành công", { title: "Đăng xuất" });
	};

	// Fetch profile data if authenticated
	const { data: profileData, isLoading: isLoadingProfile } = useQuery({
		queryKey: queryKeys.profile.detail(user?.id),
		queryFn: () => profileApi.getProfile(),
		enabled: !!user?.id && isAuthenticated,
	});

	const queryClient = useQueryClient();

	const { data: myOwnerApplication, isLoading: isLoadingOwnerApp } = useQuery({
		queryKey: ["owner-application", user?.id],
		queryFn: () => profileApi.getMyOwnerApplication(),
		enabled: !!user?.id && isAuthenticated,
	});

	const { data: myKyc, isLoading: isLoadingKyc } = useQuery({
		queryKey: ["kyc", user?.id],
		queryFn: () => profileApi.getMyKYC(),
		enabled: !!user?.id && isAuthenticated,
	});

	// Check if any critical data is still loading
	const isLoading = isLoadingProfile;

	const submitOwnerApplicationMutation = useMutation({
		mutationFn: (notes?: string) => profileApi.submitOwnerApplication(notes),
		onSuccess: () => {
			toast.showSuccess("Đã gửi yêu cầu làm chủ xe", { title: "Thành công" });
			queryClient.invalidateQueries({
				queryKey: ["owner-application", user?.id],
			});
		},
		onError: (e: any) => {
			toast.showError(e?.message || "Gửi yêu cầu thất bại", { title: "Lỗi" });
		},
	});

	const profile = profileData?.profile;

	// Not authenticated - show login/register options
	if (!isAuthenticated) {
		return (
			<>
				<StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
				<SafeAreaView className="flex-1 bg-white px-6" edges={["top", "left", "right"]}>
					<View className="flex-1 items-center justify-center">
						<View className="items-center mb-8">
							<View className="w-20 h-20 bg-primary-100 rounded-full items-center justify-center mb-4">
								<MaterialIcons name="person-outline" size={40} color="#EA580C" />
							</View>
							<Text className="text-2xl font-bold text-gray-900">Chào mừng bạn!</Text>
							<Text className="mt-2 text-base text-gray-600 text-center">
								Đăng nhập hoặc đăng ký để sử dụng đầy đủ các tính năng của ứng dụng
							</Text>
						</View>

						<View className="w-full gap-4">
							<Button onPress={() => router.push("/(auth)/login")} className="w-full" size="lg">
								<Text className="text-center text-base font-semibold text-white">Đăng nhập</Text>
							</Button>

							<Button
								onPress={() => router.push("/(auth)/register")}
								variant="outline"
								className="w-full"
								size="lg"
							>
								<Text className="text-center text-base font-semibold text-gray-900">Đăng ký ngay</Text>
							</Button>
						</View>
					</View>
				</SafeAreaView>
			</>
		);
	}

	// Authenticated - show profile
	// Show loading skeleton while profile data is loading
	if (isLoading) {
		return (
			<>
				<StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
				<SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
					<View className="flex-1 items-center justify-center">
						<ActivityIndicator size="large" color="#EA580C" />
						<Text className="mt-4 text-base text-gray-600">Đang tải thông tin...</Text>
					</View>
				</SafeAreaView>
			</>
		);
	}

	return (
		<>
			<StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
			<SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
				<ScrollView showsVerticalScrollIndicator={false}>
					<View className="flex-1 px-6">
						{/* Profile Header */}
						<View className="items-center pt-8 pb-6">
							<View className="w-24 h-24 bg-primary-100 rounded-full items-center justify-center mb-4">
								{profile?.avatar ? (
									<MaterialIcons name="person" size={48} color="#EA580C" />
								) : (
									<MaterialIcons name="person" size={48} color="#EA580C" />
								)}
							</View>
							<Text className="text-2xl font-bold text-gray-900">
								{profile?.firstName && profile?.lastName
									? `${profile.firstName} ${profile.lastName}`
									: user?.email || "Người dùng"}
							</Text>
							{user?.email && <Text className="mt-1 text-base text-gray-600">{user.email}</Text>}
							{user?.phone && (
								<View className="flex-row items-center mt-1">
									<Text className="text-base text-gray-600">{user.phone}</Text>
									{user?.isPhoneVerified && (
										<MaterialIcons
											name="verified"
											size={18}
											color="#22c55e"
											style={{ marginLeft: 4 }}
										/>
									)}
								</View>
							)}
						</View>

						{/* Profile Info Card */}
						<View className="bg-gray-50 rounded-2xl p-4 mb-4">
							<View className="flex-row items-center justify-between mb-3">
								<Text className="text-sm text-gray-600">Trạng thái xác thực</Text>
								<View className="flex-row items-center">
									<View
										className={`w-2 h-2 rounded-full mr-2 ${
											user?.isVerified ? "bg-green-500" : "bg-yellow-500"
										}`}
									/>
									<Text className="text-sm font-semibold text-gray-900">
										{user?.isVerified ? "Đã xác thực" : "Chưa xác thực"}
									</Text>
								</View>
							</View>
							{user?.phone && (
								<View className="flex-row items-center justify-between mb-3">
									<Text className="text-sm text-gray-600">Xác minh số điện thoại</Text>
									<View className="flex-row items-center">
										<View
											className={`w-2 h-2 rounded-full mr-2 ${
												user?.isPhoneVerified ? "bg-green-500" : "bg-yellow-500"
											}`}
										/>
										<Text className="text-sm font-semibold text-gray-900">
											{user?.isPhoneVerified ? "Đã xác minh" : "Chưa xác minh"}
										</Text>
									</View>
								</View>
							)}
							<View className="flex-row items-center justify-between mb-3">
								<Text className="text-sm text-gray-600">Vai trò</Text>
								<Text className="text-sm font-semibold text-gray-900">
									{user?.role === "RENTER"
										? "Người thuê"
										: user?.role === "OWNER"
										? "Chủ xe"
										: "User"}
								</Text>
							</View>
							{profile?.dateOfBirth && (
								<View className="flex-row items-center justify-between mb-3">
									<Text className="text-sm text-gray-600">Ngày sinh</Text>
									<Text className="text-sm font-semibold text-gray-900">
										{new Date(profile.dateOfBirth).toLocaleDateString("vi-VN")}
									</Text>
								</View>
							)}
							{profile?.gender && (
								<View className="flex-row items-center justify-between">
									<Text className="text-sm text-gray-600">Giới tính</Text>
									<Text className="text-sm font-semibold text-gray-900">
										{profile.gender === "MALE"
											? "Nam"
											: profile.gender === "FEMALE"
											? "Nữ"
											: "Khác"}
									</Text>
								</View>
							)}
						</View>

						{/* Actions */}
						<View className="mb-4">
							<Text className="text-lg font-semibold text-gray-900 mb-4">Cài đặt</Text>

							{/* Owner Application Section - Show for RENTER or if no application yet */}
							{(user?.role === "RENTER" || !myOwnerApplication) && (
								<View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-200">
									<View className="flex-row items-center justify-between mb-2">
										<View className="flex-row items-center">
											<MaterialIcons name="directions-car" size={24} color="#EA580C" />
											<Text className="ml-3 text-base font-medium text-gray-900">
												Đăng ký làm chủ xe
											</Text>
										</View>
									</View>
									{isLoadingOwnerApp ? (
										<View className="py-2">
											<ActivityIndicator size="small" color="#EA580C" />
										</View>
									) : myOwnerApplication ? (
										<View>
											<View className="flex-row items-center justify-between mb-2">
												<View className="flex-row items-center">
													<View
														className={`w-2 h-2 rounded-full mr-2 ${
															myOwnerApplication.status === "PENDING"
																? "bg-yellow-500"
																: myOwnerApplication.status === "APPROVED"
																? "bg-green-500"
																: "bg-red-500"
														}`}
													/>
													<Text className="text-sm font-semibold text-gray-900">
														{myOwnerApplication.status === "PENDING"
															? "Đang chờ duyệt"
															: myOwnerApplication.status === "APPROVED"
															? "Đã được duyệt"
															: "Bị từ chối"}
													</Text>
												</View>
												{myOwnerApplication.status === "REJECTED" && (
													<Button
														size="sm"
														onPress={() => submitOwnerApplicationMutation.mutate(undefined)}
														disabled={submitOwnerApplicationMutation.isPending}
													>
														<Text className="text-white font-semibold text-xs">
															Gửi lại
														</Text>
													</Button>
												)}
											</View>
											{myOwnerApplication.status === "PENDING" && (
												<Text className="text-xs text-gray-600 mt-2">
													Yêu cầu của bạn đang được xem xét. Bạn sẽ được thông báo khi có kết
													quả.
												</Text>
											)}
											{myOwnerApplication.status === "APPROVED" && (
												<Text className="text-xs text-green-600 mt-2">
													Chúc mừng! Bạn đã trở thành chủ xe. Bây giờ bạn có thể đăng xe cho
													thuê.
												</Text>
											)}
										</View>
									) : (
										<View>
											<Text className="text-sm text-gray-600 mb-3">
												Để trở thành chủ xe, bạn cần:
											</Text>
											<View className="mb-3">
												<View className="flex-row items-start mb-2">
													<MaterialIcons
														name="check-circle"
														size={16}
														color="#22c55e"
														style={{ marginTop: 2, marginRight: 8 }}
													/>
													<Text className="text-xs text-gray-700 flex-1">
														Tạo ít nhất 1 chiếc xe
													</Text>
												</View>
												<View className="flex-row items-start mb-2">
													<MaterialIcons
														name="check-circle"
														size={16}
														color="#22c55e"
														style={{ marginTop: 2, marginRight: 8 }}
													/>
													<Text className="text-xs text-gray-700 flex-1">
														Gửi xe để admin duyệt
													</Text>
												</View>
												<View className="flex-row items-start">
													<MaterialIcons
														name="check-circle"
														size={16}
														color="#22c55e"
														style={{ marginTop: 2, marginRight: 8 }}
													/>
													<Text className="text-xs text-gray-700 flex-1">
														Khi có xe đầu tiên được duyệt, yêu cầu làm chủ xe sẽ tự động
														được gửi
													</Text>
												</View>
											</View>
											<Button
												onPress={() => router.push("/(tabs)/profile/vehicle-create")}
												className="mb-2"
											>
												<Text className="text-white font-semibold">Tạo xe mới</Text>
											</Button>
										</View>
									)}
								</View>
							)}

							{user?.phone && !user?.isPhoneVerified && (
								<TouchableOpacity
									onPress={() => router.push("/(auth)/verify-phone")}
									className="bg-yellow-50 border-yellow-200 rounded-xl p-4 mb-3 flex-row items-center justify-between shadow-sm border-2"
								>
									<View className="flex-row items-center flex-1">
										<MaterialIcons name="phone" size={24} color="#F59E0B" />
										<View className="ml-3 flex-1">
											<Text className="text-base font-semibold text-gray-900">
												Xác minh số điện thoại
											</Text>
											<Text className="text-sm text-gray-600 mt-1">
												Cần xác minh để sử dụng đầy đủ tính năng
											</Text>
										</View>
									</View>
									<MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
								</TouchableOpacity>
							)}

							<TouchableOpacity
								onPress={() => router.push("/(tabs)/profile/edit-profile")}
								className="bg-white rounded-xl p-4 mb-3 flex-row items-center justify-between shadow-sm border border-gray-200"
							>
								<View className="flex-row items-center">
									<MaterialIcons name="edit" size={24} color="#EA580C" />
									<Text className="ml-3 text-base font-medium text-gray-900">Chỉnh sửa hồ sơ</Text>
								</View>
								<MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
							</TouchableOpacity>

							{/* Xem danh sách xe của tôi */}
							<TouchableOpacity
								onPress={() => router.push("/(tabs)/profile/my-vehicles")}
								className="bg-white rounded-xl p-4 mb-3 flex-row items-center justify-between shadow-sm border border-gray-200"
							>
								<View className="flex-row items-center">
									<MaterialIcons name="directions-bike" size={24} color="#EA580C" />
									<Text className="ml-3 text-base font-medium text-gray-900">Xe của tôi</Text>
								</View>
								<MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
							</TouchableOpacity>

							{/* Allow any user to create vehicle, not just OWNER */}
							{/* <TouchableOpacity
              onPress={() => router.push("/(tabs)/profile/vehicle-create")}
              className="bg-white rounded-xl p-4 mb-3 flex-row items-center justify-between shadow-sm border border-gray-200"
            >
              <View className="flex-row items-center">
                <MaterialIcons name="add-circle" size={24} color="#EA580C" />
                <Text className="ml-3 text-base font-medium text-gray-900">
                  Đăng xe mới
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
            </TouchableOpacity> */}

							<TouchableOpacity
								onPress={() => router.push("/(tabs)/profile/change-password")}
								className="bg-white rounded-xl p-4 mb-3 flex-row items-center justify-between shadow-sm border border-gray-200"
							>
								<View className="flex-row items-center">
									<MaterialIcons name="lock" size={24} color="#EA580C" />
									<Text className="ml-3 text-base font-medium text-gray-900">Đổi mật khẩu</Text>
								</View>
								<MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
							</TouchableOpacity>

							<View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-200">
								<TouchableOpacity
									onPress={() => router.push("/(tabs)/profile/kyc")}
									className="flex-row items-center justify-between"
								>
									<View className="flex-row items-center">
										<MaterialIcons name="verified-user" size={24} color="#EA580C" />
										<Text className="ml-3 text-base font-medium text-gray-900">
											Xác thực danh tính (KYC)
										</Text>
									</View>
									<MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
								</TouchableOpacity>
								{isLoadingKyc ? (
									<View className="mt-3 pt-3 border-t border-gray-200">
										<ActivityIndicator size="small" color="#EA580C" />
									</View>
								) : myKyc ? (
									<View className="mt-3 pt-3 border-t border-gray-200">
										<View className="flex-row items-center justify-between">
											<View className="flex-row items-center">
												<View
													className={`w-2 h-2 rounded-full mr-2 ${
														myKyc.status === "APPROVED"
															? "bg-green-500"
															: myKyc.status === "REJECTED"
															? "bg-red-500"
															: "bg-yellow-500"
													}`}
												/>
												<Text className="text-sm font-semibold text-gray-900">
													{myKyc.status === "APPROVED"
														? "Đã được duyệt"
														: myKyc.status === "REJECTED"
														? "Bị từ chối"
														: "Đang chờ duyệt"}
												</Text>
											</View>
										</View>
										{myKyc.reviewNotes && (
											<Text className="text-xs text-gray-600 mt-2" numberOfLines={2}>
												{myKyc.reviewNotes}
											</Text>
										)}
									</View>
								) : null}
							</View>
						</View>

						{/* Bio Section */}
						{profile?.bio && (
							<View className="mb-4">
								<Text className="text-lg font-semibold text-gray-900 mb-2">Giới thiệu</Text>
								<View className="bg-gray-50 rounded-xl p-4">
									<Text className="text-base text-gray-700">{profile.bio}</Text>
								</View>
							</View>
						)}

						{/* Address Section */}
						{profile?.address && (
							<View className="mb-4">
								<Text className="text-lg font-semibold text-gray-900 mb-2">Địa chỉ</Text>
								<View className="bg-gray-50 rounded-xl p-4">
									<Text className="text-base text-gray-700">{profile.address}</Text>
								</View>
							</View>
						)}

						{/* Logout Button */}
						<Button onPress={handleLogout} variant="destructive" className="mb-24" size="lg">
							<Text className="text-center text-base font-semibold text-white">Đăng xuất</Text>
						</Button>
					</View>
				</ScrollView>
			</SafeAreaView>
		</>
	);
}
