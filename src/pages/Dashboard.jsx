import React, { useEffect, useState } from 'react';
import { usePlatformStats } from '../hooks/usePlatformStats';
import { useKnowledgeLibrary } from '../hooks/useKnowledgeLibrary';
import { useImprovementPlans } from '../hooks/useImprovementPlans';
import StatsBar from '../components/StatsBar';
import KnowledgeCard from '../components/KnowledgeCard';
import TaskFeed from '../components/TaskFeed';
import ImprovementPlan from '../components/ImprovementPlan';
import { fetchTaskExecutions } from '../api/taskExecutions';

const Dashboard = () => {
  const { stats, loading: statsLoading, error: statsError } = usePlatformStats();
  const { knowledge, loading: knowledgeLoading, error: knowledgeError } = useKnowledgeLibrary();
  const { plans, loading: plansLoading, error: plansError } = useImprovementPlans();
  
  const [taskExecutions, setTaskExecutions] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState(null);

  useEffect(() => {
    const loadTaskExecutions = async () => {
      try {
        setTasksLoading(true);
        setTasksError(null);
        const data = await fetchTaskExecutions();
        setTaskExecutions(data);
      } catch (err) {
        setTasksError(err.message || 'Failed to fetch task executions');
      } finally {
        setTasksLoading(false);
      }
    };

    loadTaskExecutions();
  }, []);

  const isLoading = statsLoading || knowledgeLoading || plansLoading || tasksLoading;
  const hasError = statsError || knowledgeError || plansError || tasksError;

  if (isLoading) {
    return (
      <div className="dashboard dashboard--loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="dashboard dashboard--error">
        <div className="error-container">
          <h2>Error Loading Dashboard</h2>
          {statsError && <p className="error-message">Stats: {statsError}</p>}
          {knowledgeError && <p className="error-message">Knowledge: {knowledgeError}</p>}
          {plansError && <p className="error-message">Plans: {plansError}</p>}
          {tasksError && <p className="error-message">Tasks: {tasksError}</p>}
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <h1 className="dashboard__title">AI Self-Teach Dashboard</h1>
        <p className="dashboard__subtitle">Monitor and manage your AI learning platform</p>
      </header>

      <section className="dashboard__stats">
        <StatsBar stats={stats} />
      </section>

      <main className="dashboard__grid">
        <aside className="dashboard__column dashboard__column--left">
          <KnowledgeCard knowledge={knowledge} />
        </aside>

        <section className="dashboard__column dashboard__column--center">
          <TaskFeed taskExecutions={taskExecutions} />
        </section>

        <aside className="dashboard__column dashboard__column--right">
          <ImprovementPlan plans={plans} />
        </aside>
      </main>
    </div>
  );
};

export default Dashboard;