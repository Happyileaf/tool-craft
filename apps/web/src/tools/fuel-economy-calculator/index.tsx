'use client';

import { Alert, Button, Card, InputNumber, Select, Space } from 'antd';
import { useMemo, useState } from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  DEFAULT_DISTANCE_KM,
  DEFAULT_ECONOMY_UNIT,
  DEFAULT_ECONOMY_VALUE,
  DEFAULT_PRICE_PER_LITER,
  DEFAULT_TANK_LITERS,
  DEFAULT_TRAVELERS,
  DEFAULT_TRIP_L_PER_100KM,
  ECONOMY_PRESETS,
} from './constants';
import {
  FUEL_ECONOMY_UNIT_OPTIONS,
  FuelEconomyUnitEnum,
  convertFuelEconomy,
  estimateTripCost,
} from './utils/fuel';
import styles from './index.module.css';

function toError(error: unknown): string {
  return error instanceof Error ? error.message : '计算失败';
}

function formatNumber(value: number, digits = 2): string {
  return Number(value.toFixed(digits)).toString();
}

export default function FuelEconomyCalculatorTool(_props: ToolComponentProps) {
  const [economyValue, setEconomyValue] = useState(DEFAULT_ECONOMY_VALUE);
  const [economyUnit, setEconomyUnit] = useState<FuelEconomyUnitEnum>(DEFAULT_ECONOMY_UNIT);
  const [distanceKm, setDistanceKm] = useState(DEFAULT_DISTANCE_KM);
  const [tripEconomy, setTripEconomy] = useState(DEFAULT_TRIP_L_PER_100KM);
  const [pricePerLiter, setPricePerLiter] = useState(DEFAULT_PRICE_PER_LITER);
  const [tankLiters, setTankLiters] = useState(DEFAULT_TANK_LITERS);
  const [travelers, setTravelers] = useState(DEFAULT_TRAVELERS);

  const conversion = useMemo(() => {
    try {
      return { data: convertFuelEconomy(economyValue, economyUnit), error: null };
    } catch (error) {
      return { data: null, error: toError(error) };
    }
  }, [economyValue, economyUnit]);

  const trip = useMemo(() => {
    try {
      return {
        data: estimateTripCost({
          distanceKm,
          litersPer100Km: tripEconomy,
          pricePerLiter,
          tankLiters,
          travelers,
        }),
        error: null,
      };
    } catch (error) {
      return { data: null, error: toError(error) };
    }
  }, [distanceKm, tripEconomy, pricePerLiter, tankLiters, travelers]);

  return (
    <div className={styles.container}>
      <Card title="油耗单位换算">
        <Space wrap className={styles.presets}>
          {ECONOMY_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              size="small"
              onClick={() => {
                setEconomyValue(preset.value);
                setEconomyUnit(preset.unit);
              }}
            >
              {preset.label}
            </Button>
          ))}
        </Space>
        <Space wrap align="end">
          <InputNumber
            min={0.01}
            value={economyValue}
            onChange={(value) => setEconomyValue(value ?? DEFAULT_ECONOMY_VALUE)}
            style={{ width: 160 }}
          />
          <Select
            options={FUEL_ECONOMY_UNIT_OPTIONS}
            value={economyUnit}
            onChange={(value) => setEconomyUnit(value)}
            style={{ width: 160 }}
          />
          <span className={styles.hint}>输入任意一种油耗表示，其余单位实时换算</span>
        </Space>

        {conversion.error && <Alert type="error" showIcon message={conversion.error} />}

        {conversion.data && (
          <div className={styles.grid}>
            <div className={styles.stat}>
              <span className={styles.label}>MPG（美制）</span>
              <span className={styles.value}>{formatNumber(conversion.data.mpgUs)}</span>
              <span className={styles.sub}>miles / US gallon</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.label}>MPG（英制）</span>
              <span className={styles.value}>{formatNumber(conversion.data.mpgUk)}</span>
              <span className={styles.sub}>miles / imperial gallon</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.label}>L/100km</span>
              <span className={styles.value}>{formatNumber(conversion.data.lPer100Km)}</span>
              <span className={styles.sub}>升每百公里</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.label}>km/L</span>
              <span className={styles.value}>{formatNumber(conversion.data.kmPerL)}</span>
              <span className={styles.sub}>公里每升</span>
            </div>
          </div>
        )}
      </Card>

      <Card title="行程油费估算">
        <div className={styles.inputs}>
          <div className={styles.field}>
            <span className={styles.label}>行程距离（km）</span>
            <InputNumber
              min={1}
              value={distanceKm}
              onChange={(value) => setDistanceKm(value ?? DEFAULT_DISTANCE_KM)}
              style={{ width: 140 }}
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>行程油耗（L/100km）</span>
            <InputNumber
              min={0.01}
              value={tripEconomy}
              onChange={(value) => setTripEconomy(value ?? DEFAULT_TRIP_L_PER_100KM)}
              style={{ width: 150 }}
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>油价（元/L）</span>
            <InputNumber
              min={0}
              value={pricePerLiter}
              onChange={(value) => setPricePerLiter(value ?? DEFAULT_PRICE_PER_LITER)}
              style={{ width: 130 }}
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>油箱容量（L）</span>
            <InputNumber
              min={0}
              value={tankLiters}
              onChange={(value) => setTankLiters(value ?? DEFAULT_TANK_LITERS)}
              style={{ width: 130 }}
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>同行人数</span>
            <InputNumber
              min={1}
              precision={0}
              value={travelers}
              onChange={(value) => setTravelers(value ?? DEFAULT_TRAVELERS)}
              style={{ width: 110 }}
            />
          </div>
        </div>

        {trip.error && <Alert type="error" showIcon message={trip.error} />}

        {trip.data && (
          <div className={styles.grid}>
            <div className={styles.stat}>
              <span className={styles.label}>行程耗油量</span>
              <span className={styles.value}>{formatNumber(trip.data.fuelLiters)} L</span>
              <span className={styles.sub}>按 {formatNumber(tripEconomy)} L/100km 计算</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.label}>行程油费</span>
              <span className={styles.value}>¥ {formatNumber(trip.data.totalCost)}</span>
              <span className={styles.sub}>{formatNumber(pricePerLiter)} 元/L</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.label}>中途加油次数</span>
              <span className={styles.value}>
                {trip.data.refuels === null ? '—' : `${trip.data.refuels} 次`}
              </span>
              <span className={styles.sub}>油箱 {formatNumber(tankLiters)} L</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.label}>人均油费</span>
              <span className={styles.value}>¥ {formatNumber(trip.data.perPersonCost)}</span>
              <span className={styles.sub}>{travelers} 人分摊</span>
            </div>
          </div>
        )}
      </Card>

      <Card size="small" title="换算说明">
        <ul className={styles.notes}>
          <li>L/100km 与 km/L 互为倒数：km/L = 100 ÷ (L/100km)。</li>
          <li>1 美制加仑 = 3.785411784 L，1 英制加仑 = 4.54609 L，1 英里 = 1.609344 km，因此同一辆车的美制 MPG 数值比英制低约 20%。</li>
          <li>行程耗油量 = 距离 ÷ 100 × 油耗；加油次数 = ⌈耗油量 ÷ 油箱容量⌉ − 1（假定出发时满油）。</li>
        </ul>
      </Card>
    </div>
  );
}
