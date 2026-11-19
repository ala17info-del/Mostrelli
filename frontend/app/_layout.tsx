import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LogBox, Platform, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { AuthProvider } from "@/src/auth";
import { ErrorBoundary } from "@/src/components/error-boundary";
import { GameProvider } from "@/src/game/GameContext";
import { queryClient } from "@/src/query-client";
import "@/src/webNoSelect";
import { colors } from "@/src/theme";

LogBox.ignoreAllLogs(true);

export default function RootLayout() {
  useFonts({ SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf") });
  return (
    <GestureHandlerRootView style={styles.root}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <KeyboardProvider>
            <AuthProvider>
              <GameProvider>
                <StatusBar style="light" />
                {/* On computers the game stays phone-shaped and centred, so tiles and menus keep their size. */}
                <View style={styles.column}>
                  <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface }, animation: "fade" }} />
                </View>
              </GameProvider>
            </AuthProvider>
          </KeyboardProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Platform.OS === "web" ? "#0b0b0b" : colors.surface },
  column: Platform.OS === "web"
    ? { flex: 1, width: "100%", maxWidth: 520, alignSelf: "center", overflow: "hidden" }
    : { flex: 1 },
});
