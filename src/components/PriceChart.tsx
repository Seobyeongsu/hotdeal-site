'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PriceRecord {
  price: number;
  recorded_at: string;
}

interface PriceChartProps {
  data: PriceRecord[];
  currentPrice: number;
  minPrice: number;
  maxPrice: number;
}

function formatPrice(price: number) {
  return price.toLocaleString('ko-KR');
}

export default function PriceChart({ data, currentPrice, minPrice, maxPrice }: PriceChartProps) {
  const chartData = {
    labels: data.map((d) => {
      const date = new Date(d.recorded_at);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }),
    datasets: [
      {
        label: '가격',
        data: data.map((d) => d.price),
        borderColor: '#ff4d4d',
        backgroundColor: 'rgba(255, 77, 77, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${formatPrice(context.raw)}원`,
        },
      },
      annotation: {
        annotations: {
          currentPrice: {
            type: 'line' as const,
            yMin: currentPrice,
            yMax: currentPrice,
            borderColor: '#00d68f',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              display: true,
              content: `현재가 ${formatPrice(currentPrice)}원`,
              position: 'end' as const,
            },
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#8b8b9e',
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#8b8b9e',
          callback: (value: any) => `${formatPrice(value)}원`,
        },
      },
    },
  };

  return (
    <div className="h-80">
      {data.length > 0 ? (
        <Line data={chartData} options={options} />
      ) : (
        <div className="h-full flex items-center justify-center text-gray-400">
          가격 변동 데이터가 없습니다.
        </div>
      )}
    </div>
  );
}
