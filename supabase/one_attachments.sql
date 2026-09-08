-- ONE private attachment storage for screenshots and documents.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'one-attachments',
  'one-attachments',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp','application/pdf']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read own ONE attachments" on storage.objects;
drop policy if exists "Users can insert own ONE attachments" on storage.objects;
drop policy if exists "Users can update own ONE attachments" on storage.objects;
drop policy if exists "Users can delete own ONE attachments" on storage.objects;

create policy "Users can read own ONE attachments"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'one-attachments'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can insert own ONE attachments"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'one-attachments'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can update own ONE attachments"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'one-attachments'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'one-attachments'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can delete own ONE attachments"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'one-attachments'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
