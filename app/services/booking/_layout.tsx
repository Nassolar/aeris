import { Stack } from 'expo-router';

export default function ServiceBookingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="confirm" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="complete" />
    </Stack>
  );
}
