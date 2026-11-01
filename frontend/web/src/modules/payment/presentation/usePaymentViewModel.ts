import { useState, useCallback, useMemo } from 'react';
import type { PaymentOrder } from '../domain/PaymentOrder';
import { HttpPaymentRepository } from '../infrastructure/HttpPaymentRepository';
import { defaultHttpClient } from '../../../core/http/HttpClient';
import { CheckoutOrderUseCase } from '../application/CheckoutOrderUseCase';
import { GetOrderByIdUseCase } from '../application/GetOrderByIdUseCase';
import { GetMyOrdersUseCase } from '../application/GetMyOrdersUseCase';

export const usePaymentViewModel = (onSagaSuccess?: () => void) => {
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<PaymentOrder | null>(null);
  const [sagaStep, setSagaStep] = useState<number>(0); // 0: Idle, 1: Initiated, 2: RabbitMQ Processing, 3: Completed, 4: Failed
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

  const checkout = async (amount: number, description?: string) => {
    try {
      setLoading(true);
      setError(null);
      setSagaStep(1); // Order created in Payment.API

      const order = await checkoutOrderUseCase.execute(amount, description);
      setActiveOrder(order);
      setSagaStep(2); // RabbitMQ choreography in progress

      // Poll order status to track Saga completion
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        try {
          const updated = await getOrderByIdUseCase.execute(order.id);
          setActiveOrder(updated);

          if (updated.status === 'Completed') {
            setSagaStep(3); // Completed!
            clearInterval(interval);
            setLoading(false);
            onSagaSuccess?.();
            fetchOrders();
          } else if (updated.status === 'Failed') {
            setSagaStep(4); // Failed (Insufficient balance, etc.)
            setError(updated.failureReason || 'Payment failed during wallet debit.');
            clearInterval(interval);
            setLoading(false);
            onSagaSuccess?.();
            fetchOrders();
          }

          if (attempts > 25) {
            clearInterval(interval);
            setLoading(false);
            if (updated.status === 'Pending') {
              setError('Saga transaction took longer than expected. Please check order history.');
            }
          }
        } catch {
          clearInterval(interval);
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
