-- Place summaries are cached per language: the key becomes (place_key, lang).
-- Existing rows are English, which the default labels correctly.
alter table public.place_info add column lang text not null default 'en';
alter table public.place_info drop constraint place_info_pkey;
alter table public.place_info add primary key (place_key, lang);
