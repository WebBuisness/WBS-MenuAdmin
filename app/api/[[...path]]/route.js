import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import webpush from 'web-push'

function cors(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 200 }))
}

async function handler(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    // Health / root
    if ((route === '/' || route === '/root') && method === 'GET') {
      return cors(NextResponse.json({ message: 'Doner House Admin API' }))
    }

    const supabase = createAdminClient()

    // POST /api/notifications/send  { title, body, target }
    if (route === '/notifications/send' && method === 'POST') {
      const body = await request.json()
      if (!body.title || !body.body) {
        return cors(NextResponse.json({ error: 'title and body are required' }, { status: 400 }))
      }

      // 1. Log to database
      const { data: notifData, error: notifError } = await supabase
        .from('notifications')
        .insert({
          title: body.title,
          body: body.body,
          target: body.target || 'all',
          recipient_count: 0,
        })
        .select()
        .single()
      if (notifError) return cors(NextResponse.json({ error: notifError.message }, { status: 500 }))

      // 2. Send real Web Push to all subscriptions
      const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      const vapidPrivate = process.env.VAPID_PRIVATE_KEY
      const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@donerhouse.com'

      let sent = 0
      if (vapidPublic && vapidPrivate) {
        webpush.setVapidDetails(vapidEmail, vapidPublic, vapidPrivate)

        const { data: subs } = await supabase.from('push_subscriptions').select('*')
        const payload = JSON.stringify({ title: body.title, body: body.body, url: '/' })

        const results = await Promise.allSettled(
          (subs || []).map((sub) =>
            webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload
            ).catch(async (err) => {
              // Remove invalid/expired subscriptions (410 = gone)
              if (err.statusCode === 410 || err.statusCode === 404) {
                await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
              }
              throw err
            })
          )
        )
        sent = results.filter((r) => r.status === 'fulfilled').length

        // Update recipient count
        await supabase.from('notifications').update({ recipient_count: sent }).eq('id', notifData.id)
      }

      return cors(NextResponse.json({ ok: true, notification: notifData, sent }))
    }

    // POST /api/orders/update-status { id, status }
    if (route === '/orders/update-status' && method === 'POST') {
      const { id, status } = await request.json()
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single()
      if (error) return cors(NextResponse.json({ error: error.message }, { status: 500 }))
      // NOTE: FCM push to customer would fire here.
      return cors(NextResponse.json({ ok: true, order: data }))
    }

    // POST /api/admin/create { email, password } \u2014 creates auto-confirmed admin
    if (route === '/admin/create' && method === 'POST') {
      const { email, password } = await request.json()
      if (!email || !password) return cors(NextResponse.json({ error: 'email & password required' }, { status: 400 }))
      // Check if any admin already exists \u2014 prevents anyone from creating new admins later
      const { data: list } = await supabase.auth.admin.listUsers()
      if (list?.users?.length > 0) {
        return cors(NextResponse.json({ error: 'An admin already exists. Contact existing admin.' }, { status: 403 }))
      }
      const { data, error } = await supabase.auth.admin.createUser({
        email, password, email_confirm: true,
      })
      if (error) return cors(NextResponse.json({ error: error.message }, { status: 500 }))
      return cors(NextResponse.json({ ok: true, user: { id: data.user.id, email: data.user.email } }))
    }

    // POST /api/password-change { user_id, new_password }
    if (route === '/password-change' && method === 'POST') {
      const { user_id, new_password } = await request.json()
      const { error } = await supabase.auth.admin.updateUserById(user_id, { password: new_password })
      if (error) return cors(NextResponse.json({ error: error.message }, { status: 500 }))
      return cors(NextResponse.json({ ok: true }))
    }

    // GET /api/health/schema — detect if tables exist
    if (route === '/health/schema' && method === 'GET') {
      const tables = ['items', 'categories', 'orders', 'promo_codes', 'settings', 'notifications']
      const missing = []
      for (const t of tables) {
        const { error } = await supabase.from(t).select('*', { count: 'exact', head: true })
        if (error) missing.push({ table: t, error: error.message })
      }
      return cors(NextResponse.json({ ok: missing.length === 0, missing }))
    }

    return cors(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }))
  } catch (err) {
    console.error('API error:', err)
    return cors(NextResponse.json({ error: err.message || 'Server error' }, { status: 500 }))
  }
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const DELETE = handler
export const PATCH = handler
