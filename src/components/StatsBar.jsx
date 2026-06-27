import React from 'react';

const StatTile = ({ icon, label, value, color }) => {
  return (
    <div className="stat-tile" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px 24px',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      flex: 1,
      minWidth: '200px'
    }}>
      <div className="stat-icon" style={{
        width: '48px',
        height: '48px',
        borderRadius: '10px',
        backgroundColor: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px'
      }}>
        {icon}
      </div>
      <div className="stat-content">
        <div className="stat-value" style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#1a1a2e',
          lineHeight: '1.2'
        }}>
          {value}
        </div>
        <div className="stat-label" style={{
          fontSize: '14px',
          color: '#6b7280',
          marginTop: '2px'
        }}>
          {label}
        </div>
      </div>
    </div>
  );
};

const StatsBar = ({ totalTasks, successRate, librarySize, activePlans }) => {
  const stats = [
    {
      icon: '📋',
      label: 'Total Tasks',
      value: totalTasks?.toLocaleString() || '0',
      color: '#3b82f6'
    },
    {
      icon: '✅',
      label: 'Success Rate',
      value: `${successRate || 0}%`,
      color: '#10b981'
    },
    {
      icon: '📚',
      label: 'Library Size',
      value: librarySize?.toLocaleString() || '0',
      color: '#8b5cf6'
    },
    {
      icon: '🎯',
      label: 'Active Plans',
      value: activePlans?.toLocaleString() || '0',
      color: '#f59e0b'
    }
  ];

  return (
    <div className="stats-bar" style={{
      display: 'flex',
      gap: '16px',
      padding: '20px',
      backgroundColor: '#f8fafc',
      borderRadius: '16px',
      flexWrap: 'wrap'
    }}>
      {stats.map((stat, index) => (
        <StatTile
          key={index}
          icon={stat.icon}
          label={stat.label}
          value={stat.value}
          color={stat.color}
        />
      ))}
    </div>
  );
};

export default StatsBar;