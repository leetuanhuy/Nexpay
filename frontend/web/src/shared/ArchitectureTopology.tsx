import React from 'react';
import {
  Server,
  Network,
  Activity,
  ExternalLink,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { Card } from './Card';
import { Badge } from './Badge';

interface ServiceNode {
  name: string;
  role: string;
  port: number;
  protocol: string;
  status: 'Online' | 'Active' | 'Healthy';
  tech: string;
  dashboardUrl?: string;
  description: string;
}

const SERVICES: ServiceNode[] = [
  {
    name: 'Nexpay.Gateway',
    role: 'Reverse Proxy & Rate Limiter',
    port: 5000,
    protocol: 'HTTP/2',
    status: 'Healthy',
    tech: 'Microsoft YARP (.NET 10)',
    description: 'Central entry point routing /api/v1/auth, /api/v1/wallets, /api/v1/payments, /hubs.',
  },
  {
    name: 'Identity.API',
    role: 'Authentication & JWT Issuance',
    port: 5248,
    protocol: 'REST / JSON',
    status: 'Healthy',
    tech: 'ASP.NET Core • BCrypt • EF Core',
    dashboardUrl: 'http://localhost:5248/swagger',
    description: 'Manages user identities, secure credentials, and publishes UserRegisteredEvent.',
  },
  {
    name: 'Wallet.API',
    role: 'Banking Stored Procedures & Double-Entry',
    port: 5249,
    protocol: 'REST / MassTransit',
    status: 'Healthy',
    tech: 'Dapper • SQL Server Stored Procedures',
    dashboardUrl: 'http://localhost:5249/swagger',
    description: 'Executes sp_DebitWallet and sp_CreditWallet with pessimistic row locks.',
  },
  {
    name: 'Payment.API',
    role: 'Saga Choreography Coordinator',
    port: 5251,
    protocol: 'REST / MassTransit',
    status: 'Healthy',
    tech: 'Clean Architecture • RabbitMQ Events',
    dashboardUrl: 'http://localhost:5251/swagger',
    description: 'Coordinates orders, listens to wallet debit outcomes, and handles compensations.',
  },
  {
    name: 'Notification.Service',
    role: 'Real-Time SignalR Hub & Event Dispatcher',
    port: 5250,
    protocol: 'WebSockets / SignalR',
    status: 'Healthy',
    tech: 'ASP.NET Core SignalR • MassTransit',
    description: 'Streams real-time push notifications, toast alerts, and live balance updates to the browser.',
  },
  {
    name: 'RabbitMQ Message Broker',
    role: 'Asynchronous Event Bus',
    port: 15672,
    protocol: 'AMQP 0-9-1',
    status: 'Active',
    tech: 'RabbitMQ 3.13 Management',
    dashboardUrl: 'http://localhost:15672',
    description: 'Fanout and topic exchanges decoupling microservices with durable queues.',
  },
  {
    name: 'Microsoft SQL Server 2022',
    role: 'ACID Transactional Database',
    port: 1433,
    protocol: 'T-SQL / TDS',
    status: 'Active',
    tech: 'SQL Server Developer Edition',
    description: 'Houses Wallets, Transactions, Users, and Orders tables with strict foreign keys.',
  },
  {
    name: 'Redis Cache',
    role: 'Distributed In-Memory Cache',
    port: 6379,
    protocol: 'RESP',
    status: 'Active',
    tech: 'Redis 7.2 Alpine',
    description: 'Idempotency keys and fast session token caching.',
  },
  {
    name: 'Seq Structured Logging',
    role: 'Centralized Log Aggregator',
    port: 5341,
    protocol: 'HTTP Serilog Ingestion',
    status: 'Online',
    tech: 'Seq 2024 Server',
    dashboardUrl: 'http://localhost:5341',
    description: 'Visualizes Serilog structured JSON events stamped with X-Correlation-ID.',
  },
];

export const ArchitectureTopology: React.FC = () => {
  return (
    <Card className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Network className="h-5 w-5" />
            </span>
            <span>Microservices Ecosystem & Container Mesh</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            10 production Docker containers running on your local machine.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="success" pulse>
            All 10 Containers Healthy
          </Badge>
        </div>
      </div>

      {/* Grid of Microservices */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SERVICES.map((srv) => (
          <div
            key={srv.name}
            className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/30 transition flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  :{srv.port}
                </span>
                <span className="text-[10px] font-medium text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {srv.protocol}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white mt-2.5 flex items-center space-x-1.5">
                <Server className="h-4 w-4 text-slate-400" />
                <span>{srv.name}</span>
              </h4>
              <p className="text-xs font-semibold text-slate-300 mt-0.5">{srv.role}</p>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                {srv.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono">{srv.tech}</span>
              {srv.dashboardUrl && (
                <a
                  href={srv.dashboardUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 cursor-pointer transition"
                >
                  <span>Open</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Architectural Guarantee Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              FinTech Architecture Specifications
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict correlation tracking (<code className="text-slate-300 font-mono">X-Correlation-ID</code>), Clean Architecture Domain Model, Stored Procedure Concurrency Isolation.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <a
            href="http://localhost:5341"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center space-x-1.5"
          >
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span>Open Seq Logs</span>
          </a>
          <a
            href="http://localhost:15672"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center space-x-1.5"
          >
            <Terminal className="h-3.5 w-3.5 text-amber-400" />
            <span>Open RabbitMQ</span>
          </a>
        </div>
      </div>
    </Card>
  );
};
