import { Injectable } from '@nestjs/common';
import {
  MetricCounter,
  PrometheusService,
} from '../../prometheus/prometheus.service';

type BalanceSourceLabel = 'cache_hit' | 'cache_miss';
type DebitReasonLabel =
  | 'none'
  | 'not_found'
  | 'insufficient_balance'
  | 'unknown';

@Injectable()
export class UsersMetricsService {
  private readonly balanceReadCounter: MetricCounter<'source'>;
  private readonly debitCounter: MetricCounter<'status' | 'reason'>;

  constructor(private readonly prometheusService: PrometheusService) {
    this.balanceReadCounter = this.prometheusService.createCounter(
      'user_balance_reads_total',
      'Total number of balance reads grouped by cache hit or miss',
      ['source'],
    );
    this.debitCounter = this.prometheusService.createCounter(
      'user_debit_requests_total',
      'Total number of debit requests grouped by status',
      ['status', 'reason'],
    );
  }

  recordBalanceRead(source: BalanceSourceLabel): void {
    this.balanceReadCounter.labels(source).inc();
  }

  recordDebitSuccess(): void {
    this.debitCounter.labels('success', 'none').inc();
  }

  recordDebitFailure(reason: Exclude<DebitReasonLabel, 'none'> | 'none'): void {
    this.debitCounter.labels('failure', reason).inc();
  }
}
