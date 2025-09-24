import { useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { trackPageView } from '../../analytics';

const AnalyticsTracker = () => {
  const { path } = useRouter();

  useEffect(() => {
    // Track page view whenever the path changes
    trackPageView(path);
  }, [path]);

  // This component does not render anything
  return null;
};

export default AnalyticsTracker;