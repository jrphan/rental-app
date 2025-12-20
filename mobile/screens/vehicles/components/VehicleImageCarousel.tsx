import React, { useState, useRef } from "react";
import {
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import ImageViewing from "react-native-image-viewing";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { VehicleImage } from "../types";

interface VehicleImageCarouselProps {
  images: VehicleImage[];
  height?: number;
}

export default function VehicleImageCarousel({
  images,
  height = 320,
}: VehicleImageCarouselProps) {
  const { width: windowWidth } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fullScreenImageIndex, setFullScreenImageIndex] = useState<
    number | null
  >(null);

  // Sắp xếp ảnh: ảnh primary đầu tiên
  const sortedImages = React.useMemo(() => {
    if (!images || images.length === 0) return [];
    const primary = images.find((img) => img.isPrimary);
    const others = images.filter((img) => !img.isPrimary);
    return primary ? [primary, ...others] : images;
  }, [images]);

  const handleImageScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / windowWidth);
    setCurrentImageIndex(index);
  };

  const openFullScreen = (index: number) => {
    setFullScreenImageIndex(index);
  };

  const closeFullScreen = () => {
    setFullScreenImageIndex(null);
  };

  // Chuyển đổi images sang format cho ImageViewing
  const imageViewingImages = sortedImages.map((img) => ({ uri: img.url }));

  if (sortedImages.length === 0) {
    return (
      <View
        className="w-full bg-gray-200 items-center justify-center"
        style={{ height }}
      >
        <MaterialIcons name="directions-bike" size={64} color="#9CA3AF" />
      </View>
    );
  }

  return (
    <>
      <View className="w-full bg-gray-200 relative" style={{ height }}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleImageScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToInterval={windowWidth}
          snapToAlignment="start"
        >
          {sortedImages.map((img, index) => (
            <TouchableOpacity
              key={img.id || index}
              activeOpacity={0.9}
              onPress={() => openFullScreen(index)}
            >
              <Image
                source={{ uri: img.url }}
                style={{ width: windowWidth, height }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Pagination Dots */}
        {sortedImages.length > 1 && (
          <View className="absolute bottom-4 left-0 right-0 flex-row justify-center items-center">
            {sortedImages.map((_, index) => (
              <View
                key={index}
                className={`mx-1 rounded-full ${
                  index === currentImageIndex
                    ? "bg-white w-2 h-2"
                    : "bg-white/50 w-1.5 h-1.5"
                }`}
              />
            ))}
          </View>
        )}
      </View>

      {/* Full Screen Image Viewer */}
      <ImageViewing
        images={imageViewingImages}
        imageIndex={fullScreenImageIndex ?? 0}
        visible={fullScreenImageIndex !== null}
        onRequestClose={closeFullScreen}
        swipeToCloseEnabled={true}
        doubleTapToZoomEnabled={true}
        presentationStyle="overFullScreen"
      />
    </>
  );
}
