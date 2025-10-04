import React from "react";
import {
  View,
  Modal as RNModal,
  StyleSheet,
  ViewStyle,
  TouchableWithoutFeedback,
  Dimensions,
} from "react-native";
import { theme } from "../../styles/theme";
import Text from "./Text";
import Button from "./Button";

export type ModalSize = "sm" | "md" | "lg" | "full";

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: ModalSize;
  closable?: boolean;
  maskClosable?: boolean;
  showCloseButton?: boolean;
  style?: ViewStyle;
  footer?: React.ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  size = "md",
  closable = true,
  maskClosable = true,
  showCloseButton = true,
  style,
  footer,
  onConfirm,
  onCancel,
  confirmText = "OK",
  cancelText = "Cancel",
}) => {
  const getSizeStyles = () => {
    const sizes = {
      sm: {
        width: screenWidth * 0.8,
        maxWidth: 400,
      },
      md: {
        width: screenWidth * 0.9,
        maxWidth: 500,
      },
      lg: {
        width: screenWidth * 0.95,
        maxWidth: 600,
      },
      full: {
        width: screenWidth,
        height: screenHeight,
      },
    };
    return sizes[size];
  };

  const sizeStyles = getSizeStyles();

  const handleMaskPress = () => {
    if (maskClosable) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  const renderDefaultFooter = () => {
    if (footer !== undefined) {
      return footer;
    }

    return (
      <View style={styles.footer}>
        {onCancel && (
          <Button
            title={cancelText}
            onPress={handleCancel}
            variant="outline"
            style={styles.footerButton}
          />
        )}
        <Button
          title={confirmText}
          onPress={handleConfirm}
          variant="primary"
          style={styles.footerButton}
        />
      </View>
    );
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={handleMaskPress}>
        <View style={styles.mask}>
          <TouchableWithoutFeedback>
            <View style={[styles.modal, sizeStyles, style]}>
              {title && (
                <View style={styles.header}>
                  <Text variant="h4" style={styles.title}>
                    {title}
                  </Text>
                  {showCloseButton && closable && (
                    <Button
                      title="×"
                      onPress={onClose}
                      variant="ghost"
                      size="sm"
                      style={styles.closeButton}
                    />
                  )}
                </View>
              )}

              <View style={styles.content}>{children}</View>

              {renderDefaultFooter()}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  mask: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing[4],
  },
  modal: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadow.lg,
    maxHeight: screenHeight * 0.8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  title: {
    flex: 1,
    marginRight: theme.spacing[2],
  },
  closeButton: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 0,
  },
  content: {
    padding: theme.spacing[4],
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: theme.spacing[4],
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
    gap: theme.spacing[2],
  },
  footerButton: {
    minWidth: 80,
  },
});

export default Modal;
