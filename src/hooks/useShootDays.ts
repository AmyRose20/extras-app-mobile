import { useEffect, useState } from 'react';
import { Screen, Role, ShootDaySummary, ShootDayDetail, CallRequestSummary } from '../types';
import { errorMessage } from '../api/client';
import * as shootDaysApi from '../api/shootDaysApi';
import * as callRequestsApi from '../api/callRequestsApi';

// Coordinators: the shoot days list (and the calendar on Home), one opened shoot day,
// and editing a call request's description / quantity on that shoot day.
export function useShootDays(screen: Screen, role: Role) {
  // ----- The list -----
  const [shootDays, setShootDays] = useState<ShootDaySummary[]>([]);
  const [shootDaysLoading, setShootDaysLoading] = useState(false);
  const [shootDaysMessage, setShootDaysMessage] = useState('');

  // ----- One shoot day -----
  const [selectedShootDay, setSelectedShootDay] = useState<ShootDayDetail | null>(null);
  const [shootDayDetailLoading, setShootDayDetailLoading] = useState(false);
  const [shootDayDetailMessage, setShootDayDetailMessage] = useState('');

  // ----- Editing a call request on that shoot day -----
  const [editingCallRequestId, setEditingCallRequestId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editQuantity, setEditQuantity] = useState('');

  const loadShootDays = async () => {
    setShootDaysLoading(true);
    setShootDaysMessage('');
    try {
      setShootDays(await shootDaysApi.getShootDays());
    } catch (error) {
      setShootDaysMessage(`Could not load shoot days: ${errorMessage(error)}`);
    } finally {
      setShootDaysLoading(false);
    }
  };

  // Load on the Shoot Days list, and on Home for coordinators (the calendar shows them)
  useEffect(() => {
    if (screen === 'shootDaysList' || (screen === 'home' && role === 'ADMIN')) {
      loadShootDays();
    }
  }, [screen, role]);

  const loadShootDayDetail = async (id: string) => {
    setShootDayDetailLoading(true);
    setShootDayDetailMessage('');
    setSelectedShootDay(null);
    setEditingCallRequestId(null);
    try {
      setSelectedShootDay(await shootDaysApi.getShootDay(id));
    } catch (error) {
      setShootDayDetailMessage(`Could not load shoot day: ${errorMessage(error)}`);
    } finally {
      setShootDayDetailLoading(false);
    }
  };

  const startEditCallRequest = (callRequest: CallRequestSummary) => {
    setEditingCallRequestId(callRequest.id);
    setEditDescription(callRequest.description);
    setEditQuantity(String(callRequest.quantityNeeded));
  };

  const cancelEditCallRequest = () => {
    setEditingCallRequestId(null);
    setEditDescription('');
    setEditQuantity('');
  };

  const saveCallRequest = async () => {
    if (!editingCallRequestId || !selectedShootDay) return;
    setShootDayDetailMessage('');
    try {
      await callRequestsApi.updateCallRequest(editingCallRequestId, {
        description: editDescription,
        quantityNeeded: parseInt(editQuantity, 10),
      });
      cancelEditCallRequest(); // close the edit box
      loadShootDayDetail(selectedShootDay.id);
    } catch (error) {
      setShootDayDetailMessage(`Could not update call request: ${errorMessage(error)}`);
    }
  };

  return {
    shootDays,
    shootDaysLoading,
    shootDaysMessage,
    selectedShootDay,
    shootDayDetailLoading,
    shootDayDetailMessage,
    loadShootDayDetail,
    editingCallRequestId,
    editDescription,
    setEditDescription,
    editQuantity,
    setEditQuantity,
    startEditCallRequest,
    cancelEditCallRequest,
    saveCallRequest,
  };
}