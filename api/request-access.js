/**
 * Request Access Form Handler
 * 
 * Receives form submission, stores in Airtable, sends notification.
 * 
 * Environment variables required:
 * - AIRTABLE_API_KEY: Airtable personal access token
 * - AIRTABLE_BASE_ID: Base ID (starts with 'app')
 * - AIRTABLE_TABLE_NAME: Table name (default: 'Requests')
 * - NOTIFICATION_EMAIL: Email for notifications
 * - POSTMARK_API_KEY: (optional) For email notifications
 * - POSTHOG_API_KEY: (optional) For server-side events
 */

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;

    // Validate required fields
    if (!data.company || !data.email || !data.engineers || !data.action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Store in Airtable
    if (process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID) {
      await storeInAirtable(data);
    }

    // Send notification email
    if (process.env.POSTMARK_API_KEY && process.env.NOTIFICATION_EMAIL) {
      await sendNotification(data);
    }

    // Track in PostHog (server-side)
    if (process.env.POSTHOG_API_KEY) {
      await trackPostHog(data);
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Request access error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function storeInAirtable(data) {
  const tableName = process.env.AIRTABLE_TABLE_NAME || 'Requests';
  const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fields: {
        'Company': data.company,
        'GitHub Org': data.github_org || '',
        'Engineers': data.engineers,
        'AI Deploy': data.ai_deploy === 'yes' ? true : false,
        'Action': data.action,
        'Email': data.email,
        'Source': data.source || 'direct',
        'Submitted At': data.submitted_at,
        'Status': 'New'
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Airtable error:', error);
    throw new Error('Failed to store in Airtable');
  }

  return response.json();
}

async function sendNotification(data) {
  const response = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': process.env.POSTMARK_API_KEY
    },
    body: JSON.stringify({
      From: process.env.NOTIFICATION_FROM || 'notifications@permissionprotocol.com',
      To: process.env.NOTIFICATION_EMAIL,
      Subject: `[PP] New Access Request: ${data.company}`,
      TextBody: `New access request from Permission Protocol website:

Company: ${data.company}
GitHub Org: ${data.github_org || 'Not provided'}
Engineers: ${data.engineers}
AI Deploy: ${data.ai_deploy}
Email: ${data.email}

Action they're protecting:
${data.action}

Source: ${data.source || 'direct'}
Submitted: ${data.submitted_at}

---
Review in Airtable or respond directly.`
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Postmark error:', error);
    // Don't throw - notification failure shouldn't block submission
  }
}

async function trackPostHog(data) {
  const response = await fetch('https://app.posthog.com/capture/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      api_key: process.env.POSTHOG_API_KEY,
      event: 'request_access_submitted',
      distinct_id: data.email,
      properties: {
        company: data.company,
        engineers: data.engineers,
        ai_deploy: data.ai_deploy,
        source: data.source,
        $current_url: 'https://permissionprotocol.com/request-access'
      }
    })
  });

  if (!response.ok) {
    console.error('PostHog error:', await response.text());
    // Don't throw - analytics failure shouldn't block submission
  }
}
