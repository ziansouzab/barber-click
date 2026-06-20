begin;

-- Removes the legacy "one appointment per slot" unique key that predates the
-- appointment_capacity feature. Slot conflicts are enforced atomically inside
-- public.book_appointment (advisory lock + active-capacity count), which is the
-- only insert path because direct INSERT on appointments is revoked.
--
-- The constraint contradicted the feature in two ways:
--   1. it blocked a 2nd booking when appointment_capacity >= 2;
--   2. it kept a cancelled/refused slot occupied (cancel is a soft status change),
--      so a free slot could not be re-booked.

-- Drop it whether it exists as a table constraint or as a bare unique index.
alter table public.appointments
  drop constraint if exists uq_appointments_slot;

drop index if exists public.uq_appointments_slot;

commit;
