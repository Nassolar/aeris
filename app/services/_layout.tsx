import { Stack } from 'expo-router';

export default function ServicesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[category]" />
      <Stack.Screen name="request" />
      <Stack.Screen name="providers" />
    </Stack>
  );
}
