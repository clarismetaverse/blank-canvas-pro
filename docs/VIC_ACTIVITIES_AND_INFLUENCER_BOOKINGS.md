# VIC activities and influencer bookings

This document explains how VIC activities relate to bookings created by the Claris influencer app.

## Source of truth

`BookingsTurbo` is the source of truth for influencer bookings and activity occurrences.

The fields that define an occurrence are:

- `restaurant_id`: venue identifier.
- `BookingDay`: calendar date of the booking (`YYYY-MM-DD`).
- `user_turbo_id`: influencer who booked.
- `canceled`: canceled bookings must be excluded.
- `ApprovalStatus`, `Approved`, and `Rejectedstatus`: invitation/booking workflow state.

`VICMemberActivities` is a VIC-facing projection. It gives the VIC frontend a stable activity ID, cover, title, organizer, and date, but it is not the booking source.

## Relationship between the tables

One VIC occurrence corresponds to the influencer bookings sharing the same venue and day:

```text
VICMemberActivities.restaurant_turbo_id = BookingsTurbo.restaurant_id
VICMemberActivities.Departure           = BookingsTurbo.BookingDay
BookingsTurbo.canceled                  = false
```

There must be one `VICMemberActivities` row per organizer, restaurant, and occurrence date.

For projected occurrences:

- `Departure` and `Return` come from `BookingsTurbo.BookingDay`.
- `user_turbo_id` contains the unique influencers found in the matching bookings.
- `xdo.booking_source` is `BookingsTurbo`.
- `xdo.booking_count` records the number of matching bookings at the last synchronization.

## Backend flow

### `GET /myactivities`

Returns the `VICMemberActivities` rows belonging to the authenticated VIC organizer. The frontend uses these rows to build the horizontal activity cards.

### `GET /vic_activity`

Returns one `VICMemberActivities` record by ID for the activity detail screen.

### `GET /activity_invited`

1. Loads the requested `VICMemberActivities` row.
2. Loads native VIC invitations from `invitebyVIC`.
3. Loads influencer bookings from `BookingsTurbo` using `restaurant_id + BookingDay`.
4. Converts the bookings into invitation-shaped results with `source: "claris"` and the original `booking_id`.
5. Merges them with native VIC invitations.

Do not filter these bookings with `BookingTimestamp` and `VICMemberActivities.day`. The daily occurrence key is `BookingDay = Departure`.

### `PATCH /activity_invitation_decision`

For a Claris booking, validate that it belongs to the activity with:

```text
booking.restaurant_id = activity.restaurant_turbo_id
booking.BookingDay     = activity.Departure
booking.canceled       = false
```

Approval or rejection then updates the original `BookingsTurbo` record. Native VIC invitations continue to update `invitebyVIC`.

### `ensure_vic_activity_occurrence`

This Xano function projects an existing booking day into `VICMemberActivities`.

Inputs:

- `source_activity_id`: an existing VIC activity used for title, cover, venue, and organizer metadata.
- `occurrence_date`: the `BookingsTurbo.BookingDay` to project.
- `dry_run`: when true, reports the intended operation without writing.

The function:

1. Verifies that matching, non-canceled `BookingsTurbo` rows exist.
2. Collects their unique `user_turbo_id` values.
3. Finds the VIC occurrence by organizer, restaurant, and date.
4. Creates it when missing or synchronizes it when present.

It is safe to run repeatedly because it does not create a second activity for the same occurrence key.

Example:

```powershell
xano function run ensure_vic_activity_occurrence -w 1 `
  --data source_activity_id:=83 `
  --data occurrence_date=2026-08-12 `
  --data dry_run:=true
```

Run again with `dry_run:=false` after reviewing the result.

## Frontend flow

`src/pages/ActivitiesHome.tsx` receives real activity records from `/myactivities`.

- `Starting_Day` maps from `VICMemberActivities.Departure`.
- `Upcoming` contains activities whose `Return` or `Starting_Day` is today or later.
- `Past` contains activities whose end date is before today.
- Cards are sorted by their real backend date.
- Clicking a card opens its real `VICMemberActivities.id`.

The frontend must not manufacture weekly occurrences or reuse a past activity ID with a future date. A missing occurrence must be fixed by projecting the real `BookingsTurbo` data in Xano.

## Rockfish reference case

Venue: Rockfish Cliffside, Uluwatu (`restaurant_id = 1158`).

On 2026-08-08:

- The past VIC occurrence was ID `83`, dated 2026-08-05.
- `BookingsTurbo` contained 14 non-canceled bookings for 2026-08-12.
- VIC occurrence ID `85` was synchronized for 2026-08-12 from those bookings.
- `/activity_invited?vicmembersactivity_id=85` returned the 14 original booking IDs as Claris invitations.

## Verification checklist

For every new occurrence:

1. Query `BookingsTurbo` by `restaurant_id`, `BookingDay`, and `canceled = false`.
2. Confirm the expected booking count and user IDs.
3. Dry-run `ensure_vic_activity_occurrence`.
4. Synchronize the occurrence.
5. Confirm `/myactivities` returns a distinct activity ID and correct `Departure`.
6. Confirm `/activity_invited` returns the original `BookingsTurbo.id` values.
7. Open the card and verify the detail date.
8. Test one invitation decision and confirm it updates the matching `BookingsTurbo` row.

