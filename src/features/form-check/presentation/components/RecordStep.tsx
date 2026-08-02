import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { Button, Icon, Stack, Text, useTheme } from '@/design-system';
import { GlowCard } from '@/features/dashboard';
import { haptics } from '@/shared/haptics';
import type { FormCheckExercise, Recording } from '../../domain/entities/form-check';

/**
 * Video capture is not available on the web.
 *
 * expo-camera can show a preview through getUserMedia, but `recordAsync` is
 * native-only — so rather than show a record button that silently produces
 * nothing, the web path says what it needs and offers the clip-length route
 * instead.
 */
const CAN_RECORD = Platform.OS !== 'web';

/** Clip lengths offered when recording is unavailable. */
const SAMPLE_LENGTHS = [10, 20, 30, 45];

export function RecordStep({
  exercise,
  onRecorded,
  onBack,
  autoStart = false,
}: {
  exercise: FormCheckExercise;
  onRecorded: (recording: Recording) => void;
  onBack: () => void;
  autoStart?: boolean;
}) {
  const theme = useTheme();
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [isRecording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isCameraReady, setCameraReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(autoStart ? 3 : null);
  const startedAt = useRef<number | null>(null);
  const hasAutoStarted = useRef(false);

  useEffect(() => {
    if (!isRecording) return;
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [isRecording]);

  const start = useCallback(async () => {
    if (!camera.current) return;
    haptics.select();
    setElapsed(0);
    setRecording(true);
    startedAt.current = Date.now();

    try {
      const video = await camera.current.recordAsync();
      onRecorded({
        uri: video?.uri ?? null,
        durationSeconds: Math.max(
          1,
          Math.round((Date.now() - (startedAt.current ?? Date.now())) / 1000),
        ),
        recordedAt: new Date().toISOString(),
      });
    } finally {
      setRecording(false);
      startedAt.current = null;
    }
  }, [onRecorded]);

  useEffect(() => {
    if (!autoStart || !permission?.granted || !isCameraReady || hasAutoStarted.current) return;

    if (countdown === null) return;
    if (countdown === 0) {
      const timer = setTimeout(() => {
        hasAutoStarted.current = true;
        setCountdown(null);
        void start();
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => setCountdown((value) => (value ?? 1) - 1), 1000);
    return () => clearTimeout(timer);
  }, [autoStart, countdown, isCameraReady, permission?.granted, start]);

  const stop = () => {
    haptics.success();
    camera.current?.stopRecording();
  };

  const watchPoints = (
    <GlowCard padding="md">
      <Stack gap="sm">
        <Text variant="caption" color="muted" style={{ letterSpacing: 0.6 }}>
          FILM SO THESE ARE VISIBLE
        </Text>
        {exercise.watchPoints.map((point) => (
          <Stack key={point} direction="row" gap="sm" align="center">
            <Icon name="check" size={14} color={theme.colors.accent} />
            <Text variant="caption" color="muted">
              {point}
            </Text>
          </Stack>
        ))}
        <Text variant="caption" color="muted">
          A side-on angle from a few metres away shows the most.
        </Text>
      </Stack>
    </GlowCard>
  );

  /* ------------------------------- web path -------------------------------- */

  if (!CAN_RECORD) {
    return (
      <Stack gap="lg">
        <Text variant="heading">{exercise.name}</Text>

        <GlowCard>
          <Stack gap="sm">
            <Text variant="callout">Recording needs a development build</Text>
            <Text variant="caption" color="muted">
              Video capture uses native camera APIs that the browser build does not include.
              On a phone you can record here directly. Meanwhile, pick a clip length to see
              what the analysis returns.
            </Text>
          </Stack>
        </GlowCard>

        {watchPoints}

        <Stack gap="sm">
          <Text variant="caption" color="muted" style={{ letterSpacing: 0.6 }}>
            CLIP LENGTH
          </Text>
          <Stack direction="row" gap="sm">
            {SAMPLE_LENGTHS.map((seconds) => (
              <Button
                key={seconds}
                label={`${seconds}s`}
                variant="secondary"
                size="sm"
                onPress={() =>
                  onRecorded({
                    uri: null,
                    durationSeconds: seconds,
                    recordedAt: new Date().toISOString(),
                  })
                }
                style={{ flex: 1 }}
              />
            ))}
          </Stack>
        </Stack>

        <Button label="Choose a different exercise" variant="ghost" onPress={onBack} />
      </Stack>
    );
  }

  /* ------------------------------ native path ------------------------------ */

  if (!permission) {
    return (
      <Stack gap="lg">
        <Text variant="body" color="muted">
          Checking camera access…
        </Text>
      </Stack>
    );
  }

  if (!permission.granted) {
    return (
      <Stack gap="lg">
        <Text variant="heading">Camera access needed</Text>
        <Text variant="body" color="muted">
          Pulse needs the camera to record your set. The video stays on your device — nothing
          is uploaded.
        </Text>
        <Button label="Allow camera" onPress={() => void requestPermission()} />
        <Button label="Back" variant="ghost" onPress={onBack} />
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <Text variant="heading">{exercise.name}</Text>

      <View
        style={{
          height: 380,
          borderRadius: theme.radius.xl,
          borderWidth: 1,
          borderColor: isRecording ? theme.colors.danger : theme.colors.dashboard.bodyStroke,
          overflow: 'hidden',
        }}
      >
        <CameraView
          ref={camera}
          style={{ flex: 1 }}
          facing="back"
          mode="video"
          onCameraReady={() => setCameraReady(true)}
        />
        {countdown !== null ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              inset: 0,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.38)',
            }}
          >
            <Text variant="display">{countdown}</Text>
            <Text variant="callout">Get in position</Text>
          </View>
        ) : null}
      </View>

      <Stack direction="row" align="center" justify="center" gap="md">
        <Text variant="title" style={{ fontVariant: ['tabular-nums'] }}>
          {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
        </Text>
      </Stack>

      <Pressable
        onPress={isRecording ? stop : countdown === null ? () => void start() : undefined}
        disabled={countdown !== null && !isRecording}
        accessibilityRole="button"
        accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
        style={({ pressed }) => ({
          alignSelf: 'center',
          width: 72,
          height: 72,
          borderRadius: theme.radius.full,
          borderWidth: 3,
          borderColor: theme.colors.danger,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isRecording ? theme.colors.danger : 'transparent',
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <View
          style={{
            width: isRecording ? 22 : 52,
            height: isRecording ? 22 : 52,
            borderRadius: isRecording ? theme.radius.sm : theme.radius.full,
            backgroundColor: isRecording ? theme.colors.text : theme.colors.danger,
          }}
        />
      </Pressable>

      {watchPoints}

      {isRecording ? null : (
        <Button label="Choose a different exercise" variant="ghost" onPress={onBack} />
      )}
    </Stack>
  );
}
