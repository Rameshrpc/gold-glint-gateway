-- Add foreign key constraints to agent_commissions table
ALTER TABLE public.agent_commissions 
ADD CONSTRAINT agent_commissions_agent_id_fkey 
FOREIGN KEY (agent_id) REFERENCES public.agents(id);

ALTER TABLE public.agent_commissions 
ADD CONSTRAINT agent_commissions_loan_id_fkey 
FOREIGN KEY (loan_id) REFERENCES public.loans(id);

ALTER TABLE public.agent_commissions 
ADD CONSTRAINT agent_commissions_branch_id_fkey 
FOREIGN KEY (branch_id) REFERENCES public.branches(id);

ALTER TABLE public.agent_commissions 
ADD CONSTRAINT agent_commissions_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.clients(id);