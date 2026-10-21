import { useCallback, useEffect, useState } from 'react';
import type { DashboardSummary } from '@carrera/shared';
import { formatCurrency } from '@carrera/shared';
import { useAuth } from '../hooks/useAuth';
import { fetchDashboardSummary } from '../services/dashboard.service';
import { AppLayout } from '../components/layout/AppLayout';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageLoader } from '../components/ui/Spinner';
import { BalanceCard } from '../components/dashboard/BalanceCard';
import { BetDonutChart } from '../components/dashboard/BetDonutChart';
import { RaceList } from '../components/dashboard/RaceList';
import { SnailBarChart } from '../components/dashboard/SnailBarChart';
import { TopUpForm } from '../components/dashboard/TopUpForm';
import { TransactionList } from '../components/dashboard/TransactionList';
import { calculateWinRate } from '../components/charts/chartData';
import './DashboardPage.css';

export function DashboardPage() {
  const { user, token, updateBalance } = useAuth();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);

  const loadSummary = useCallback(async () => {
    if (!token) return;

    setLoadError(null);

    try {
      const data = await fetchDashboardSummary(token);
      setSummary(data);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : 'No pudimos cargar el dashboard. Revisa que el backend esté encendido.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Carga inicial del dashboard.
  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    void (async () => {
      try {
        const data = await fetchDashboardSummary(token);
        if (!cancelled) setSummary(data);
      } catch (error) {
        if (cancelled) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : 'No pudimos cargar el dashboard. Revisa que el backend esté encendido.',
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  /** Cuando la pasarela aprueba una recarga, se actualiza el saldo y el historial. */
  const handleApproved = (balance: number) => {
    updateBalance(balance);
    void loadSummary();
  };

  const firstName = user?.fullName.split(' ')[0] ?? '';
  const today = new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return (
    <AppLayout>
      <header className="cc-dashboard__header">
        <div>
          <h1 className="cc-dashboard__title">Hola{firstName ? `, ${firstName}` : ''}</h1>
          <p className="cc-dashboard__subtitle">
            Aquí tienes el resumen de tus apuestas y las carreras de hoy ({today}).
          </p>
        </div>
        <Button variant="secondary" onClick={() => void loadSummary()} disabled={isLoading}>
          Actualizar
        </Button>
      </header>

      {loadError ? (
        <Alert variant="error" title="No pudimos cargar el dashboard">
          {loadError}
        </Alert>
      ) : null}

      <BalanceCard
        balance={user?.balance ?? 0}
        onStartTopUp={() => setIsTopUpOpen((open) => !open)}
        isLoading={isLoading}
      />

      {isTopUpOpen && token && user ? (
        <TopUpForm
          token={token}
          defaultCardHolder={user.fullName}
          onApproved={handleApproved}
        />
      ) : null}

      {isLoading && !summary ? (
        <PageLoader label="Cargando tus datos…" />
      ) : null}

      {summary ? (
        <>
          <div className="cc-dashboard__stats">
            <div className="cc-stat">
              <p className="cc-stat__label">Apuestas totales</p>
              <p className="cc-stat__value">{summary.betSummary.total}</p>
            </div>
            <div className="cc-stat">
              <p className="cc-stat__label">Tasa de aciertos</p>
              <p className="cc-stat__value">{calculateWinRate(summary.betSummary)}%</p>
            </div>
            <div className="cc-stat">
              <p className="cc-stat__label">Carreras de hoy</p>
              <p className="cc-stat__value">{summary.raceDay.races.length}</p>
            </div>
            <div className="cc-stat">
              <p className="cc-stat__label">Saldo en cuenta</p>
              <p className="cc-stat__value">{formatCurrency(user?.balance ?? 0)}</p>
            </div>
          </div>

          <div className="cc-dashboard__charts">
            <Card
              title="Apuestas ganadas y perdidas"
              subtitle={`${summary.betSummary.won} ganadas · ${summary.betSummary.lost} perdidas`}
            >
              <BetDonutChart summary={summary.betSummary} />
            </Card>

            <Card title="Victorias de los caracoles" subtitle="Carreras simuladas del día">
              <SnailBarChart raceDay={summary.raceDay} />
            </Card>
          </div>

          <Card title="Carreras del día" subtitle={`${summary.raceDay.totalVictories} victorias repartidas`}>
            <RaceList raceDay={summary.raceDay} />
          </Card>

          <Card title="Historial de recargas" subtitle="Los últimos movimientos de tu saldo">
            <TransactionList transactions={summary.transactions} />
          </Card>
        </>
      ) : null}
    </AppLayout>
  );
}
