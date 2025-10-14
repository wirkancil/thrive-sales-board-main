import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ActivityTrackerOptions {
  enabled?: boolean;
}

export const useActivityTracker = ({ enabled = true }: ActivityTrackerOptions = {}) => {
  useEffect(() => {
    if (!enabled) return;

    // Track stage changes and automatically log activities
    const handleStageChange = async (event: CustomEvent) => {
      const { opportunityId, fromStage, toStage, userId } = event.detail;
      
      try {
        await supabase.from('activities').insert({
          opportunity_id: opportunityId,
          subject: `Stage changed from ${fromStage} to ${toStage}`,
          description: `Opportunity stage automatically updated`,
          status: 'completed',
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error logging stage change activity:', error);
      }
    };

    // Track opportunity creation
    const handleOpportunityCreated = async (event: CustomEvent) => {
      const { opportunityId, opportunityName, userId } = event.detail;
      
      try {
        await supabase.from('activities').insert({
          opportunity_id: opportunityId,
          subject: 'Opportunity created',
          description: `New opportunity "${opportunityName}" created in pipeline`,
          status: 'completed',
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error logging opportunity creation activity:', error);
      }
    };

    // Listen for custom events
    window.addEventListener('stageChanged', handleStageChange as EventListener);
    window.addEventListener('opportunityCreated', handleOpportunityCreated as EventListener);

    return () => {
      window.removeEventListener('stageChanged', handleStageChange as EventListener);
      window.removeEventListener('opportunityCreated', handleOpportunityCreated as EventListener);
    };
  }, [enabled]);

  // Helper function to dispatch events
  const trackStageChange = (opportunityId: string, fromStage: string, toStage: string, userId: string) => {
    const event = new CustomEvent('stageChanged', {
      detail: { opportunityId, fromStage, toStage, userId }
    });
    window.dispatchEvent(event);
  };

  const trackOpportunityCreated = (opportunityId: string, opportunityName: string, userId: string) => {
    const event = new CustomEvent('opportunityCreated', {
      detail: { opportunityId, opportunityName, userId }
    });
    window.dispatchEvent(event);
  };

  return {
    trackStageChange,
    trackOpportunityCreated
  };
};