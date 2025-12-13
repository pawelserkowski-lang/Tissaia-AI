import { useEffect } from 'react';

export interface AnalyticsEvent {
  type: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
}

export interface SessionData {
  sessionId: string;
  startTime: number;
  endTime?: number;
  events: AnalyticsEvent[];
  pageViews: string[];
}

/**
 * Generate a unique session ID
 */
const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get or create current session
 */
const getCurrentSession = (): SessionData => {
  try {
    const stored = sessionStorage.getItem('tissaia-session');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore errors
  }

  return {
    sessionId: generateSessionId(),
    startTime: Date.now(),
    events: [],
    pageViews: [],
  };
};

/**
 * Save session data
 */
const saveSession = (session: SessionData): void => {
  try {
    sessionStorage.setItem('tissaia-session', JSON.stringify(session));
  } catch {
    // Ignore storage errors
  }
};

/**
 * Track an analytics event (local only, privacy-respecting)
 */
export const trackEvent = (
  type: string,
  action: string,
  label?: string,
  value?: number
): void => {
  const session = getCurrentSession();

  const event: AnalyticsEvent = {
    type,
    action,
    label,
    value,
    timestamp: Date.now(),
  };

  session.events.push(event);
  saveSession(session);

  console.log('[Analytics]', event);
};

/**
 * Track a page view
 */
export const trackPageView = (page: string): void => {
  const session = getCurrentSession();
  session.pageViews.push(page);
  saveSession(session);

  trackEvent('pageview', 'view', page);
};

/**
 * Custom hook for analytics tracking
 */
export const useAnalytics = (enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    // Initialize or resume session
    const session = getCurrentSession();
    saveSession(session);

    // Track session end on page unload
    const handleUnload = () => {
      const currentSession = getCurrentSession();
      currentSession.endTime = Date.now();
      saveSession(currentSession);

      // Store completed session in localStorage
      try {
        const sessions = JSON.parse(localStorage.getItem('tissaia-sessions') || '[]');
        sessions.push(currentSession);
        // Keep only last 50 sessions
        if (sessions.length > 50) sessions.shift();
        localStorage.setItem('tissaia-sessions', JSON.stringify(sessions));
      } catch {
        // Ignore errors
      }
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [enabled]);
};

/**
 * Get analytics summary
 */
export const getAnalyticsSummary = (): {
  totalSessions: number;
  totalEvents: number;
  averageSessionDuration: number;
  topEvents: Array<{ type: string; action: string; count: number }>;
  topPages: Array<{ page: string; views: number }>;
} => {
  try {
    const sessions: SessionData[] = JSON.parse(
      localStorage.getItem('tissaia-sessions') || '[]'
    );

    const totalSessions = sessions.length;
    const totalEvents = sessions.reduce((sum, s) => sum + s.events.length, 0);

    // Calculate average session duration
    const durations = sessions
      .filter((s) => s.endTime)
      .map((s) => (s.endTime! - s.startTime) / 1000);
    const averageSessionDuration =
      durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : 0;

    // Count events
    const eventCounts: Record<string, number> = {};
    sessions.forEach((session) => {
      session.events.forEach((event) => {
        const key = `${event.type}:${event.action}`;
        eventCounts[key] = (eventCounts[key] || 0) + 1;
      });
    });

    const topEvents = Object.entries(eventCounts)
      .map(([key, count]) => {
        const [type, action] = key.split(':');
        return { type, action, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Count page views
    const pageCounts: Record<string, number> = {};
    sessions.forEach((session) => {
      session.pageViews.forEach((page) => {
        pageCounts[page] = (pageCounts[page] || 0) + 1;
      });
    });

    const topPages = Object.entries(pageCounts)
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    return {
      totalSessions,
      totalEvents,
      averageSessionDuration,
      topEvents,
      topPages,
    };
  } catch {
    return {
      totalSessions: 0,
      totalEvents: 0,
      averageSessionDuration: 0,
      topEvents: [],
      topPages: [],
    };
  }
};

/**
 * Clear all analytics data
 */
export const clearAnalyticsData = (): void => {
  try {
    localStorage.removeItem('tissaia-sessions');
    sessionStorage.removeItem('tissaia-session');
  } catch {
    // Ignore errors
  }
};
