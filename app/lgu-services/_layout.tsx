import { Stack } from 'expo-router';

export default function LguServicesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="browse" />
      <Stack.Screen name="my-requests" />
      <Stack.Screen name="situation/[group]" />
      <Stack.Screen name="request/[templateKey]" />
      <Stack.Screen name="confirmation" />
      <Stack.Screen name="request-detail/[requestId]" />
    </Stack>
  );
}
