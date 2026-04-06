create table if not exists public.projection_constants (
  id integer primary key default 1,
  cost_per_ppc_click numeric not null default 1.37,
  cost_per_call numeric not null default 17.42,
  cost_per_sale numeric not null default 76.84,
  average_sale_value numeric not null default 473.60,
  paid_ad_sales_pct numeric not null default 12.5,
  cost_of_goods_pct numeric not null default 30.0,
  commission_pct numeric not null default 10.0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint projection_constants_single_row check (id = 1)
);

insert into public.projection_constants (id) values (1) on conflict (id) do nothing;

alter table public.projection_constants enable row level security;
create policy "allow_select_all" on public.projection_constants for select using (true);
create policy "allow_update_auth" on public.projection_constants for update using (auth.role() = 'authenticated');
