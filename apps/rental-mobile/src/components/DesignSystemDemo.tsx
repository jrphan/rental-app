import { useState } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import {
  Button,
  Input,
  Text,
  Card,
  Modal,
  Badge,
  Avatar,
  Switch,
  Icon,
} from "./ui/index";
import { theme } from "../styles/theme";

const DesignSystemDemo: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingVisible, setLoadingVisible] = useState(false);
  const [switchValue, setSwitchValue] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const showLoading = () => {
    setLoadingVisible(true);
    setTimeout(() => setLoadingVisible(false), 3000);
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="h2" style={styles.sectionTitle}>
        Design System Demo
      </Text>

      {/* Buttons Section */}
      <Card style={styles.section}>
        <Text variant="h4" style={styles.sectionHeader}>
          Buttons
        </Text>

        <View style={styles.buttonGroup}>
          <Button title="Primary" onPress={() => Alert.alert("Primary")} />
          <Button
            title="Secondary"
            variant="secondary"
            onPress={() => Alert.alert("Secondary")}
          />
          <Button
            title="Outline"
            variant="outline"
            onPress={() => Alert.alert("Outline")}
          />
          <Button
            title="Danger"
            variant="danger"
            onPress={() => Alert.alert("Danger")}
          />
          <Button
            title="Success"
            variant="success"
            onPress={() => Alert.alert("Success")}
          />
        </View>

        <View style={styles.buttonGroup}>
          <Button
            title="Small"
            size="sm"
            onPress={() => Alert.alert("Small")}
          />
          <Button
            title="Medium"
            size="md"
            onPress={() => Alert.alert("Medium")}
          />
          <Button
            title="Large"
            size="lg"
            onPress={() => Alert.alert("Large")}
          />
        </View>

        <Button
          title="Loading Button"
          loading={loadingVisible}
          onPress={showLoading}
          fullWidth
        />
      </Card>

      {/* Inputs Section */}
      <Card style={styles.section}>
        <Text variant="h4" style={styles.sectionHeader}>
          Inputs
        </Text>

        <Input
          label="Default Input"
          placeholder="Enter text here"
          value={inputValue}
          onChangeText={setInputValue}
        />

        <Input
          label="Email Input"
          placeholder="Enter email"
          keyboardType="email-address"
          variant="filled"
          value={inputValue}
          onChangeText={setInputValue}
        />

        <Input
          label="Password Input"
          placeholder="Enter password"
          secureTextEntry
          status="success"
          helperText="Password is strong"
          value={inputValue}
          onChangeText={setInputValue}
        />

        <Input
          label="Error Input"
          placeholder="Enter text"
          status="error"
          errorText="This field is required"
          value={inputValue}
          onChangeText={setInputValue}
        />

        <Input
          label="Disabled Input"
          placeholder="Disabled input"
          disabled
          value={inputValue}
          onChangeText={setInputValue}
        />
      </Card>

      {/* Text Section */}
      <Card style={styles.section}>
        <Text variant="h4" style={styles.sectionHeader}>
          Typography
        </Text>

        <Text variant="h1">Heading 1</Text>
        <Text variant="h2">Heading 2</Text>
        <Text variant="h3">Heading 3</Text>
        <Text variant="h4">Heading 4</Text>
        <Text variant="h5">Heading 5</Text>
        <Text variant="h6">Heading 6</Text>

        <Text variant="body1">Body 1 - Regular text content</Text>
        <Text variant="body2">Body 2 - Smaller text content</Text>
        <Text variant="caption">Caption text</Text>

        <Text variant="button" color="primary">
          Button Text
        </Text>
        <Text variant="link" onPress={() => Alert.alert("Link pressed")}>
          Link Text
        </Text>

        <Text color="success">Success text</Text>
        <Text color="warning">Warning text</Text>
        <Text color="error">Error text</Text>
      </Card>

      {/* Badges Section */}
      <Card style={styles.section}>
        <Text variant="h4" style={styles.sectionHeader}>
          Badges
        </Text>

        <View style={styles.badgeGroup}>
          <Badge>Default</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="error">Error</Badge>
        </View>

        <View style={styles.badgeGroup}>
          <Badge size="sm">Small</Badge>
          <Badge size="md">Medium</Badge>
          <Badge size="lg">Large</Badge>
        </View>

        <View style={styles.badgeGroup}>
          <Badge dot>
            <Text>Dot</Text>
          </Badge>
          <Badge count={5}>
            <Text>5</Text>
          </Badge>
          <Badge count={99}>
            <Text>99</Text>
          </Badge>
          <Badge count={150}>
            <Text>150</Text>
          </Badge>
        </View>
      </Card>

      {/* Avatars Section */}
      <Card style={styles.section}>
        <Text variant="h4" style={styles.sectionHeader}>
          Avatars
        </Text>

        <View style={styles.avatarGroup}>
          <Avatar name="John Doe" />
          <Avatar name="Jane Smith" size="lg" />
          <Avatar name="Bob Johnson" size="xl" />
          <Avatar
            source={{ uri: "https://via.placeholder.com/150" }}
            size="2xl"
          />
        </View>
      </Card>

      {/* Switch Section */}
      <Card style={styles.section}>
        <Text variant="h4" style={styles.sectionHeader}>
          Switches
        </Text>

        <View style={styles.switchGroup}>
          <Switch
            value={switchValue}
            onValueChange={setSwitchValue}
            label="Toggle Switch"
          />

          <Switch
            value={true}
            onValueChange={() => {}}
            label="Always On"
            size="lg"
          />

          <Switch
            value={false}
            onValueChange={() => {}}
            label="Disabled"
            disabled
          />
        </View>
      </Card>

      {/* Icons Section */}
      <Card style={styles.section}>
        <Text variant="h4" style={styles.sectionHeader}>
          Icons
        </Text>

        <View style={styles.iconGroup}>
          <Icon name="home" size="lg" />
          <Icon name="user" size="lg" />
          <Icon name="search" size="lg" />
          <Icon name="settings" size="lg" />
          <Icon name="star" size="lg" />
          <Icon name="heart" size="lg" />
        </View>
      </Card>

      {/* Modal Section */}
      <Card style={styles.section}>
        <Text variant="h4" style={styles.sectionHeader}>
          Modal
        </Text>

        <Button
          title="Open Modal"
          onPress={() => setModalVisible(true)}
          fullWidth
        />
      </Card>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Demo Modal"
        size="md"
      >
        <Text>This is a demo modal. You can put any content here.</Text>
        <Text style={{ marginTop: theme.spacing[4] }}>
          The modal supports different sizes and can have custom footers.
        </Text>
      </Modal>

      {/* Loading Overlay */}
      {/* <Loading text="Loading..." variant="overlay" /> */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray[50],
    padding: theme.spacing[4],
  },
  sectionTitle: {
    textAlign: "center",
    marginBottom: theme.spacing[6],
    color: theme.colors.gray[900],
  },
  section: {
    marginBottom: theme.spacing[4],
  },
  sectionHeader: {
    marginBottom: theme.spacing[4],
    color: theme.colors.gray[800],
  },
  buttonGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing[2],
    marginBottom: theme.spacing[4],
  },
  badgeGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing[2],
    marginBottom: theme.spacing[4],
  },
  avatarGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[4],
  },
  switchGroup: {
    gap: theme.spacing[4],
  },
  iconGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing[4],
  },
});

export default DesignSystemDemo;
