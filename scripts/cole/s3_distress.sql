-- Cole Property Group Bucket 3 table. Apply in the Cole Supabase project.
create table if not exists s3_distress (
  parcel_id text not null,
  distress_type text not null,
  property_address text, city text, zip text, county text,
  status text, open_case_count int, case_numbers text, case_types text, violations_noted text,
  first_received date, days_open int,
  owner_name text, owner_mailing text, absentee_flag text,
  last_sale_date date, tenure_years numeric, last_sale_price numeric,
  land_use text, zoning text, acres numeric,
  land_appraisal numeric, improvement_appraisal numeric, total_appraisal numeric, land_share numeric,
  score int, lat double precision, lon double precision,
  source text, source_url text, pulled_at timestamptz, as_of date,
  ghl_contact_id text, ghl_pushed_at timestamptz,
  primary key (parcel_id, distress_type)
);
create index if not exists s3_distress_score_idx on s3_distress (score desc, days_open desc);
create index if not exists s3_distress_owner_idx on s3_distress (owner_name);
