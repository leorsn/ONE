-- Apply only to target Supabase NEVER (nywfoprcwbnsxybdqpma) after owner confirms bucket access changes.
-- Source: paused ONE App storage.buckets and storage.objects policies. Private bucket; no user data included.
begin;
do $guard$
begin
  if exists (select 1 from storage.buckets where id = 'one-attachments') then
    raise exception 'NEVER_STORAGE_BUCKET_ALREADY_PRESENT';
  end if;
end
$guard$;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('one-attachments','one-attachments',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf']::text[]);
create policy "Users can delete own ONE attachments" on storage.objects
  for delete to authenticated
  using (bucket_id='one-attachments' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Users can insert own ONE attachments" on storage.objects
  for insert to authenticated
  with check (bucket_id='one-attachments' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Users can read own ONE attachments" on storage.objects
  for select to authenticated
  using (bucket_id='one-attachments' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Users can update own ONE attachments" on storage.objects
  for update to authenticated
  using (bucket_id='one-attachments' and (storage.foldername(name))[1]=(select auth.uid())::text)
  with check (bucket_id='one-attachments' and (storage.foldername(name))[1]=(select auth.uid())::text);
commit;
