import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TestDomain.css';

const DomainSelection = () => {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Consider replacing with real API call
    const fetchDomains = () => {
      try {
        // Simulated API call
        setTimeout(() => {
          setDomains([
            { name: 'Ethical Hacking', id: 'ethical-hacking' },
            { name: 'Backend Development', id: 'backend' },
            { name: 'Node.js', id: 'nodejs' },
            { name: 'React', id: 'react' },
            { name: 'Python', id: 'python' },
            { name: 'Data Science', id: 'data-science' },
            { name: 'Machine Learning', id: 'machine-learning' },
            { name: 'Cybersecurity', id: 'cybersecurity' },
            { name: 'Frontend Development', id: 'frontend' },
            { name: 'JavaScript', id: 'javascript' },
            { name: 'Web Development', id: 'web-dev' },
            { name: 'UI/UX Design', id: 'ui-ux' },
            { name: 'Android Development', id: 'android' },
            { name: 'iOS Development', id: 'ios' },
            { name: 'Cloud Computing', id: 'cloud' },
            { name: 'DevOps', id: 'devops' },
            { name: 'Artificial Intelligence', id: 'ai' },
            { name: 'Blockchain', id: 'blockchain' },
            { name: 'Internet of Things (IoT)', id: 'iot' },
            { name: 'Game Development', id: 'game-dev' },
            { name: 'Software Testing', id: 'software-testing' },
            { name: 'Database Management', id: 'database' },
            { name: 'Networking', id: 'networking' },
            { name: 'Linux', id: 'linux' },
            { name: 'Windows', id: 'windows' },
            { name: 'MacOS', id: 'macos' },
            { name: 'Mobile Development', id: 'mobile-dev' },
            { name: 'Web Design', id: 'web-design' },
            { name: 'SEO', id: 'seo' },
            { name: 'Digital Marketing', id: 'digital-marketing' },
            { name: 'Content Writing', id: 'content-writing' },
            { name: 'Graphic Design', id: 'graphic-design' },
            { name: 'Video Editing', id: 'video-editing' },
            { name: 'Photography', id: 'photography' },
            { name: 'Animation', id: 'animation' },
            { name: 'Music Production', id: 'music-production' },
            { name: 'Film Making', id: 'film-making' },
            { name: 'Business', id: 'business' },
            { name: 'Finance', id: 'finance' },
            { name: 'Accounting', id: 'accounting' },
            { name: 'Sales', id: 'sales' },
            { name: 'Marketing', id: 'marketing' },
            { name: 'Human Resources (HR)', id: 'hr' },
            { name: 'Project Management', id: 'project-management' },
            { name: 'Product Management', id: 'product-management' },
            { name: 'Customer Service', id: 'customer-service' },
            
            // ... keep other domains
          ]);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Failed to load domains');
        setLoading(false);
      }
    };

    fetchDomains();
  }, []);

  const handleStartTest = (domainId, domainName) => {
    navigate(`/test/${domainId}`, { 
      state: { 
        domainName,
        // Add additional metadata if needed
      }
    });
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        Loading domains...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="domain-selection-container">
      <h1>Choose a Domain to Test Your Skills</h1>
      <div className="domain-grid">
        {domains.map((domain) => (
          <div
            key={domain.id}
            className="domain-card"
            role="button"
            tabIndex={0}
            onClick={() => handleStartTest(domain.id, domain.name)}
            onKeyPress={(e) => e.key === 'Enter' && handleStartTest(domain.id, domain.name)}
            aria-label={`Start ${domain.name} test`}
          >
            <h3>{domain.name}</h3>
            <button 
              className="start-test-button"
              aria-label={`Start ${domain.name} test`}
            >
              Start Test
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DomainSelection;