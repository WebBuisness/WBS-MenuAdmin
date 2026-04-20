'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, Database, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const SQL = `-- Döner House Admin: run this once in Supabase SQL Editor
-- https://supabase.com/dashboard/project/_/sql

create extension if not exists "pgcrypto";

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_ar text,
  active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_ar text,
  desc_en text,
  desc_ar text,
  category_id uuid references categories(id) on delete set null,
  price numeric(10,2) not null default 0,
  image_url text,
  has_combo boolean default false,
  combo_price numeric(10,2),
  combo_desc_en text,
  combo_desc_ar text,
  available boolean default true,
  rating numeric(3,2) default 0,
  created_at timestamptz default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text,
  phone text,
  address text,
  items jsonb default '[]'::jsonb,
  total numeric(10,2) default 0,
  promo_code text,
  status text default 'pending',
  notes text,
  created_at timestamptz default now()
);

create table if not exists promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  value numeric(10,2) not null default 0,
  active boolean default true,
  used_count int default 0,
  usage_limit int,
  created_at timestamptz default now()
);

create table if not exists settings (
  key text primary key,
  value jsonb,
  updated_at timestamptz default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  target text default 'all',
  sent_at timestamptz default now(),
  recipient_count int default 0
);

insert into settings (key, value) values
  ('whatsapp_number', '"+966500000000"'),
  ('restaurant_open', 'true'),
  ('opening_hours', '{"0":["10:00","22:00"],"1":["10:00","22:00"],"2":["10:00","22:00"],"3":["10:00","22:00"],"4":["10:00","22:00"],"5":["10:00","22:00"],"6":["10:00","22:00"]}'),
  ('restaurant_name', '"Döner House"'),
  ('whatsapp_template', '"🆕 *NEW ORDER: #{{orderNo}}*\\n--------------------------\\n👤 *Customer:* {{name}}\\n📞 *Phone:* {{phone}}\\n📍 *Address:* {{address}}\\n--------------------------\\n🛒 *Items:*\\n{{items}}\\n--------------------------\\n💰 *Total:* ${{total}}\\n💳 *Payment:* Cash on Delivery"')
on conflict (key) do nothing;

-- RLS
alter table items enable row level security;
alter table categories enable row level security;
alter table orders enable row level security;
alter table promo_codes enable row level security;
alter table settings enable row level security;
alter table notifications enable row level security;

-- Drop existing then recreate
drop policy if exists "Admin full access items" on items;
drop policy if exists "Admin full access categories" on categories;
drop policy if exists "Admin full access orders" on orders;
drop policy if exists "Admin full access promo_codes" on promo_codes;
drop policy if exists "Admin full access settings" on settings;
drop policy if exists "Admin full access notifications" on notifications;

create policy "Admin full access items" on items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Admin full access categories" on categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Admin full access orders" on orders for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Admin full access promo_codes" on promo_codes for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Admin full access settings" on settings for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Admin full access notifications" on notifications for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Public read for customer app (menu, categories, settings, promo lookup)
drop policy if exists "Public read items" on items;
drop policy if exists "Public read categories" on categories;
drop policy if exists "Public read settings" on settings;
drop policy if exists "Public insert orders" on orders;
create policy "Public read items" on items for select using (true);
create policy "Public read categories" on categories for select using (true);
create policy "Public read settings" on settings for select using (true);
create policy "Public insert orders" on orders for insert with check (true);

-- Realtime
alter publication supabase_realtime add table orders;
`;

export default function SetupPage() {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(SQL)
    setCopied(true)
    toast.success('SQL copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const sqlEditorUrl = projectUrl?.replace('https://', 'https://supabase.com/dashboard/project/').replace('.supabase.co', '/sql/new')

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Database Setup</h1>
          <p className="text-muted-foreground mt-1">Run this SQL once in Supabase to create tables &amp; policies</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
          <Database className="w-6 h-6 text-orange-500" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            <span className="text-sm font-medium">schema.sql</span>
          </div>
          <div className="flex gap-2">
            <a href={sqlEditorUrl} target="_blank" rel="noopener">
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="w-3.5 h-3.5" /> Open SQL Editor
              </Button>
            </a>
            <Button onClick={copy} size="sm" className="gap-2 bg-orange-500 hover:bg-orange-600 text-white">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy SQL'}
            </Button>
          </div>
        </div>
        <pre className="bg-[#050505] border border-border rounded-lg p-4 text-xs overflow-x-auto max-h-[60vh] font-mono text-muted-foreground">
{SQL}
        </pre>
      </div>

      <ol className="mt-6 space-y-2 text-sm text-muted-foreground">
        <li><span className="text-orange-500 font-mono mr-2">1.</span>Click "Open SQL Editor" to jump to Supabase.</li>
        <li><span className="text-orange-500 font-mono mr-2">2.</span>Paste the SQL and click "Run".</li>
        <li><span className="text-orange-500 font-mono mr-2">3.</span>Come back to <a href="/admin" className="text-orange-500 underline">Dashboard</a>.</li>
      </ol>
    </motion.div>
  )
}
