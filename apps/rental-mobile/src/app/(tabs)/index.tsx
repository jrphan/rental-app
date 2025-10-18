import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/colors";

export default function HomeScreen() {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Header with Mid-Autumn Festival theme */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.userGreeting}>
            <View style={styles.profileIcon}>
              <Ionicons name="person" size={24} color="white" />
            </View>
            <Text style={styles.greetingText}>Xin chào!</Text>
          </View>

          {/* Decorative elements */}
          <View style={styles.decorativeElements}>
            <View style={styles.moon} />
            <View style={[styles.lantern, styles.lantern1]} />
            <View style={[styles.lantern, styles.lantern2]} />
            <View style={[styles.lantern, styles.lantern3]} />
          </View>
        </View>
      </View>

      {/* Car Rental Booking Module */}
      <View style={styles.bookingCard}>
        <View style={styles.rentalTabs}>
          <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <Ionicons name="car" size={20} color="white" />
            <Text style={styles.activeTabText}>Xe tự lái</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Ionicons name="car-sport" size={20} color="#6b7280" />
            <Text style={styles.inactiveTabText}>Xe có tài xế</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.locationInput}>
          <Ionicons name="location" size={20} color={COLORS.primary} />
          <Text style={styles.inputLabel}>Địa điểm</Text>
          <Text style={styles.inputValue}>TP. Hồ Chí Minh</Text>
        </View>

        <View style={styles.timeInput}>
          <Ionicons name="calendar" size={20} color={COLORS.primary} />
          <Text style={styles.inputLabel}>Thời gian thuê</Text>
          <Text style={styles.inputValue}>
            21h00, 04/10/2025 - 20h00, 05/10/2025
          </Text>
        </View>

        <TouchableOpacity style={styles.searchButton}>
          <Text style={styles.searchButtonText}>Tìm xe</Text>
        </TouchableOpacity>
      </View>

      {/* Promotional Programs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chương trình khuyến mãi</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.promoScroll}
        >
          <View style={styles.promoCard}>
            <View style={styles.promoImage}>
              <Ionicons name="car" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.promoBrand}>MoRent</Text>
            <Text style={styles.promoSlogan}>
              CÙNG NÀNG VI VU THAY NGÀN LỜI CHÚC
            </Text>
            <View style={styles.promoCode}>
              <Text style={styles.codeText}>NHẬP MÃ MI2010</Text>
              <Text style={styles.discountText}>GIẢM NGAY 120K</Text>
            </View>
          </View>

          <View style={styles.promoCard}>
            <View style={styles.promoImage}>
              <Ionicons name="moon" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.promoBrand}>MoRent</Text>
            <Text style={styles.promoSlogan}>RƯỚC ĐÈN TRUNG THU TỰ LÁI</Text>
            <View style={styles.promoCode}>
              <Text style={styles.codeText}>NHẬP MÃ TRUNGTHU</Text>
              <Text style={styles.discountText}>GIẢM NGAY 200K</Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Insurance Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bảo hiểm</Text>
        <View style={styles.insuranceCard}>
          <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
          <View style={styles.insuranceContent}>
            <Text style={styles.insuranceTitle}>Bảo hiểm toàn diện</Text>
            <Text style={styles.insuranceDesc}>
              Bảo vệ tối đa cho chuyến đi của bạn
            </Text>
          </View>
          <TouchableOpacity style={styles.insuranceButton}>
            <Text style={styles.insuranceButtonText}>Xem chi tiết</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Floating Chatbot */}
      <TouchableOpacity style={styles.chatbotButton}>
        <Ionicons name="chatbubble" size={24} color="white" />
        <TouchableOpacity style={styles.closeButton}>
          <Ionicons name="close" size={16} color="white" />
        </TouchableOpacity>
      </TouchableOpacity>
    </ScrollView>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: COLORS.headerBlue,
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    position: "relative",
    overflow: "hidden",
  },
  headerContent: {
    position: "relative",
    zIndex: 2,
  },
  userGreeting: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  decorativeElements: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  moon: {
    position: "absolute",
    top: 20,
    left: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.moon,
    opacity: 0.8,
  },
  lantern: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  lantern1: {
    top: 30,
    right: 60,
    backgroundColor: COLORS.lanternRed,
  },
  lantern2: {
    top: 50,
    right: 40,
    backgroundColor: COLORS.lanternGreen,
  },
  lantern3: {
    top: 70,
    right: 80,
    backgroundColor: COLORS.lanternYellow,
  },
  bookingCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  rentalTabs: {
    flexDirection: "row",
    marginBottom: 20,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  activeTabText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 8,
  },
  inactiveTabText: {
    color: "#6b7280",
    fontWeight: "600",
    marginLeft: 8,
  },
  locationInput: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 12,
  },
  timeInput: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 12,
    marginRight: 8,
  },
  inputValue: {
    fontSize: 16,
    color: "#6b7280",
    flex: 1,
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  searchButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 16,
  },
  promoScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  promoCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    width: width * 0.7,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  promoImage: {
    height: 120,
    backgroundColor: COLORS.promoBackground,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  promoBrand: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 4,
  },
  promoSlogan: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 12,
    lineHeight: 16,
  },
  promoCode: {
    backgroundColor: COLORS.promoBackground,
    borderRadius: 8,
    padding: 8,
  },
  codeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.promoText,
    marginBottom: 2,
  },
  discountText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  insuranceCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  insuranceContent: {
    flex: 1,
    marginLeft: 12,
  },
  insuranceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  insuranceDesc: {
    fontSize: 14,
    color: "#6b7280",
  },
  insuranceButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  insuranceButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  chatbotButton: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
  },
});
