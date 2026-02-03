-- Create agent_configs table to store channel configurations
CREATE TABLE public.agent_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'voice')),
  is_enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, channel)
);

-- Create agent_rules table for trigger-action rules
CREATE TABLE public.agent_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB DEFAULT '{}',
  action_type TEXT NOT NULL,
  action_config JSONB DEFAULT '{}',
  approval_required BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agent_conversations table for tracking interactions
CREATE TABLE public.agent_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  channel TEXT NOT NULL,
  external_id TEXT,
  contact_name TEXT,
  contact_identifier TEXT,
  status TEXT DEFAULT 'active',
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agent_messages table for message history
CREATE TABLE public.agent_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.agent_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT NOT NULL,
  channel TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  approval_status TEXT DEFAULT 'auto_approved',
  ai_generated BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agent_pending_actions for approval queue
CREATE TABLE public.agent_pending_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rule_id UUID REFERENCES public.agent_rules(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.agent_conversations(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_data JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'executed')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_pending_actions ENABLE ROW LEVEL SECURITY;

-- RLS policies for agent_configs
CREATE POLICY "Users can view their own configs" ON public.agent_configs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own configs" ON public.agent_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own configs" ON public.agent_configs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own configs" ON public.agent_configs
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for agent_rules
CREATE POLICY "Users can view their own rules" ON public.agent_rules
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own rules" ON public.agent_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own rules" ON public.agent_rules
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own rules" ON public.agent_rules
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for agent_conversations
CREATE POLICY "Users can view their own conversations" ON public.agent_conversations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own conversations" ON public.agent_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own conversations" ON public.agent_conversations
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for agent_messages
CREATE POLICY "Users can view their own messages" ON public.agent_messages
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own messages" ON public.agent_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own messages" ON public.agent_messages
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for agent_pending_actions
CREATE POLICY "Users can view their own pending actions" ON public.agent_pending_actions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own pending actions" ON public.agent_pending_actions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pending actions" ON public.agent_pending_actions
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_agent_configs_updated_at
  BEFORE UPDATE ON public.agent_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_rules_updated_at
  BEFORE UPDATE ON public.agent_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();