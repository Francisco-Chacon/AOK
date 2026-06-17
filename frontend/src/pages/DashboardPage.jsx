import React, { useCallback, useEffect, useState } from "react";
import api from "../api/apiClient";
import { useToast } from "../components/Toast";
import { useLanguage } from "../i18n/LanguageContext";
import { t } from "../i18n/translations";

const ICONS = {
  clientes: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  recibos: "M7 3h10a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2V5a2 2 0 0 1 2-2 M10 8h6 M10 12h6 M10 16h3",
  facturas: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h5",
  estimados: "M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6",
  chart: "M18 20V10 M12 20V4 M6 20v-6",
  activity: "M12 8v4l3 3 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  chevron: "M6 9l6 6 6-6",
  alert: "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.36a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01",
  refresh: "M23 4v6h-6 M1 20v-6h6 M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15",
};

const MONTHS = {
  es: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

function money(value) {
  return `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function formatMonth(value, lang) {
  const [, month] = String(value || "").split("-");
  return MONTHS[lang]?.[Number(month) - 1] || value;
}

function getGreeting(date, lang) {
  const hour = date.getHours();
  if (hour < 12) return lang === "es" ? "Buenos dias" : "Good morning";
  if (hour < 18) return lang === "es" ? "Buenas tardes" : "Good afternoon";
  return lang === "es" ? "Buenas noches" : "Good evening";
}

function formatDate(date, lang) {
  return date.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function relativeDate(value, lang, now) {
  if (!value) return "";
  const diff = Math.floor((now - new Date(value)) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return lang === "es" ? "Hoy" : "Today";
  if (diff === 1) return lang === "es" ? "Ayer" : "Yesterday";
  if (diff < 7) return lang === "es" ? `Hace ${diff} dias` : `${diff} days ago`;
  return new Date(value).toLocaleDateString(lang === "es" ? "es-ES" : "en-US");
}

const Icon = ({ path, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={path} />
  </svg>
);

const KpiCard = ({ tone, icon, label, value, detail }) => (
  <article className={`dash-kpi dash-kpi--${tone}`}>
    <div className="dash-kpi-top">
      <div>
        <p className="dash-kpi-label">{label}</p>
        <p className="dash-kpi-value">{value}</p>
      </div>
      <div className="dash-kpi-icon"><Icon path={icon} /></div>
    </div>
    <p className="dash-kpi-detail">{detail}</p>
  </article>
);

const YearFilter = ({ years, selectedYear, open, setOpen, loading, lang, onChange }) => (
  <div className="dash-year-filter">
    <span>{lang === "es" ? "Año" : "Year"}</span>
    <button type="button" className="dash-year-trigger" disabled={loading} onClick={() => setOpen((v) => !v)}>
      {selectedYear}
      <Icon path={ICONS.chevron} size={14} />
    </button>
    {open ? (
      <div className="dash-year-menu">
        {years.map((year) => (
          <button key={year} type="button" className={year === selectedYear ? "dash-year-item dash-year-item--active" : "dash-year-item"} onClick={() => onChange(year)}>
            {year}
          </button>
        ))}
      </div>
    ) : null}
  </div>
);

const RevenueChart = ({ data, lang }) => {
  if (!data?.length) return <div className="dash-empty">{lang === "es" ? "Sin ingresos para mostrar" : "No income to display"}</div>;
  const max = Math.max(...data.map((item) => Number(item.total || 0)), 1);
  const total = data.reduce((sum, item) => sum + Number(item.total || 0), 0);

  return (
    <div className="dash-chart-body">
      <div className="dash-chart-summary">
        <div>
          <span>{lang === "es" ? "Ingresos del año" : "Year income"}</span>
          <strong>{money(total)}</strong>
          {total === 0 ? <p>{lang === "es" ? "Este año no tiene recibos pagados." : "This year has no paid receipts."}</p> : null}
        </div>
        <small>12 meses</small>
      </div>

      <div className="dash-bars">
        {data.map((item) => {
          const value = Number(item.total || 0);
          const height = value > 0 ? Math.max((value / max) * 100, 7) : 2;
          return (
            <div className="dash-bar-col" key={item.mes}>
              <div className="dash-bar-track">
                <span className="dash-bar-tooltip">{money(value)}</span>
                <div className={value > 0 ? "dash-bar-fill" : "dash-bar-fill dash-bar-fill--empty"} style={{ height: `${height}%` }} />
              </div>
              <span className="dash-bar-label">{formatMonth(item.mes, lang)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RecentActivity = ({ items, lang, now }) => {
  if (!items?.length) return <div className="dash-empty">{t(lang, "sin_actividad")}</div>;
  return (
    <div className="dash-activity-list">
      {items.map((item) => {
        const initial = (item.cliente_nombre || "?").trim().charAt(0).toUpperCase();
        return (
          <div className="dash-activity-item" key={item.id}>
            <div className="dash-avatar">{initial}</div>
            <div className="dash-activity-main">
              <strong>{item.cliente_nombre || t(lang, "cliente_sin_nombre")}</strong>
              <span>{item.codigo} / {relativeDate(item.fecha, lang, now)}</span>
            </div>
            <b>{money(item.monto)}</b>
          </div>
        );
      })}
    </div>
  );
};

const DashboardPage = () => {
  const { lang } = useLanguage();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [yearLoading, setYearLoading] = useState(false);
  const [yearMenuOpen, setYearMenuOpen] = useState(false);
  const [error, setError] = useState(null);
  const [now] = useState(() => new Date());
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [availableYears, setAvailableYears] = useState([String(now.getFullYear())]);

  const mergeYears = useCallback((years = [], selected) => {
    setAvailableYears((current) => {
      const merged = new Set([...current, ...years.filter(Boolean).map(String), String(now.getFullYear()), String(selected)]);
      return Array.from(merged).sort((a, b) => Number(b) - Number(a));
    });
  }, [now]);

  const loadData = async (year = selectedYear, options = {}) => {
    if (options.silent) setYearLoading(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/dashboard?year=${year}`);
      setData(res.data);
      setSelectedYear(String(res.data.ingresos_year || year));
      mergeYears(res.data.ingresos_years, res.data.ingresos_year || year);
    } catch (err) {
      console.error("Error cargando dashboard", err);
      setError(err.message || "Error");
      toast("Error al cargar los datos del dashboard.", "error");
    } finally {
      if (options.silent) setYearLoading(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    document.querySelector(".app-main")?.scrollTo({ top: 0, left: 0 });
    let active = true;
    api.get("/dashboard")
      .then((res) => {
        if (!active) return;
        setData(res.data);
        setSelectedYear(String(res.data.ingresos_year || now.getFullYear()));
        mergeYears(res.data.ingresos_years, res.data.ingresos_year || now.getFullYear());
      })
      .catch((err) => {
        console.error("Error cargando dashboard", err);
        if (active) {
          setError(err.message || "Error");
          toast("Error al cargar los datos del dashboard.", "error");
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [mergeYears, now, toast]);

  const handleYearChange = (year) => {
    setSelectedYear(year);
    setYearMenuOpen(false);
    loadData(year, { silent: true });
  };

  if (loading) return <div className="dash-page"><div className="dash-loading" /></div>;

  return (
    <div className="dash-page">
      <section className="dash-hero">
        <div>
          <span className="dash-date">{formatDate(now, lang)}</span>
          <h2>{getGreeting(now, lang)}</h2>
          <p>{t(lang, "dashboard_page_subtitle")}</p>
        </div>
        <div className="dash-main-metric">
          <span>{t(lang, "recibos_mes")}</span>
          <strong>{money(data?.recibos_mes?.total)}</strong>
          <small>{data?.recibos_mes?.cantidad ?? 0} {t(lang, "recibos")} / {data?.facturas_pendientes?.cantidad ?? 0} {t(lang, "pendiente")}</small>
        </div>
      </section>

      {error ? (
        <section className="dash-error">
          <Icon path={ICONS.alert} />
          <span>{lang === "es" ? "No se pudo cargar el dashboard" : "Dashboard could not load"}</span>
          <button className="btn-primary" onClick={() => loadData()}><Icon path={ICONS.refresh} size={14} /> {lang === "es" ? "Reintentar" : "Retry"}</button>
        </section>
      ) : null}

      <section className="dash-kpi-grid">
        <KpiCard tone="success" icon={ICONS.recibos} label={t(lang, "recibos_mes")} value={money(data?.recibos_mes?.total)} detail={`${data?.recibos_mes?.cantidad ?? 0} ${t(lang, "recibos")}`} />
        <KpiCard tone="primary" icon={ICONS.clientes} label={t(lang, "clientes_activos")} value={data?.clientes?.activos ?? "-"} detail={`${t(lang, "total")}: ${data?.clientes?.total ?? "-"}`} />
        <KpiCard tone="warning" icon={ICONS.facturas} label={t(lang, "facturas_pendientes")} value={money(data?.facturas_pendientes?.total)} detail={`${data?.facturas_pendientes?.cantidad ?? 0} ${t(lang, "facturas")}`} />
        <KpiCard tone="purple" icon={ICONS.estimados} label={t(lang, "total_estimados")} value={money(data?.estimados?.total)} detail={`${data?.estimados?.cantidad ?? 0} ${t(lang, "estimados")}`} />
      </section>

      <section className="dash-panels">
        <article className="dash-panel dash-panel--chart">
          <header className="dash-panel-header">
            <div>
              <h3><Icon path={ICONS.chart} size={15} /> {t(lang, "ingresos_mensuales")}</h3>
              <p>{lang === "es" ? "Tendencia de pagos registrados" : "Registered payment trend"}</p>
            </div>
            <YearFilter years={availableYears} selectedYear={selectedYear} open={yearMenuOpen} setOpen={setYearMenuOpen} loading={yearLoading} lang={lang} onChange={handleYearChange} />
          </header>
          <RevenueChart data={data?.ingresos_mensuales} lang={lang} />
        </article>

        <article className="dash-panel">
          <header className="dash-panel-header">
            <div>
              <h3><Icon path={ICONS.activity} size={15} /> {t(lang, "actividad_reciente")}</h3>
              <p>{lang === "es" ? "Ultimos recibos creados" : "Latest created receipts"}</p>
            </div>
            <span className="dash-count">{data?.actividad_reciente?.length ?? 0}</span>
          </header>
          <RecentActivity items={data?.actividad_reciente} lang={lang} now={now} />
        </article>
      </section>
    </div>
  );
};

export default DashboardPage;
