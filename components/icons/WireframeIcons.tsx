import React from 'react';
import { ColorValue } from 'react-native';
import Svg, { Path, Circle, Rect, SvgProps, NumberProp } from 'react-native-svg';

interface IconProps extends SvgProps {
    size?: number;
    color?: ColorValue;
    strokeWidth?: NumberProp;
}

const BaseIcon = ({ children, color = '#000', size = 24, strokeWidth = 1.8 }: IconProps & { children?: React.ReactNode }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {children}
    </Svg>
);

export const PoliceIcon = (props: IconProps) => (
    <BaseIcon {...props}>
        <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </BaseIcon>
);

export const MedicalIcon = (props: SvgProps) => (
    <BaseIcon {...props}>
        <Rect x="3" y="3" width="18" height="18" rx="4" />
        <Path d="M12 8v8 M8 12h8" />
    </BaseIcon>
);

export const RescueIcon = (props: SvgProps) => (
    <BaseIcon {...props}>
        <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <Circle cx="12" cy="10" r="3" />
    </BaseIcon>
);


export const FireIcon = (props: SvgProps) => (
    <BaseIcon {...props}>
        <Path d="M12 2C9 5 7 8 7 11c0 2.8 2.2 5 5 5s5-2.2 5-5C17 8 15 5 12 2z" />
        <Path d="M12 9c-.7 1-1.5 2-1.5 3a1.5 1.5 0 0 0 3 0C13.5 11 12.7 10 12 9z" />
    </BaseIcon>
);

export const CameraIcon = (props: SvgProps) => (
    <BaseIcon {...props}>
        <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <Circle cx="12" cy="13" r="4" />
    </BaseIcon>
);

export const BellIcon = (props: SvgProps) => (
    <BaseIcon {...props}>
        <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </BaseIcon>
);

export const SearchIcon = (props: SvgProps) => (
    <BaseIcon {...props}>
        <Circle cx="11" cy="11" r="8" />
        <Path d="M21 21l-4.3-4.3" />
    </BaseIcon>
);

export const WrenchIcon = (props: SvgProps) => (
    <BaseIcon {...props}>
        <Path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </BaseIcon>
);

export const SparklesIcon = (props: SvgProps) => (
    <BaseIcon {...props}>
        <Path d="M12 3v4M12 17v4M3 12h4M17 12h4m-12.6-6.6l2.8 2.8M16.8 16.8l-2.8-2.8M4.4 16.8l2.8-2.8M16.8 7.2l-2.8 2.8" />
    </BaseIcon>
);

export const TruckIcon = (props: SvgProps) => (
    <BaseIcon {...props}>
        <Path d="M1 3h15v13H1z M16 8h4l3 3v5h-7V8z M5 16v2a2 2 0 0 0 4 0v-2 M15 16v2a2 2 0 0 0 4 0v-2" />
    </BaseIcon>
);

export const PaintbrushIcon = (props: SvgProps) => (
    <BaseIcon {...props}>
        <Path d="M18 2h4v4c0 4-4 4-4 4s-4 0-4-4v-4h4z" />
        <Path d="M18 10v6c0 1-1 2-2 2h-4c-1 0-2-1-2-2V6" />
        <Path d="M8 20v2 M4 20v2 M12 20v2" />
    </BaseIcon>
);

export const ScissorsIcon = (props: SvgProps) => (
    <BaseIcon {...props}>
        <Circle cx="6" cy="6" r="3" />
        <Circle cx="6" cy="18" r="3" />
        <Path d="M20 4L8.12 15.88 M14.47 14.48L20 20 M8.12 8.12L12 12" />
    </BaseIcon>
);

export const PawIcon = (props: SvgProps) => (
    <BaseIcon {...props}>
        <Path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
        <Circle cx="8" cy="10" r="2" />
        <Circle cx="16" cy="10" r="2" />
        <Circle cx="12" cy="7" r="2" />
    </BaseIcon>
);

export const MonitorIcon = (props: SvgProps) => (
    <BaseIcon {...props}>
        <Rect x="2" y="3" width="20" height="14" rx="2" />
        <Path d="M8 21h8 M12 17v4" />
    </BaseIcon>
);

export const GridIcon = (props: SvgProps) => (
    <BaseIcon {...props}>
        <Rect x="3" y="3" width="7" height="7" rx="1" />
        <Rect x="14" y="3" width="7" height="7" rx="1" />
        <Rect x="14" y="14" width="7" height="7" rx="1" />
        <Rect x="3" y="14" width="7" height="7" rx="1" />
    </BaseIcon>
);

export const BriefcaseIcon = (props: SvgProps) => (
    <BaseIcon {...props}>
        <Rect x="2" y="7" width="20" height="14" rx="2" />
        <Path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        <Path d="M12 12v2 M8 12h8" />
    </BaseIcon>
);

export const HomeIcon = (props: SvgProps) => (
    <BaseIcon {...props}>
        <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <Path d="M9 22V12h6v10" />
    </BaseIcon>
);

export const CalendarIcon = (props: SvgProps) => (
    <BaseIcon {...props}>
        <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <Path d="M16 2v4 M8 2v4 M3 10h18" />
    </BaseIcon>
);

export const ChatBubbleIcon = (props: SvgProps) => (
    <BaseIcon {...props}>
        <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </BaseIcon>
);

export const UserIcon = (props: SvgProps) => (
    <BaseIcon {...props}>
        <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <Circle cx="12" cy="7" r="4" />
    </BaseIcon>
);

export const WarningTriangleIcon = (props: IconProps) => (
    <BaseIcon {...props}>
        <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <Path d="M12 9v4 M12 17h.01" />
    </BaseIcon>
);

export const MicIcon = (props: IconProps) => (
    <BaseIcon {...props}>
        <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <Path d="M12 19v4 M8 23h8" />
    </BaseIcon>
);

export const ChevronRightIcon = (props: SvgProps) => (
    <BaseIcon {...props}>
        <Path d="M9 18l6-6-6-6" />
    </BaseIcon>
);

export const ChevronDownIcon = (props: SvgProps) => (
    <BaseIcon {...props}>
        <Path d="M6 9l6 6 6-6" />
    </BaseIcon>
);
