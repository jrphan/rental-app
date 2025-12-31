import React from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { COLORS } from "@/constants/colors";

export default function InsuranceInfoModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<View className="flex-1 bg-black/50 justify-center items-center px-4">
				<View className="bg-white rounded-2xl w-full max-w-md p-6">
					<View className="flex-row items-center justify-between mb-4">
						<Text className="text-lg font-bold text-gray-900">Bảo hiểm người trên xe</Text>
						<TouchableOpacity onPress={onClose}>
							<MaterialIcons name="close" size={22} color="#6B7280" />
						</TouchableOpacity>
					</View>
					<ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
						<Text className="text-sm text-gray-700 mb-3">
							<Text className="font-semibold">Mô tả:</Text> Bảo hiểm bổ sung bảo vệ hành khách và xe trong
							suốt thời gian thuê. Quyền lợi tối đa đến 300.000.000 VND/người/chuyến.
						</Text>

						<Text className="text-sm font-semibold text-gray-900 mb-2">I. Nội dung</Text>
						<Text className="text-sm text-gray-700 mb-3">
							Trong thời gian thuê, hành khách và xe được bảo hiểm nếu có thiệt hại thân thể do tai nạn
							giao thông, xe bị hư hỏng hoặc mất cắp. Quyền lợi lên tới 300.000.000 VND/người.
						</Text>

						<Text className="text-sm font-semibold text-gray-900 mb-2">II. Điều khoản</Text>
						<Text className="text-sm text-gray-700 mb-3">
							Một số trường hợp loại trừ: hành vi cố ý, tham gia đua xe, lái xe quá nồng độ cồn, sử dụng
							xe để phạm pháp.
						</Text>

						<Text className="text-sm font-semibold text-gray-900 mb-2">III. Quy trình xử lý</Text>
						<Text className="text-sm text-gray-700">1) Cứu hộ/yêu cầu cấp cứu</Text>
						<Text className="text-sm text-gray-700">2) Báo hãng bảo hiểm và cung cấp hồ sơ</Text>
						<Text className="text-sm text-gray-700 mb-3">3) Nộp hồ sơ bồi thường theo hướng dẫn.</Text>

						<Text className="text-xs text-gray-500">
							<Text className="font-semibold">Lưu ý</Text>: Đây là mô tả tóm tắt. Nội dung chi tiết sẽ tùy
							theo chính sách đối tác bảo hiểm.
						</Text>
					</ScrollView>

					<TouchableOpacity
						onPress={onClose}
						className="mt-4 bg-primary-600 rounded-lg py-3"
						style={{ backgroundColor: COLORS.primary }}
					>
						<Text className="text-center text-white font-medium">Đóng</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Modal>
	);
}
