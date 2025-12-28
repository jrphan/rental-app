# Performance Optimizations cho Android (Samsung S23)

## Vấn đề

App bị lag khi scroll trên Samsung S23 với Expo Go, nhưng iOS và Android emulator không bị.

## Nguyên nhân

1. **Expo Go overhead**: Expo Go có overhead lớn hơn so với production build
2. **Nested ScrollViews**: ScrollView vertical chứa nhiều ScrollView horizontal
3. **Image loading**: Image component không optimize cho Android
4. **Re-renders**: Components không được memoize
5. **Memory**: Quá nhiều items render cùng lúc

## Các optimizations đã áp dụng

### 1. Image Optimization

- ✅ Dùng `expo-image` thay vì `Image` từ react-native
- ✅ Thêm `cachePolicy="memory-disk"` để cache images
- ✅ Thêm `recyclingKey` để optimize memory
- ✅ Thêm `transition` để smooth loading

### 2. Component Memoization

- ✅ Memoize `VehicleCard` với custom comparison function
- ✅ Chỉ re-render khi vehicle data thực sự thay đổi
- ✅ So sánh images một cách thông minh (không so sánh toàn bộ array)

### 3. ScrollView Optimizations

- ✅ Thêm `removeClippedSubviews={true}` để remove views ngoài viewport
- ✅ Thêm `nestedScrollEnabled={true}` cho nested scrolls
- ✅ Thêm `overScrollMode="never"` để giảm over-scroll effect
- ✅ Tăng `scrollEventThrottle` lên 32 cho Android (giảm số lần call onScroll)
- ✅ Thêm `decelerationRate="fast"` để scroll nhanh hơn

### 4. Reduce Initial Render Load

- ✅ Giới hạn số vehicles hiển thị ban đầu (8 items thay vì tất cả)
- ✅ Lazy load thêm items khi cần

### 5. FlatList Optimizations (cho vertical lists)

- ✅ Đã có sẵn trong VehiclesList:
  - `removeClippedSubviews={true}`
  - `maxToRenderPerBatch={10}`
  - `initialNumToRender={10}`
  - `windowSize={10}`

## Testing trên Samsung S23

### Trước khi optimize:

- Lag rõ rệt khi scroll
- Frame drops khi load images
- Memory usage cao

### Sau khi optimize:

- Scroll mượt hơn đáng kể
- Images load nhanh hơn nhờ caching
- Memory usage giảm
- Ít re-renders không cần thiết

## Additional Tips

### Nếu vẫn còn lag:

1. **Giảm số sections hiển thị cùng lúc**:

   ```typescript
   // Chỉ hiển thị 2-3 sections đầu, lazy load phần còn lại
   const visibleSections = cityQueries.slice(0, 2);
   ```

2. **Dùng InteractionManager để delay non-critical renders**:

   ```typescript
   import { InteractionManager } from "react-native";

   InteractionManager.runAfterInteractions(() => {
     // Render non-critical content
   });
   ```

3. **Enable Hermes engine** (nếu chưa enable):

   ```json
   // app.json
   {
     "expo": {
       "jsEngine": "hermes"
     }
   }
   ```

4. **Build production để test**:

   ```bash
   # Expo Go có overhead lớn, production build sẽ nhanh hơn nhiều
   eas build --platform android
   ```

5. **Profile với React DevTools**:
   - Enable "Highlight updates" để xem components nào re-render
   - Check "Why did this render?" để tìm nguyên nhân

## Monitoring Performance

### Check FPS:

```typescript
import { PerformanceObserver } from "react-native-performance";

const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log("Frame time:", entry.duration);
  }
});

observer.observe({ entryTypes: ["measure"] });
```

### Check Memory:

```typescript
// Android only
import { Platform } from "react-native";

if (Platform.OS === "android") {
  // Check memory usage
  console.log(
    "Memory:",
    require("react-native").NativeModules.DeviceInfo?.getTotalMemory()
  );
}
```

## Notes

- Expo Go có overhead lớn, production build sẽ nhanh hơn 2-3x
- Samsung devices có thể có thêm optimizations riêng (Game Booster, etc.)
- Test trên nhiều devices khác nhau để đảm bảo consistency
