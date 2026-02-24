import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Circle,
} from 'react-native-svg';

interface SparklineChartProps {
  /** Points de données */
  data: number[];
  /** Couleur de la ligne */
  color: string;
  /** Largeur du graphique */
  width: number;
  /** Hauteur du graphique */
  height: number;
  /** Afficher les labels des jours sous la courbe */
  showDayLabels?: boolean;
}

/**
 * Mini graphique de tendance (sparkline) avec SVG
 * Affiche une courbe lisse avec aire dégradée sous la ligne
 */
const SparklineChart: React.FC<SparklineChartProps> = ({
  data,
  color,
  width,
  height,
  showDayLabels = false,
}) => {
  // Générer les labels des jours (L, M, M, J, V, S, D)
  const dayLabels = useMemo(() => {
    if (!showDayLabels) return [];
    const labels: string[] = [];
    const joursCourts = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      labels.push(joursCourts[d.getDay()]);
    }
    return labels;
  }, [showDayLabels]);

  const labelHeight = showDayLabels ? 16 : 0;
  const chartHeight = height - labelHeight;

  const { linePath, areaPath, points } = useMemo(() => {
    if (data.length < 2) {
      return { linePath: '', areaPath: '', points: [] };
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;

    // Quand toutes les valeurs sont identiques ou nulles
    const allZero = max === 0;
    const normalize = (value: number) => {
      if (allZero) return 0.2; // Ligne basse mais visible quand tout est à 0
      if (range === 0) return 0.5; // Toutes les valeurs identiques (non-nulles) → milieu
      return (value - min) / range;
    };

    const padding = 4;
    const chartW = width - padding * 2;
    const chartH = chartHeight - padding * 2;

    // Calcul des points
    const pts = data.map((value, index) => ({
      x: padding + (index / Math.max(data.length - 1, 1)) * chartW,
      y: padding + chartH - normalize(value) * chartH,
      value,
    }));

    // Courbe lisse avec points de contrôle cubiques
    let line = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const current = pts[i];
      const next = pts[i + 1];
      const cpx = (current.x + next.x) / 2;
      line += ` C ${cpx} ${current.y}, ${cpx} ${next.y}, ${next.x} ${next.y}`;
    }

    // Aire sous la courbe
    const lastPoint = pts[pts.length - 1];
    const area =
      line +
      ` L ${lastPoint.x} ${chartHeight} L ${pts[0].x} ${chartHeight} Z`;

    return { linePath: line, areaPath: area, points: pts };
  }, [data, width, chartHeight]);

  if (data.length < 2) {
    return <View style={{ width, height }} />;
  }

  const gradientId = `sparkGrad_${color.replace('#', '')}_${width}`;
  // Dernier point pour le dot animé
  const lastPoint = points[points.length - 1];
  // Point max pour le mettre en évidence
  const maxValue = Math.max(...data);

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={chartHeight}>
        <Defs>
          <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.25" />
            <Stop offset="1" stopColor={color} stopOpacity="0.02" />
          </SvgLinearGradient>
        </Defs>
        {/* Aire dégradée */}
        <Path d={areaPath} fill={`url(#${gradientId})`} />
        {/* Ligne */}
        <Path
          d={linePath}
          stroke={color}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dot sur le dernier point (aujourd'hui) */}
        {lastPoint && (
          <>
            <Circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r={5}
              fill={color}
              opacity={0.2}
            />
            <Circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r={3}
              fill={color}
            />
          </>
        )}
        {/* Dots sur les points avec valeur > 0 (sauf le dernier) */}
        {points.slice(0, -1).map((pt, i) =>
          pt.value > 0 ? (
            <Circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={2}
              fill={color}
              opacity={0.5}
            />
          ) : null,
        )}
      </Svg>
      {/* Labels des jours */}
      {showDayLabels && dayLabels.length > 0 && (
        <View style={styles.labelsRow}>
          {dayLabels.map((label, i) => (
            <Text
              key={i}
              style={[
                styles.dayLabel,
                i === dayLabels.length - 1 && { color, fontWeight: '700' },
              ]}
            >
              {label}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    height: 16,
  },
  dayLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    fontWeight: '500',
    textAlign: 'center',
    width: 14,
  },
});

export default SparklineChart;
