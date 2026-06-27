import React, { useState } from 'react';
import PropTypes from 'prop-types';

const ImprovementPlanCard = ({ plan, onMarkDone, isExpanded, onToggle }) => {
  const statusColors = {
    active: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-200'
    },
    done: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200'
    }
  };

  const status = plan.status || 'active';
  const colors = statusColors[status] || statusColors.active;

  return (
    <div className="border rounded-lg shadow-sm mb-4 overflow-hidden bg-white">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
        role="button"
        aria-expanded={isExpanded}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <div className="flex items-center gap-3 flex-1">
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-800">{plan.focus_area}</h3>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text} ${colors.border} border`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t bg-gray-50">
          <div className="pt-4">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {plan.plan_text}
            </p>
          </div>
          {status !== 'done' && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkDone(plan.id);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-medium"
              >
                Mark Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

ImprovementPlanCard.propTypes = {
  plan: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    focus_area: PropTypes.string.isRequired,
    plan_text: PropTypes.string.isRequired,
    status: PropTypes.oneOf(['active', 'done'])
  }).isRequired,
  onMarkDone: PropTypes.func.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired
};

const ImprovementPlan = ({ improvement_plans, onMarkDone }) => {
  const [expandedIds, setExpandedIds] = useState(new Set());

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (!improvement_plans || improvement_plans.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No improvement plans available.</p>
      </div>
    );
  }

  return (
    <div className="improvement-plans-container">
      {improvement_plans.map((plan) => (
        <ImprovementPlanCard
          key={plan.id}
          plan={plan}
          onMarkDone={onMarkDone}
          isExpanded={expandedIds.has(plan.id)}
          onToggle={() => toggleExpand(plan.id)}
        />
      ))}
    </div>
  );
};

ImprovementPlan.propTypes = {
  improvement_plans: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      focus_area: PropTypes.string.isRequired,
      plan_text: PropTypes.string.isRequired,
      status: PropTypes.oneOf(['active', 'done'])
    })
  ),
  onMarkDone: PropTypes.func.isRequired
};

ImprovementPlan.defaultProps = {
  improvement_plans: []
};

export default ImprovementPlan;
