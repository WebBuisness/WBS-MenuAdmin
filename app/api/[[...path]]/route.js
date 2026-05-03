import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { z } from 'zod'

function cors(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

function json(status, body) {
  return cors(NextResponse.json(body, { status }))
}

async function safeJson(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 200 }))
}

const orderUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.string().min(1).max(32),
})

const adminCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(72),
})

const passwordChangeSchema = z.object({
  user_id: z.string().min(1),
  new_password: z.string().min(6).max(72),
})

async function handler(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    // Health / root
    if ((route === '/' || route === '/root') && method === 'GET') {
      return json(200, { message: 'WBS Menu Demo Admin API' })
    }

    const supabase = createAdminClient()

    // POST /api/orders/update-status { id, status }
    if (route === '/orders/update-status' && method === 'POST') {
      const payload = await safeJson(request)
      const parsed = orderUpdateSchema.safeParse(payload)
      if (!parsed.success) return json(400, { error: 'Invalid payload' })

      const { id, status } = parsed.data
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

      if (error) return json(500, { error: error.message })
      return json(200, { ok: true, order: data })
    }

    // POST /api/admin/create { email, password } - creates auto-confirmed admin
    if (route === '/admin/create' && method === 'POST') {
      const payload = await safeJson(request)
      const parsed = adminCreateSchema.safeParse(payload)
      if (!parsed.success) return json(400, { error: 'Invalid email or password' })

      const { email, password } = parsed.data

      // Check if any admin already exists - prevents anyone from creating new admins later
      const { data: list, error: listErr } = await supabase.auth.admin.listUsers()
      if (listErr) return json(500, { error: listErr.message })
      if ((list?.users?.length || 0) > 0) {
        return json(403, { error: 'An admin already exists. Contact existing admin.' })
      }

      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
      if (error) return json(500, { error: error.message })

      return json(200, { ok: true, user: { id: data.user.id, email: data.user.email } })
    }

    // POST /api/password-change { user_id, new_password }
    if (route === '/password-change' && method === 'POST') {
      const payload = await safeJson(request)
      const parsed = passwordChangeSchema.safeParse(payload)
      if (!parsed.success) return json(400, { error: 'Invalid payload' })

      const { user_id, new_password } = parsed.data
      const { error } = await supabase.auth.admin.updateUserById(user_id, { password: new_password })
      if (error) return json(500, { error: error.message })
      return json(200, { ok: true })
    }

    // GET /api/health/schema - detect if tables exist
    if (route === '/health/schema' && method === 'GET') {
      const tables = ['items', 'categories', 'orders', 'promo_codes', 'settings']
      const missing = []

      for (const t of tables) {
        const { error } = await supabase.from(t).select('*', { count: 'exact', head: true })
        if (error) missing.push({ table: t, error: error.message })
      }

      return json(200, { ok: missing.length === 0, missing })
    }

    return json(404, { error: `Route ${route} not found` })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('API error:', err)
    return json(500, { error: err?.message || 'Server error' })
  }
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const DELETE = handler
export const PATCH = handler

