import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LoanReminder {
  loan_id: string;
  loan_number: string;
  customer_name: string;
  customer_phone: string;
  customer_id: string;
  principal_amount: number;
  interest_rate: number;
  next_due_date: string;
  days_until_due: number;
  overdue_days: number;
  branch_id: string;
  client_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all clients with notifications enabled
    const { data: clients, error: clientsError } = await supabase
      .from('client_notification_settings')
      .select('*, client:clients(id, company_name, phone, supports_notifications)')
      .or('sms_enabled.eq.true,whatsapp_enabled.eq.true')

    if (clientsError) throw clientsError

    let totalSent = 0
    let totalFailed = 0

    for (const config of clients || []) {
      if (!config.client?.supports_notifications) continue

      const clientId = config.client_id
      const companyName = config.client?.company_name || 'Our Company'
      const companyPhone = config.client?.phone || ''

      // Check daily limits
      const todaySent = config.sms_sent_today || 0
      const dailyLimit = config.daily_sms_limit || 100
      if (todaySent >= dailyLimit) {
        console.log(`Client ${clientId} reached daily limit`)
        continue
      }

      // Get active templates for this client
      const { data: templates } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .not('days_before_due', 'is', null)

      if (!templates || templates.length === 0) continue

      // Find loans needing reminders
      const today = new Date().toISOString().split('T')[0]
      
      const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select(`
          id, loan_number, principal_amount, interest_rate,
          next_interest_due_date, loan_date, branch_id, client_id,
          customer:customers(id, full_name, phone)
        `)
        .eq('client_id', clientId)
        .in('status', ['active', 'overdue'])

      if (loansError || !loans) continue

      for (const loan of loans) {
        if (!loan.customer?.phone) continue

        const dueDate = loan.next_interest_due_date || 
          new Date(new Date(loan.loan_date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        
        const dueDateObj = new Date(dueDate)
        const todayObj = new Date(today)
        const diffDays = Math.round((dueDateObj.getTime() - todayObj.getTime()) / (1000 * 60 * 60 * 24))

        // Find matching template
        let matchingTemplate = null
        
        if (diffDays < 0) {
          // Overdue - find overdue template
          matchingTemplate = templates.find(t => t.template_code === 'OVERDUE_NOTICE')
        } else {
          // Find template matching days before due
          matchingTemplate = templates.find(t => t.days_before_due === diffDays)
        }

        if (!matchingTemplate) continue

        // Check if we already sent this template for this loan today
        const { count: alreadySent } = await supabase
          .from('notification_logs')
          .select('*', { count: 'exact', head: true })
          .eq('entity_id', loan.id)
          .eq('template_code', matchingTemplate.template_code)
          .gte('created_at', today + 'T00:00:00')

        if (alreadySent && alreadySent > 0) continue

        // Calculate approximate interest due
        const principal = loan.principal_amount
        const rate = loan.interest_rate
        const daysElapsed = Math.abs(diffDays) + 30 // approximate
        const interestDue = Math.round(principal * (rate / 100) * daysElapsed / 365)

        // Build message variables
        const variables: Record<string, string> = {
          customer_name: loan.customer.full_name,
          loan_number: loan.loan_number,
          amount_due: interestDue.toLocaleString('en-IN'),
          total_due: (principal + interestDue).toLocaleString('en-IN'),
          due_date: new Date(dueDate).toLocaleDateString('en-IN'),
          overdue_days: Math.abs(diffDays).toString(),
          company_name: companyName,
          company_phone: companyPhone,
          amount: principal.toLocaleString('en-IN'),
          interest_rate: rate.toString(),
        }

        // Replace variables in template
        let messageContent = matchingTemplate.template_content_whatsapp || matchingTemplate.template_content
        for (const [key, value] of Object.entries(variables)) {
          messageContent = messageContent.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
        }

        // Send via MSG91 WhatsApp API if enabled
        let sendStatus = 'pending'
        let providerMessageId = null
        let errorMessage = null

        if (config.whatsapp_enabled && config.msg91_auth_key) {
          try {
            const msg91Response = await fetch('https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/', {
              method: 'POST',
              headers: {
                'authkey': config.msg91_auth_key,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                integrated_number: config.msg91_sender_id,
                content_type: 'text',
                payload: {
                  messaging_product: 'whatsapp',
                  type: 'text',
                  to: loan.customer.phone.startsWith('91') ? loan.customer.phone : `91${loan.customer.phone}`,
                  text: { body: messageContent },
                },
              }),
            })

            if (msg91Response.ok) {
              const result = await msg91Response.json()
              sendStatus = 'sent'
              providerMessageId = result?.request_id || result?.message_id || null
              totalSent++
            } else {
              const errText = await msg91Response.text()
              sendStatus = 'failed'
              errorMessage = errText
              totalFailed++
            }
          } catch (sendError: any) {
            sendStatus = 'failed'
            errorMessage = sendError.message
            totalFailed++
          }
        } else {
          // No API configured, just log as queued
          sendStatus = 'queued'
        }

        // Log the notification
        await supabase.from('notification_logs').insert({
          client_id: clientId,
          branch_id: loan.branch_id,
          channel: config.whatsapp_enabled ? 'whatsapp' : 'sms',
          recipient_type: 'customer',
          recipient_id: loan.customer.id,
          recipient_name: loan.customer.full_name,
          recipient_phone: loan.customer.phone,
          message_content: messageContent,
          entity_type: 'loan',
          entity_id: loan.id,
          template_code: matchingTemplate.template_code,
          status: sendStatus,
          delivery_status: sendStatus,
          provider_message_id: providerMessageId,
          error_message: errorMessage,
          sent_at: sendStatus === 'sent' ? new Date().toISOString() : null,
        })
      }

      // Update daily counter
      await supabase
        .from('client_notification_settings')
        .update({ 
          sms_sent_today: (config.sms_sent_today || 0) + totalSent,
          sms_sent_this_month: (config.sms_sent_this_month || 0) + totalSent,
        })
        .eq('id', config.id)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        total_sent: totalSent, 
        total_failed: totalFailed,
        processed_at: new Date().toISOString() 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Send reminders error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
