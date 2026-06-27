import React from 'react';
import PropTypes from 'prop-types';
import './KnowledgeCard.css';

const KnowledgeCard = ({ entry }) => {
  const { problem_family, solution, occurrence_count, confidence } = entry;
  
  const truncatedSolution = solution && solution.length > 120 
    ? `${solution.substring(0, 120)}...` 
    : solution || 'No solution available';
  
  const confidencePercentage = Math.min(Math.max((confidence || 0) * 100, 0), 100);
  
  const getConfidenceColor = (percent) => {
    if (percent >= 80) return '#22c55e';
    if (percent >= 60) return '#84cc16';
    if (percent >= 40) return '#eab308';
    if (percent >= 20) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="knowledge-card">
      <div className="knowledge-card-header">
        <h3 className="problem-family">{problem_family || 'Unknown Family'}</h3>
        <span className="occurrence-badge">
          {occurrence_count || 0}
        </span>
      </div>
      
      <div className="knowledge-card-body">
        <p className="solution-preview">{truncatedSolution}</p>
      </div>
      
      <div className="knowledge-card-footer">
        <div className="confidence-container">
          <span className="confidence-label">Confidence</span>
          <div className="confidence-bar-wrapper">
            <div 
              className="confidence-bar"
              style={{ 
                width: `${confidencePercentage}%`,
                backgroundColor: getConfidenceColor(confidencePercentage)
              }}
            />
          </div>
          <span className="confidence-value">{confidencePercentage.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
};

KnowledgeCard.propTypes = {
  entry: PropTypes.shape({
    problem_family: PropTypes.string,
    solution: PropTypes.string,
    occurrence_count: PropTypes.number,
    confidence: PropTypes.number
  }).isRequired
};

const KnowledgeLibraryList = ({ entries }) => {
  if (!entries || entries.length === 0) {
    return (
      <div className="knowledge-library-empty">
        <p>No knowledge entries available.</p>
      </div>
    );
  }

  return (
    <div className="knowledge-library-list">
      {entries.map((entry, index) => (
        <KnowledgeCard 
          key={entry.id || `knowledge-${index}`} 
          entry={entry} 
        />
      ))}
    </div>
  );
};

KnowledgeLibraryList.propTypes = {
  entries: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      problem_family: PropTypes.string,
      solution: PropTypes.string,
      occurrence_count: PropTypes.number,
      confidence: PropTypes.number
    })
  )
};

KnowledgeLibraryList.defaultProps = {
  entries: []
};

export { KnowledgeCard };
export default KnowledgeLibraryList;