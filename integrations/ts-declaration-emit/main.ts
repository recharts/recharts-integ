/**
 * A consumer that re-declares Recharts components through `forwardRef` while emitting its own
 * declaration files. That combination forces TypeScript to write each prop type into the emitted
 * `.d.ts`, which fails with TS4023 if the prop type references anything Recharts does not export.
 *
 * See https://github.com/recharts/recharts/issues/6291
 */
import { forwardRef } from 'react';
import type {
  AreaProps,
  BarProps,
  BrushProps,
  CartesianGridProps,
  CellProps,
  CustomizedProps,
  ErrorBarProps,
  FunnelProps,
  LabelProps,
  LegendProps,
  LineProps,
  PieProps,
  PolarAngleAxisProps,
  PolarGridProps,
  PolarRadiusAxisProps,
  RadarProps,
  RadialBarProps,
  ReferenceAreaProps,
  ReferenceDotProps,
  ReferenceLineProps,
  ResponsiveContainerProps,
  SankeyProps,
  ScatterProps,
  TextProps,
  TooltipProps,
  TreemapProps,
  XAxisProps,
  YAxisProps,
} from 'recharts';

export const WrappedArea = forwardRef<HTMLElement, AreaProps<any, any>>(() => null);
export const WrappedBar = forwardRef<HTMLElement, BarProps>(() => null);
export const WrappedBrush = forwardRef<HTMLElement, BrushProps>(() => null);
export const WrappedCartesianGrid = forwardRef<HTMLElement, CartesianGridProps>(() => null);
export const WrappedCell = forwardRef<HTMLElement, CellProps>(() => null);
export const WrappedCustomized = forwardRef<HTMLElement, CustomizedProps<any, any>>(() => null);
export const WrappedErrorBar = forwardRef<HTMLElement, ErrorBarProps>(() => null);
export const WrappedFunnel = forwardRef<HTMLElement, FunnelProps>(() => null);
export const WrappedLabel = forwardRef<HTMLElement, LabelProps>(() => null);
export const WrappedLegend = forwardRef<HTMLElement, LegendProps>(() => null);
export const WrappedLine = forwardRef<HTMLElement, LineProps>(() => null);
export const WrappedPie = forwardRef<HTMLElement, PieProps>(() => null);
export const WrappedPolarAngleAxis = forwardRef<HTMLElement, PolarAngleAxisProps>(() => null);
export const WrappedPolarGrid = forwardRef<HTMLElement, PolarGridProps>(() => null);
export const WrappedPolarRadiusAxis = forwardRef<HTMLElement, PolarRadiusAxisProps>(() => null);
export const WrappedRadar = forwardRef<HTMLElement, RadarProps>(() => null);
export const WrappedRadialBar = forwardRef<HTMLElement, RadialBarProps>(() => null);
export const WrappedReferenceArea = forwardRef<HTMLElement, ReferenceAreaProps>(() => null);
export const WrappedReferenceDot = forwardRef<HTMLElement, ReferenceDotProps>(() => null);
export const WrappedReferenceLine = forwardRef<HTMLElement, ReferenceLineProps>(() => null);
export const WrappedResponsiveContainer = forwardRef<HTMLElement, ResponsiveContainerProps>(() => null);
export const WrappedSankey = forwardRef<HTMLElement, SankeyProps>(() => null);
export const WrappedScatter = forwardRef<HTMLElement, ScatterProps>(() => null);
export const WrappedText = forwardRef<HTMLElement, TextProps>(() => null);
export const WrappedTooltip = forwardRef<HTMLElement, TooltipProps>(() => null);
export const WrappedTreemap = forwardRef<HTMLElement, TreemapProps>(() => null);
export const WrappedXAxis = forwardRef<HTMLElement, XAxisProps>(() => null);
export const WrappedYAxis = forwardRef<HTMLElement, YAxisProps>(() => null);
