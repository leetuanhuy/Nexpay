import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { PaymentOrder } from '../domain/PaymentOrder';
import { HttpPaymentRepository } from '../infrastructure/HttpPaymentRepository';
import { defaultHttpClient } from '../../../core/http/HttpClient';
import { CheckoutOrderUseCase } from '../application/CheckoutOrderUseCase';
import { GetOrderByIdUseCase } from '../application/GetOrderByIdUseCase';
import { GetMyOrdersUseCase } from '../application/GetMyOrdersUseCase';
import { signalRNotificationService } from '../../../core/realtime/SignalRNotificationService';

export const usePaymentViewModel = (onSagaSuccess?: () => void) => {
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<PaymentOrder | null>(null);
  const [sagaStep, setSagaStep] = useState<number>(0); // 0: Idle, 1: Initiated, 2: RabbitMQ Processing, 3: Completed, 4: Failed
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const activeOrderIdRef = useRef<string | null>(null);
  activeOrderIdRef.current = activeOrder?.id || null;

  const pollingIntervalRef = useRef<any>(null);

  const { checkoutOrderUseCase, getOrderByIdUseCase, getMyOrdersUseCase } = useMemo(() => {
    const repo = new HttpPaymentRepository(defaultHttpClient);
    return {
      checkoutOrderUseCase: new CheckoutOrderUseCase(repo),
      getOrderByIdUseCase: new GetOrderByIdUseCase(repo),
      getMyOrdersUseCase: new GetMyOrdersUseCase(repo),
    };
  }, []);

  const fetchOrders = useCallback(async (limit: number = 50) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyOrdersUseCase.execute(limit);
      setOrders(data);
    } catch (err: any) {
      if (err.statusCode !== 401) {
        setError(err.message || 'Unable to fetch orders.');
      }
    } finally {
      setLoading(false);
    }
  }, [getMyOrdersUseCase]);

  // Real-Time SignalR Event Subscriptions for Instant Saga Resolution
  useEffect(() => {
    const unsubCompleted = signalRNotificationService.onOrderCompleted((data) => {
      if (activeOrderIdRef.current && activeOrderIdRef.current.toLowerCase() === data.orderId.toLowerCase()) {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        setActiveOrder((prev) => (prev ? { ...prev, status: 'Completed' } : null));
        setSagaStep(3); // Completed!
        setLoading(false);
        onSagaSuccess?.();
        fetchOrders();
      }
    });

    const unsubFailed = signalRNotificationService.onOrderFailed((data) => {
      if (activeOrderIdRef.current && activeOrderIdRef.current.toLowerCase() === data.orderId.toLowerCase()) {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        setActiveOrder((prev) => (prev ? { ...prev, status: 'Failed', failureReason: data.reason } : null));
        setSagaStep(4); // Failed!
        setError(data.reason || 'Payment failed during wallet debit.');
        setLoading(false);
        onSagaSuccess?.();
        fetchOrders();
      }
    });

    return () => {
      unsubCompleted();
      unsubFailed();
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [onSagaSuccess, fetchOrders]);

  const checkout = async (amount: number, description?: string) => {
    try {
      setLoading(true);
      setError(null);
      setSagaStep(1); // Order created in Payment.API

      const order = await checkoutOrderUseCase.execute(amount, description);
      setActiveOrder(order);
      setSagaStep(2); // RabbitMQ choreography in progress

      // Fallback Polling (in case WebSockets connection has jitter)
      let attempts = 0;
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

      pollingIntervalRef.current = setInterval(async () => {
        attempts++;
        try {
          const updated = await getOrderByIdUseCase.execute(order.id);
          setActiveOrder(updated);

          if (updated.status === 'Completed') {
            setSagaStep(3); // Completed!
            clearInterval(pollingIntervalRef.current);
            setLoading(false);
            onSagaSuccess?.();
            fetchOrders();
          } else if (updated.status === 'Failed') {
            setSagaStep(4); // Failed!
            setError(updated.failureReason || 'Payment failed during wallet debit.');
            clearInterval(pollingIntervalRef.current);
            setLoading(false);
            onSagaSuccess?.();
            fetchOrders();
          }

          if (attempts > 25) {
            clearInterval(pollingIntervalRef.current);
            setLoading(false);
            if (updated.status === 'Pending') {
              setError('Saga transaction took longer than expected. Please check order history.');
            }
          }
        } catch {
          clearInterval(pollingIntervalRef.current);
          setLoading(false);
        }
      }, 600);
    } catch (err: any) {
      setError(err.message || 'Payment checkout initiation failed.');
      setSagaStep(0);
      setLoading(false);
      throw err;
    }
  };

  const resetSaga = () => {
    setActiveOrder(null);
    setSagaStep(0);
    setError(null);
  };

  return {
    orders,
    activeOrder,
    sagaStep,
    loading,
    error,
    checkout,
    fetchOrders,
    resetSaga,
  };
};
