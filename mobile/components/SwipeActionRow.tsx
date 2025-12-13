import { useRef, type ReactNode } from "react";
import { Text, View } from "react-native";
import { RectButton, Swipeable } from "react-native-gesture-handler";

type SwipeAction = {
  label: string;
  onPress?: () => void;
  backgroundColor?: string;
  textColor?: string;
};

type SwipeActionRowProps = {
  children: ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
};

const ACTION_WIDTH = 88;

export default function SwipeActionRow({
  children,
  leftActions = [],
  rightActions = [],
}: SwipeActionRowProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const handlePress = (action: SwipeAction) => {
    swipeableRef.current?.close();
    action.onPress?.();
  };

  const renderActions = (actions: SwipeAction[]) => {
    if (!actions.length) return null;

    return (
      <View style={{ flexDirection: "row" }}>
        {actions.map((action, index) => (
          <RectButton
            key={`${action.label}-${index}`}
            onPress={() => handlePress(action)}
            style={{
              width: ACTION_WIDTH,
              backgroundColor: action.backgroundColor ?? "#e5e7eb",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: action.textColor ?? "#111827",
                fontSize: 14,
                fontWeight: "700",
              }}
            >
              {action.label}
            </Text>
          </RectButton>
        ))}
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      leftThreshold={20}
      rightThreshold={20}
      overshootLeft={false}
      overshootRight={false}
      enableTrackpadTwoFingerGesture
      renderLeftActions={
        leftActions.length ? () => renderActions(leftActions) : undefined
      }
      renderRightActions={
        rightActions.length ? () => renderActions(rightActions) : undefined
      }
    >
      {children}
    </Swipeable>
  );
}
