import { useEffect, useState } from 'react';
import { Screen, DeletionRequestSummary, ProductionRequestSummary } from '../types';
import { errorMessage } from '../api/client';
import * as requestsApi from '../api/requestsApi';

type Review = 'approve' | 'deny';

// Coordinators: Deletion Requests and Production Requests (from the hamburger menu).
// Approving or denying removes the request from its list.
export function useRequests(screen: Screen) {
  // ----- Account deletion requests -----
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequestSummary[]>([]);
  const [deletionRequestsLoading, setDeletionRequestsLoading] = useState(false);
  const [deletionRequestsMessage, setDeletionRequestsMessage] = useState('');

  // ----- Extras asking to join my production -----
  const [productionRequests, setProductionRequests] = useState<ProductionRequestSummary[]>([]);
  const [productionRequestsLoading, setProductionRequestsLoading] = useState(false);
  const [productionRequestsMessage, setProductionRequestsMessage] = useState('');

  const loadDeletionRequests = async () => {
    setDeletionRequestsLoading(true);
    setDeletionRequestsMessage('');
    try {
      setDeletionRequests(await requestsApi.getDeletionRequests());
    } catch (error) {
      setDeletionRequestsMessage(`Could not load deletion requests: ${errorMessage(error)}`);
    } finally {
      setDeletionRequestsLoading(false);
    }
  };

  const loadProductionRequests = async () => {
    setProductionRequestsLoading(true);
    setProductionRequestsMessage('');
    try {
      setProductionRequests(await requestsApi.getProductionRequests());
    } catch (error) {
      setProductionRequestsMessage(`Could not load requests: ${errorMessage(error)}`);
    } finally {
      setProductionRequestsLoading(false);
    }
  };

  // Load each list when its screen opens
  useEffect(() => {
    if (screen === 'deletionRequests') loadDeletionRequests();
    if (screen === 'productionRequests') loadProductionRequests();
  }, [screen]);

  const reviewDeletionRequest = async (userId: string, action: Review) => {
    try {
      await requestsApi.reviewDeletionRequest(userId, action);
      setDeletionRequests((prev) => prev.filter((r) => r.id !== userId));
    } catch (error) {
      setDeletionRequestsMessage(`Could not ${action}: ${errorMessage(error)}`);
    }
  };

  const reviewProductionRequest = async (requestId: string, action: Review) => {
    setProductionRequestsMessage('');
    try {
      await requestsApi.reviewProductionRequest(requestId, action);
      setProductionRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (error) {
      setProductionRequestsMessage(`Could not ${action}: ${errorMessage(error)}`);
    }
  };

  return {
    deletionRequests,
    deletionRequestsLoading,
    deletionRequestsMessage,
    reviewDeletionRequest,
    productionRequests,
    productionRequestsLoading,
    productionRequestsMessage,
    reviewProductionRequest,
  };
}